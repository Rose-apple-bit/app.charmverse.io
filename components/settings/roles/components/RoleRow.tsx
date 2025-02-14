import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import DoneIcon from '@mui/icons-material/Done';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Button from 'components/common/Button';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import Modal from 'components/common/Modal';
import { bindMenu, bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import styled from '@emotion/styled';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useContributors } from 'hooks/useContributors';
import GuildXYZIcon from 'public/images/guild_logo.svg';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import useIsAdmin from 'hooks/useIsAdmin';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { spaceOperationLabels } from 'lib/permissions/spaces/client';
import RoleForm from './RoleForm';
import RoleMemberRow from './RoleMemberRow';
import SpacePermissions from './SpacePermissions';

interface RoleRowProps {
  isEditable: boolean;
  role: ListSpaceRolesResponse;
  assignRoles: (roleId: string, userIds: string[]) => void;
  deleteRole: (roleId: string) => void;
  unassignRole: (roleId: string, userId: string) => void;
  refreshRoles: () => void;
}

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export default function RoleRow ({ isEditable, role, assignRoles, unassignRole, deleteRole, refreshRoles }: RoleRowProps) {
  const menuState = usePopupState({ variant: 'popover', popupId: `role-${role.id}` });
  const userPopupState = usePopupState({ variant: 'popover', popupId: `role-${role.id}-users` });
  const rolePermissionsPopupState = usePopupState({ variant: 'popover', popupId: `role-permissions-${role.id}` });
  const confirmDeletePopupState = usePopupState({ variant: 'popover', popupId: 'role-delete' });
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [contributors] = useContributors();

  const [currentSpace] = useCurrentSpace();

  const isAdmin = useIsAdmin();

  const roleSpacePermissions = role.spacePermissions?.find(p => p.forSpaceId === currentSpace?.id)?.operations ?? [];

  function showMembersPopup () {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers (ids: string[]) {
    setNewMembers(ids);
  }

  async function addMembers () {
    await assignRoles(role.id, newMembers);
    userPopupState.close();
  }

  const assignedContributors = role.spaceRolesToRole.map(r => r.spaceRole.user);

  function removeMember (userId: string) {
    unassignRole(role.id, userId);
  }

  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });

  let userIdsToHide = role.spaceRolesToRole?.map(spaceRoleToRole => {
    return spaceRoleToRole?.spaceRole?.user?.id;
  }).filter(id => typeof id === 'string') ?? [];

  return (
    <Box mb={3}>
      <Box display='flex' justifyContent='space-between' alignItems='center' pb={0.5}>
        <Box display='flex' gap={1} alignItems='center'>
          <Typography variant='h6' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {role.name} {role.source === 'guild_xyz' ? (
              <Tooltip placement='top' arrow title='This role is managed by Guild XYZ. Visit https://guild.xyz/ to modify this role'>
                <span style={{ display: 'flex' }}>
                  <GuildXYZIcon style={{
                    transform: 'scale(0.75)'
                  }}
                  />
                </span>
              </Tooltip>
            ) : null} {role.spaceRolesToRole.length > 0 && <Chip size='small' label={role.spaceRolesToRole.length} />}
          </Typography>
        </Box>
        {isEditable && (
          <IconButton size='small' {...bindTrigger(menuState)}>
            <MoreHorizIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      {
        roleSpacePermissions.length > 0 && (
          <Box sx={{ mt: 1, mb: 1, display: 'flex', gap: 1 }}>
            {
              roleSpacePermissions.map(operation => (

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  flexDirection: 'row'
                }}
                >
                  <DoneIcon sx={{ fontSize: '18px', mr: 0.5 }} />
                  <Typography variant='caption'>{spaceOperationLabels[operation]}</Typography>

                </div>
              ))
            }
          </Box>
        )
      }

      <ScrollableBox rows={assignedContributors.length}>
        {assignedContributors.map(contributor => (
          <RoleMemberRow
            key={contributor.id}
            contributor={contributor}
            isEditable={isEditable && role.source !== 'guild_xyz'}
            onRemove={(userId) => {
              removeMember(userId);
              userIdsToHide = userIdsToHide.filter(id => id !== userId);
            }}
          />
        ))}
      </ScrollableBox>
      { role.source !== 'guild_xyz'
        ? assignedContributors.length < contributors.length ? (
          isEditable && <Button onClick={showMembersPopup} variant='text' color='secondary'>+ Add members</Button>
        ) : (
          <Typography variant='caption'>All space members have been added to this role</Typography>
        ) : null}

      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {/* We can only rename roles if not managed by Guild.xyv */}
        {role.source !== 'guild_xyz' && (
          <MenuItem
            sx={{ padding: '3px 12px' }}
            onClick={() => {
              popupState.open();
              menuState.close();
            }}
          >
            <ListItemIcon><EditOutlinedIcon fontSize='small' /></ListItemIcon>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Rename</Typography>
          </MenuItem>
        )}
        {/* Only admins can update role space permissions */}
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            rolePermissionsPopupState.open();
            menuState.close();
          }}
        >
          <ListItemIcon><LockOpenIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Manage permissions</Typography>
        </MenuItem>

        {/* Delete this role */}
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            confirmDeletePopupState.open();
            menuState.close();
          }}
        >
          <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>

      <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputSearchContributorMultiple filter={{ mode: 'exclude', userIds: userIdsToHide }} onChange={onChangeNewMembers} />
          </Grid>
          <Grid item>
            <Button onClick={addMembers}>Add</Button>
          </Grid>
        </Grid>
      </Modal>

      {
        rolePermissionsPopupState.isOpen && (
          <Modal size='large' open onClose={rolePermissionsPopupState.close} title={`${role.name} permissions`}>
            <SpacePermissions
              targetGroup='role'
              id={role.id}
              callback={() => {
                refreshRoles();
                rolePermissionsPopupState.close();
              }}
            />
          </Modal>
        )
      }

      <Modal {...bindPopover(popupState)} title='Rename role'>
        <RoleForm
          mode='edit'
          role={role}
          submitted={() => {
            popupState.close();
            refreshRoles();
          }}
        />
      </Modal>

      <ConfirmDeleteModal
        title='Delete role'
        question={`Are you sure you want to delete the ${role.name} role?`}
        buttonText={`Delete ${role.name}`}
        onConfirm={() => {
          deleteRole(role.id);
          menuState.close();
        }}
        onClose={confirmDeletePopupState.close}
        open={confirmDeletePopupState.isOpen}
      />

    </Box>
  );
}
