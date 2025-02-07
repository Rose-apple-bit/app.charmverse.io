import { Application } from '@prisma/client';
import { getBountyOrThrow } from 'lib/bounties';
import { DuplicateDataError, LimitReachedError, StringTooShortError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { ApplicationCreationData } from '../interfaces';
import { submissionsCapReached, MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../shared';

export async function createApplication ({ bountyId, message, userId }: ApplicationCreationData): Promise<Application> {
  const bounty = await getBountyOrThrow(bountyId);

  const existingApplication = bounty.applications.find(app => app.createdBy === userId);

  if (existingApplication) {
    throw new DuplicateDataError('You have already applied to this bounty');
  }

  if (!message || message.length < MINIMUM_APPLICATION_MESSAGE_CHARACTERS) {
    throw new StringTooShortError();
  }

  const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

  if (capReached) {
    throw new LimitReachedError(`The submissions cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's' : ''} has been reached for this bounty.`);
  }

  return prisma.application.create({
    data: {
      status: 'applied',
      message,
      applicant: {
        connect: {
          id: userId
        }
      },
      bounty: {
        connect: {
          id: bountyId
        }
      },
      spaceId: bounty.spaceId
    }
  });
}
