import { Page, PageOperations, Role } from '@prisma/client';
import charmClient from 'charmClient';
import { IPageWithPermissions } from 'lib/pages';
import { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { permissionTemplates } from 'lib/permissions/pages/page-permission-mapping';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { isTruthy } from 'lib/utilities/types';
import useRefState from 'hooks/useRefState';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { untitledPage } from 'seedData';
import { Block } from 'lib/focalboard/block';
import { useCurrentSpace } from './useCurrentSpace';
import { useSpaces } from './useSpaces';
import { useUser } from './useUser';
import useIsAdmin from './useIsAdmin';

export type LinkedPage = (Page & {children: LinkedPage[], parent: null | LinkedPage});

export type PagesMap = Record<string, IPageWithPermissions | undefined>;

export type PagesContext = {
  currentPageId: string,
  pages: PagesMap,
  setPages: Dispatch<SetStateAction<PagesMap>>,
  setCurrentPageId: Dispatch<SetStateAction<string>>,
  isEditing: boolean
  refreshPage: (pageId: string) => Promise<IPageWithPermissions>
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  deletePage: (data: {pageId: string, board?: Block}) => Promise<void>
  getPagePermissions: (pageId: string, page?: IPageWithPermissions) => IPagePermissionFlags,
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const PagesContext = createContext<Readonly<PagesContext>>({
  currentPageId: '',
  pages: {},
  setCurrentPageId: () => '',
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { },
  getPagePermissions: () => new AllowedPagePermissions(),
  refreshPage: () => Promise.resolve({} as any),
  deletePage: () => Promise.resolve({} as any)
});

export function PagesProvider ({ children }: { children: ReactNode }) {

  const isAdmin = useIsAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [spaceFromUrl] = useCurrentSpace();
  const [pages, pagesRef, setPages] = useRefState<PagesContext['pages']>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const { user } = useUser();

  // retrieve space for public pages
  const [spaces] = useSpaces();
  const publicPageSpace = router.route === '/share/[...pageId]' ? spaces[0] : null;
  const space = spaceFromUrl || publicPageSpace;

  const { data, mutate } = useSWR(() => space ? `pages/${space?.id}` : null, () => {

    if (!space) {
      return [];
    }

    const isPublicBountiesPage = (router.route === '/share/[...pageId]') && (router.query.pageId?.[1] === 'bounties');
    if (isPublicBountiesPage) {
      // retrieve the pages we need for public bounties
      return charmClient.bounties.listBounties(space.id, true)
        .then(bounties => bounties.map(bounty => bounty.page).filter(isTruthy));
    }
    else {
      return charmClient.getPages(space.id);
    }
  }, { refreshInterval });

  const _setPages: Dispatch<SetStateAction<PagesMap>> = (_pages) => {
    const res = _pages instanceof Function ? _pages(pagesRef.current) : _pages;
    mutate(() => Object.values(res).filter(isTruthy), {
      revalidate: false
    });
    return res;
  };

  /**
   * Will return permissions for the currently connected user
   * @param pageId
   */
  function getPagePermissions (pageId: string, page?: IPageWithPermissions): IPagePermissionFlags {
    const computedPermissions = new AllowedPagePermissions();

    const targetPage = (pages[pageId] as IPageWithPermissions) ?? page;

    // Return empty permission set so this silently fails
    if (!targetPage) {
      return computedPermissions;
    }
    const userSpaceRole = user?.spaceRoles.find(spaceRole => spaceRole.spaceId === targetPage.spaceId);

    // For now, we allow admin users to override explicitly assigned permissions
    if (isAdmin) {
      computedPermissions.addPermissions(Object.keys(PageOperations) as PageOperationType []);
      return computedPermissions;
    }

    const applicableRoles: Role [] = userSpaceRole?.spaceRoleToRole?.map(spaceRoleToRole => spaceRoleToRole.role) ?? [];

    targetPage.permissions?.forEach(permission => {

      // User gets permission via role or as an individual
      const shouldApplyPermission = (permission.userId && permission.userId === user?.id)
        || (permission.roleId && applicableRoles.some(role => role.id === permission.roleId))
        || (userSpaceRole && permission.spaceId === userSpaceRole.spaceId) || permission.public === true;

      if (shouldApplyPermission) {

        const permissionsToEnable = permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel];

        computedPermissions.addPermissions(permissionsToEnable);
      }
    });

    return computedPermissions;
  }

  async function deletePage ({ pageId, board }: {pageId: string, board?: Block}) {
    const page = pages[pageId];
    const totalNonArchivedPages = Object.values(pages).filter((p => p?.deletedAt === null && (p?.type === 'page' || p?.type === 'board'))).length;

    if (page && user && space) {
      const { pageIds } = await charmClient.archivePage(page.id);
      let newPage: null | IPageWithPermissions = null;
      if (totalNonArchivedPages - pageIds.length === 0 && pageIds.length !== 0) {
        newPage = await charmClient.createPage(untitledPage({
          userId: user.id,
          spaceId: space.id
        }));
      }

      // Delete the page associated with the card
      if (board) {
        mutator.deleteBlock(
          board,
          'Delete board',
          async () => {
            // success
          },
          async () => {
            // error
          }
        );
      }

      setPages((_pages) => {
        pageIds.forEach(_pageId => {
          _pages[_pageId] = {
            ..._pages[_pageId],
            deletedAt: new Date()
          } as IPageWithPermissions;
        });
        // If a new page was created add that to state
        if (newPage) {
          _pages[newPage.id] = newPage;
        }
        return { ..._pages };
      });
    }
  }

  async function refreshPage (pageId: string): Promise<IPageWithPermissions> {
    const freshPageVersion = await charmClient.getPage(pageId);
    _setPages(_pages => ({
      ..._pages,
      [freshPageVersion.id]: freshPageVersion
    }));

    return freshPageVersion;
  }

  const value: PagesContext = useMemo(() => ({
    currentPageId,
    isEditing,
    setIsEditing,
    deletePage,
    pages,
    setCurrentPageId,
    setPages: _setPages,
    getPagePermissions,
    refreshPage
  }), [currentPageId, isEditing, router, pages, user]);

  useEffect(() => {
    if (data) {
      setPages(data.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
    }
  }, [data]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
