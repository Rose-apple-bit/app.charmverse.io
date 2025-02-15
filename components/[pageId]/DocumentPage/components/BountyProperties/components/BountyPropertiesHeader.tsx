import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { BountyPermissions } from 'lib/bounties';
import { PagePermission } from '@prisma/client';
import { compareBountyPagePermissions } from 'lib/permissions/compareBountyPagePermissions';
import { BountyPagePermissionIntersection } from 'lib/permissions/interfaces';
import useRoles from 'hooks/useRoles';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useState } from 'react';

/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  bounty: BountyWithDetails,
  bountyPermissions?: Partial<BountyPermissions>,
  pagePermissions?: PagePermission[]
  pageId: string
}

export default function BountyPropertiesHeader ({ bounty, bountyPermissions, pagePermissions, pageId }: Props) {

  const { roleups } = useRoles();
  const { pages, setPages } = usePages();
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const intersection: BountyPagePermissionIntersection = (!bountyPermissions || !pagePermissions || !roleups)
    ? { hasPermissions: [], missingPermissions: [] } : compareBountyPagePermissions({
      bountyPermissions,
      pagePermissions,
      bountyOperations: ['work'],
      pageOperations: ['edit_content'],
      roleups
    });

  function restrictPermissions () {
    setUpdatingPermissions(true);
    charmClient.restrictPagePermissions({
      pageId
    }).then(page => {
      setPages({
        ...pages,
        [page.id]: page
      });
      showMessage('Page permissions updated', 'success');
    })
      .finally(() => setUpdatingPermissions(false));
  }

  return (
    <>
      {/* Bounty price and status  */}
      <Grid container mb={2}>
        <Grid item xs={8}>
          <Typography fontWeight='bold'>Bounty information</Typography>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{
            justifyContent: 'flex-end',
            gap: 1,
            display: 'flex',
            alignItems: 'center'
          }}
          >

            {/* Provide the bounty menu options */}
            <Box display='flex'>
              <BountyStatusBadge
                bounty={bounty}
                truncate
              />
            </Box>

          </Box>
        </Grid>

      </Grid>

      {/* Warning for applicants */}
      {
        intersection.hasPermissions.length > 0 && (
          <Alert
            severity='info'
            sx={{ mb: 2 }}
            action={(
              <Tooltip title={'Update this bounty\'s page permissions to view-only (except for the bounty creator).'}>
                <Button size='small' variant='outlined' onClick={restrictPermissions} loading={updatingPermissions}>
                  Restrict editing
                </Button>
              </Tooltip>
            )}
          >
            The current permissions allow applicants to edit the details of this bounty.
          </Alert>
        )
      }

    </>
  );
}
