
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { IPageWithPermissions, ModifyChildPagesResponse } from 'lib/pages';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { resolvePageTree } from 'lib/pages/server';
import { getPage } from 'lib/pages/server/getPage';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { UndesirableOperationError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['id'], 'query'))
  .get(getPageRoute)
  // Only require user on update and delete
  .use(requireUser)
  .put(updatePage)
  .delete(deletePage);

async function getPageRoute (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const page = await getPage(pageId, req.query.spaceId as string | undefined);

  if (!page) {
    throw new NotFoundError();
  }

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await computeUserPagePermissions({
    pageId: page.id,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  return res.status(200).json(page);
}

async function updatePage (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page ?? {};
  if ((typeof updateContent.index === 'number' || updateContent.parentId !== undefined) && permissions.edit_position !== true) {
    throw new ActionNotPermittedError('You do not have permission to reposition this page');
  }
  // Allow user with View & Comment permission to edit the page content
  // This is required as in order to create a comment, the page needs to be updated
  else if (permissions.edit_content !== true && permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true
    }
  });

  if (!page) {
    throw new NotFoundError();
  }

  const hasNewParentPage = (updateContent.parentId !== page.parentId && (typeof updateContent.parentId === 'string' || updateContent.parentId === null));

  // Only perform validation if repositioning below another page
  if (hasNewParentPage && typeof updateContent.parentId === 'string') {
    const { flatChildren } = await resolvePageTree({
      pageId,
      flattenChildren: true
    });

    const newParentId = updateContent.parentId as string;

    if (newParentId === pageId || flatChildren.some(p => p.id === newParentId)) {
      throw new UndesirableOperationError(`You cannot reposition a page to be a child of ${newParentId === pageId ? 'itself' : 'one of its child pages'}`);
    }
  }

  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: userId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  if (hasNewParentPage) {
    const updatedPage = await setupPermissionsAfterPageRepositioned(pageId);
    return res.status(200).json(updatedPage);
  }

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: pageId
    }
  });

  const modifiedChildPageIds = await modifyChildPages(pageId, userId, 'delete');

  return res.status(200).json({ pageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
