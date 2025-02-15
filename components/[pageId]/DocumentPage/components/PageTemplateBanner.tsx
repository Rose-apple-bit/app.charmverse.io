import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import { BackIcon } from 'components/common/Icons/BackIcon';
import { DocumentPageIcon } from 'components/common/Icons/DocumentPageIcon';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { IPageWithPermissions } from 'lib/pages';

const StyledPageTemplateBanner = styled(Box)<{card?: boolean}>`

  top: ${({ card }) => card ? '50px' : '55px'};
  width: ${({ card }) => card ? '100%' : 'calc(100% - 300px)'};
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.templateBanner.text};
  background-color: ${({ theme }) => theme.palette.templateBanner.background};
  padding: ${({ theme }) => theme.spacing(1.4)};
`;

export function PageTemplateBanner ({ pageId }: {pageId: string}) {
  const [space] = useCurrentSpace();
  const { pages } = usePages();

  const theme = useTheme();
  const page = pages[pageId] as IPageWithPermissions;

  const isShowingCard = page.type.match('card') !== null;
  const board = isShowingCard ? pages[page.parentId as string] as IPageWithPermissions : undefined;

  const boardPath = board ? `/${space?.domain}/${board?.path}` : undefined;

  if (!page.type.match('template')) {
    return null;
  }

  return (
    <StyledPageTemplateBanner card={isShowingCard}>
      <Grid container display='flex' gap={1} alignItems='center' fontSize={theme.palette.templateBanner.fontSize}>
        <Grid item xs={2}>
          {
            isShowingCard && (
              <Link
                href={boardPath as string}
                color={theme.palette.secondary.main}
              >
                <BackIcon label='Back' iconSize='small' fontSize='14px' />
              </Link>
            )
          }
        </Grid>
        <Grid item xs={8} display='flex' justifyContent='center'>
          {
          !isShowingCard ? (
            <span>
              You're editing a template
            </span>
          ) : (
            <>
              <span>
                You're editing a template in
              </span>

              <Link
                href={boardPath as string}
                sx={{
                  textDecoration: 'underline',
                  textDecorationThickness: '0.1rem',
                  marginBottom: '1px',
                  marginLeft: 1
                }}
                color={theme.palette.templateBanner.highlightedText}
              >
                <DocumentPageIcon iconSize='small' fontSize={theme.palette.templateBanner.fontSize} label={board?.title || 'Untitled'} />
              </Link>
            </>
          )
        }
        </Grid>
      </Grid>
    </StyledPageTemplateBanner>
  );
}
