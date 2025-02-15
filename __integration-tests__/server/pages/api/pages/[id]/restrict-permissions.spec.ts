/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { BountyWithDetails } from 'models';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { IPageWithPermissions } from 'lib/pages';

let user: User;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  user = generated.user;
  space = generated.space;
  cookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: user.addresses[0]
    })).headers['set-cookie'][0];
});

describe('POST /api/pages/{pageId}/restrict-permissions - Lock down bounty page permissions to the creator', () => {

  it('should allow a user with the edit_content permission to lock the bounty page permissions, returning the new Bounty page and responding with 200', async () => {

    const submitterUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [{
          group: 'user',
          id: user.id
        }],
        submitter: [{
          group: 'space',
          id: space.id
        }]
      },
      pagePermissions: [{
        permissionLevel: 'editor',
        userId: user.id
      },
      {
        permissionLevel: 'view_comment',
        spaceId: space.id
      }, {
        permissionLevel: 'editor',
        userId: submitterUser.id
      }]
    });

    const { permissions } = (await request(baseUrl)
      .post(`/api/pages/${bounty.page.id}/restrict-permissions`)
      .set('Cookie', cookie)
      .send({})
      .expect(200)).body as IPageWithPermissions;

    expect(permissions.length).toBe(3);
    expect(permissions.some(p => p.userId === user.id && p.permissionLevel === 'full_access'));
    expect(permissions.some(p => p.userId === submitterUser.id && p.permissionLevel === 'view'));
    expect(permissions.some(p => p.spaceId === space.id && p.permissionLevel === 'view'));
  });

  it('should allow an admin without the edit_content permission to lock the bounty page permissions, returning the new Bounty page and responding with 200', async () => {

    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: space.id
    });

    const adminCookie = await loginUser(adminUser);

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [{
          group: 'user',
          id: user.id
        }],
        submitter: [{
          group: 'space',
          id: space.id
        }]
      },
      pagePermissions: [{
        permissionLevel: 'editor',
        userId: user.id
      },
      {
        permissionLevel: 'view_comment',
        spaceId: space.id
      }]
    });

    const { permissions } = (await request(baseUrl)
      .post(`/api/pages/${bounty.page.id}/restrict-permissions`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(200)).body as IPageWithPermissions;

    expect(permissions.length).toBe(2);
    expect(permissions.some(p => p.userId === user.id && p.permissionLevel === 'full_access'));
    expect(permissions.some(p => p.spaceId === space.id && p.permissionLevel === 'view'));
  });

  it('should fail if the non-admin user does not have the lock permission and respond with 401', async () => {

    const extraNonAdminUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(extraNonAdminUser);

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [{
          group: 'user',
          id: user.id
        }],
        submitter: [{
          group: 'space',
          id: space.id
        }]
      },
      pagePermissions: [{
        permissionLevel: 'editor',
        userId: user.id
      },
      {
        permissionLevel: 'view_comment',
        spaceId: space.id
      }]
    });

    await request(baseUrl)
      .post(`/api/pages/${bounty.page.id}/restrict-permissions`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(401);
  });

});
