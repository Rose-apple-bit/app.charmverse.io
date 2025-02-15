import styled from '@emotion/styled';
import { Box, Collapse, Menu, MenuItem, ListItemText, ListItemIcon, Paper, Typography, Button, ListItem, IconButton, ButtonProps, Tooltip, SxProps } from '@mui/material';
import { useTheme } from '@emotion/react';
import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { CommentWithUser } from 'lib/comments/interfaces';
import UserDisplay from 'components/common/UserDisplay';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { forwardRef, memo, MouseEvent, useRef, useState } from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { PageContent } from 'models';
import { removeInlineCommentMark } from 'lib/inline-comments/removeInlineCommentMark';
import { useEditorViewContext } from '@bangle.dev/react';
import { DateTime } from 'luxon';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { usePopupState, bindMenu } from 'material-ui-popup-state/hooks';
import { BoxProps } from '@mui/system';
import { usePreventReload } from 'hooks/usePreventReload';
import InlineCharmEditor from '../InlineCharmEditor';
import { checkForEmpty } from '../utils';
import { scrollToThread } from './inlineComment/inlineComment.utils';

const ContextBorder = styled.div`
  width: 3px;
  border-radius: 3px;
  margin-left: 2px;
  margin-right: 8px;
  background: rgba(255, 212, 0, 0.8);
  flex-shrink: 0;
  padding-bottom: 2px;
`;

const StyledPageThread = styled(Paper)<{ inline: string }>`
  overflow: ${({ inline }) => inline === 'true' ? 'auto' : 'unset'};
  padding: ${({ theme, inline }) => theme.spacing(inline === 'true' ? 2 : 1)};
  background: ${({ theme }) => theme.palette.background.light};
  width: ${({ inline }) => inline === 'true' ? '500px' : 'inherit'};
  max-height: ${({ inline }) => inline === 'true' ? '350px' : 'fit-content'};
`;

const ThreadHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)}
`;

const ThreadCommentListItem = styled(ListItem)<{ highlighted?: string }>`
  background: ${({ highlighted }) => highlighted === 'true' ? 'rgba(46, 170, 220, 0.15)' : 'inherit'};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  & .ProseMirror.bangle-editor {
    padding: 0px;
  }

  &:hover .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 1;
  }

  & .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 0;
  }
`;

function ThreadHeaderButton ({ disabled = false, onClick, text, startIcon, ...props }: {disabled?: boolean, onClick: ButtonProps['onClick'], text: string} & ButtonProps) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      startIcon={startIcon}
      variant='outlined'
      color='secondary'
      size='small'
      sx={{
        '.label:hover': {
          color: 'text.primary'
        }
      }}
      {...props}
    >
      <span className='label'>
        {text}
      </span>
    </Button>
  );
}

function AddCommentCharmEditor (
  { sx, threadId, disabled, onClick, readOnly }:
  {onClick: (cb: () => void) => void, readOnly: boolean, disabled: boolean, threadId: string, sx: SxProps}
) {
  const [commentContent, setCommentContent] = useState<PageContent | null>(null);
  const theme = useTheme();
  const isEmpty = checkForEmpty(commentContent);
  const { addComment, threads } = useThreads();
  const thread = threads[threadId] as ThreadWithCommentsAndAuthors;

  const touched = useRef(false);

  usePreventReload(touched.current);

  return (
    <Box display='flex' px={1} pb={1} sx={sx} flexDirection='column' gap={1} mt={thread.comments.length !== 0 ? 1 : 0}>
      <InlineCharmEditor
        style={{
          backgroundColor: theme.palette.background.default
        }}
        key={thread.comments[thread.comments.length - 1]?.id}
        content={commentContent}
        onContentChange={({ doc }) => {
          setCommentContent(doc);
          touched.current = true;
        }}
        readOnly={readOnly || disabled}
      />
      <Box display='flex' gap={1}>
        <Button
          disabled={disabled || isEmpty}
          size='small'
          onClick={() => {
            onClick(() => {
              if (commentContent) {
                addComment(threadId, commentContent);
              }
            });
          }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
}

function EditCommentCharmEditor ({ disabled, isEditable, threadId, commentId, onContainerClick, onSave, onCancel }: {disabled: boolean, isEditable: boolean, onCancel: ButtonProps['onClick'], threadId: string, commentId: string, onContainerClick: BoxProps['onClick'], onSave: (cb: () => Promise<void>) => void}) {
  const [commentContent, setCommentContent] = useState<PageContent | null>(null);
  const isEmpty = checkForEmpty(commentContent);
  const { editComment, threads } = useThreads();
  const thread = threads[threadId] as ThreadWithCommentsAndAuthors;
  const comment = thread.comments.find(_comment => _comment.id === commentId) as CommentWithUser;

  return (
    <>
      <Box
        onClick={onContainerClick}
        flex={1}
        width='100%'
      >
        <Box sx={{ marginLeft: `${32 - 4}px`, paddingLeft: '4px', bgcolor: isEditable ? 'background.default' : '' }}>
          <InlineCharmEditor
            readOnly={!isEditable}
            key={comment.id + isEditable}
            content={comment.content as PageContent}
            onContentChange={({ doc }) => {
              setCommentContent(doc);
            }}
            noPadding={true}
            style={{
              fontSize: 14,
              width: '100%'
            }}
          />
        </Box>
      </Box>
      <Collapse
        sx={{
          pl: 4
        }}
        in={isEditable}
      >
        <Box display='flex' gap={1} pt={1}>
          <Button
            disabled={disabled || isEmpty}
            size='small'
            onClick={async () => {
              onSave(async () => {
                if (commentContent) {
                  await editComment(threadId, comment.id, commentContent);
                }
              });
            }}
          >
            Save
          </Button>
          <Button
            onClick={onCancel}
            variant='outlined'
            color='secondary'
            size='small'
          >
            Cancel
          </Button>
        </Box>
      </Collapse>
    </>
  );
}

interface PageThreadProps {
  threadId: string;
  inline?: boolean;
  showFindButton?: boolean;
}

function ThreadCreatedDate ({ createdAt }: {createdAt: Date}) {
  return (
    <Tooltip arrow placement='top' title={new Date(createdAt).toLocaleString()}>
      <Typography
        sx={{
          cursor: 'pointer',
          pl: 1
        }}
        color='secondary'
        variant='subtitle1'
        display='flex'
        flexDirection='row'
      >
        Started {DateTime.fromJSDate(new Date(createdAt)).toRelative({ base: (DateTime.now()), style: 'short' })}
      </Typography>
    </Tooltip>
  );
}

const CommentDate = memo<{createdAt: Date, updatedAt?: Date | null}>(({ createdAt, updatedAt }) => {
  return (
    <Typography
      sx={{
        cursor: 'default',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center'
      }}
      color='secondary'
      variant='subtitle1'
    >
      <Tooltip arrow placement='top' title={new Date(createdAt).toLocaleString()}>
        <span>
          {DateTime.fromJSDate(new Date(createdAt)).toRelative({ base: DateTime.now(), style: 'short' })}
        </span>
      </Tooltip>
      {updatedAt && (
        <Tooltip arrow placement='top' title={new Date(updatedAt).toLocaleString()}>
          <span style={{ marginLeft: '4px' }}>
            (edited)
          </span>
        </Tooltip>
      )}
    </Typography>
  );
});

const PageThread = forwardRef<HTMLDivElement, PageThreadProps>(({ showFindButton = false, threadId, inline = false }, ref) => {
  showFindButton = showFindButton ?? (!inline);
  const { deleteThread, resolveThread, deleteComment, threads } = useThreads();
  const { user } = useUser();
  const [isMutating, setIsMutating] = useState(false);
  const [editedCommentId, setEditedCommentId] = useState<null | string>(null);
  const { getPagePermissions, currentPageId } = usePages();
  const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });
  const [actionComment, setActionComment] = useState<null | CommentWithUser>(null);

  const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();
  const view = useEditorViewContext();
  const thread = threadId ? threads[threadId] as ThreadWithCommentsAndAuthors : null;

  function resetState () {
    setEditedCommentId(null);
    setIsMutating(false);
  }

  function onClickCommentActions (event: MouseEvent<HTMLButtonElement, MouseEvent>, comment: CommentWithUser) {
    setActionComment(comment);
    menuState.open(event.currentTarget);
  }

  function onClickEditComment () {
    if (actionComment) {
      setEditedCommentId(actionComment.id);
    }
    menuState.close();
  }

  async function onClickDeleteComment () {

    if (actionComment && thread) {
      // If we delete the last comment, delete the whole thread
      if (thread.comments.length === 1) {
        setIsMutating(true);
        await deleteThread(threadId);
        removeInlineCommentMark(view, thread.id, true);
        setIsMutating(false);
      }
      else {
        setIsMutating(true);
        deleteComment(threadId, actionComment.id);
        if (editedCommentId === actionComment.id) {
          resetState();
        }
        setIsMutating(false);
      }
    }
    menuState.close();
  }

  async function toggleResolved () {
    setIsMutating(true);
    await resolveThread(threadId);
    removeInlineCommentMark(view, threadId);
    setIsMutating(false);
  }

  if (!thread) {
    return null;
  }

  return (
    <StyledPageThread inline={inline.toString()} id={`thread.${threadId}`} ref={ref}>
      <div>
        <ThreadHeader>
          <ThreadCreatedDate createdAt={thread.createdAt} />
        </ThreadHeader>
        {thread.comments.map((comment, commentIndex) => {
          const isEditable = comment.id === editedCommentId;
          return (
            <ThreadCommentListItem
              key={comment.id}
              highlighted={(editedCommentId === comment.id).toString()}
              id={`comment.${comment.id}`}
            >
              <Box display='flex' width='100%' alignItems='center' justifyContent='space-between'>
                <Box
                  display='flex'
                  gap={1}
                  onClick={() => {
                    if (showFindButton) {
                      scrollToThread(threadId);
                    }
                  }}
                >
                  <UserDisplay
                    component='div'
                    user={comment.user}
                    avatarSize='small'
                    sx={{
                      '& .MuiTypography-root': {
                        maxWidth: commentIndex === 0 && thread.resolved ? 100 : 150,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }
                    }}
                    fontSize={14}
                    fontWeight={500}
                  />
                  <CommentDate createdAt={comment.createdAt} updatedAt={comment.updatedAt} />
                </Box>
                <div>
                  {commentIndex === 0 ? (
                    <ThreadHeaderButton
                      text={thread.resolved ? 'Un-resolve' : 'Resolve'}
                      endIcon={(
                        <MoreHorizIcon
                          onClick={(e: any) => {
                            e.stopPropagation();
                            onClickCommentActions(e, comment);
                          }}
                          fontSize='small'
                        />
                      )}
                      disabled={isMutating || !permissions.comment}
                      onClick={toggleResolved}
                    />
                  ) : (comment.userId === user?.id && permissions.comment)
                  && (
                    <IconButton
                      className='comment-actions'
                      size='small'
                      onClick={(e: any) => {
                        e.stopPropagation();
                        onClickCommentActions(e, comment);
                      }}
                    >
                      <MoreHorizIcon fontSize='small' />
                    </IconButton>
                  )}
                </div>
              </Box>
              {commentIndex === 0 && (
                <Box
                  pl={4}
                  pb={1}
                  display='flex'
                  onClick={() => {
                    if (showFindButton) {
                      scrollToThread(threadId);
                    }
                  }}
                >
                  <ContextBorder />
                  <Typography
                    sx={{
                      wordBreak: 'break-all',
                      textAlign: 'justify'
                    }}
                    fontSize={14}
                    fontWeight={600}
                    color='secondary'
                  >
                    {thread.context}
                  </Typography>
                </Box>
              )}

              <EditCommentCharmEditor
                commentId={comment.id}
                disabled={isMutating}
                isEditable={isEditable}
                onCancel={resetState}
                onContainerClick={() => {
                  // Shouldn't scroll if we are in comment edit mode
                  if (showFindButton && !isEditable) {
                    scrollToThread(threadId);
                  }
                }}
                onSave={async (cb) => {
                  setIsMutating(true);
                  await cb();
                  resetState();
                }}
                threadId={thread.id}
              />
            </ThreadCommentListItem>
          );
        })}
        <Menu
          {...bindMenu(menuState)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={onClickEditComment}>
            <ListItemIcon><EditIcon /></ListItemIcon>
            <ListItemText>Edit comment</ListItemText>
          </MenuItem>
          <MenuItem onClick={onClickDeleteComment}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete comment</ListItemText>
          </MenuItem>
        </Menu>
      </div>
      {permissions.comment && (
        <AddCommentCharmEditor
          key={thread.comments[thread.comments.length - 1]?.id}
          readOnly={Boolean(editedCommentId)}
          sx={{
            display: 'flex',
            px: 1,
            pb: 1,
            flexDirection: 'column',
            gap: 1,
            mt: thread.comments.length !== 0 ? 1 : 0
          }}
          disabled={!!editedCommentId || isMutating}
          threadId={thread.id}
          onClick={(cb) => {
            if (editedCommentId) {
              return;
            }
            setIsMutating(true);
            cb();
            resetState();
          }}
        />
      )}
    </StyledPageThread>
  );
});

export default PageThread;
