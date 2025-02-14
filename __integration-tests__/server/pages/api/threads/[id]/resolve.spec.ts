/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Space, Thread, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken, generateCommentWithThreadAndPage, generateSpaceUser } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';
import { ThreadCreate, ThreadWithCommentsAndAuthors } from 'lib/threads';
import { upsertPermission } from 'lib/permissions/pages';
import { CommentCreate, CommentWithUser } from 'lib/comments';
import { prisma } from 'db';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: User;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.addresses[0]
    })).headers['set-cookie'][0];

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: adminUser.addresses[0]
    })).headers['set-cookie'][0];
});

describe('PUT /api/threads/{id} - update a comment', () => {

  it('should update the thread status if the user has the comment permissions, and respond 200', async () => {

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'view_comment',
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .put(`/api/threads/${thread.id}/resolve`)
      .set('Cookie', nonAdminCookie)
      .send({ resolved: true })
      .expect(200);
  });

  it('should fail if the user does not have comment permission, even if they are a space admin, and respond 401', async () => {

    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const otherAdminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: otherAdminUser.addresses[0]
      })).headers['set-cookie'][0];

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .put(`/api/threads/${thread.id}/resolve`)
      .set('Cookie', otherAdminCookie)
      .send({ resolved: true })
      .expect(401);
  });

});

describe('DELETE /api/threads/{id} - delete a thread', () => {

  it('should delete the thread if the user has comment permissions it, and respond 200', async () => {

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'view_comment',
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .delete(`/api/threads/${thread.id}`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(200);

    const inexistentThread = await prisma.thread.findUnique({
      where: {
        id: thread.id
      }
    });

    expect(inexistentThread).toBeNull();

  });

  it('should fail if the user did not create the thread, and respond 401', async () => {

    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const otherAdminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: otherAdminUser.addresses[0]
      })).headers['set-cookie'][0];

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .delete(`/api/threads/${thread.id}`)
      .set('Cookie', otherAdminCookie)
      .send({})
      .expect(401);
  });

});
