import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import { Box, BoxProps, InputLabel, List, MenuItem, Select, SelectProps, Typography } from '@mui/material';
import PageThread from 'components/common/CharmEditor/components/PageThread';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { highlightDomElement, silentlyUpdateURL } from 'lib/browser';
import { findTotalInlineComments } from 'lib/inline-comments/findTotalInlineComments';
import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { isTruthy } from 'lib/utilities/types';
import { useEffect, useState } from 'react';
import PageActionToggle from './PageActionToggle';

const Center = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const StyledPageThreadsBox = styled(Box)`
  max-width: 400px;
  height: 100%;
  width: 100%;
`;

export const StyledSidebar = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
`;

const EmptyThreadContainerBox = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

function getCommentFromThreads (threads: (ThreadWithCommentsAndAuthors | undefined)[], commentId: string) {
  if (!threads) {
    return null;
  }

  for (let threadIdx = 0; threadIdx < threads.length; threadIdx += 1) {
    const thread = threads[threadIdx];
    if (thread) {
      for (let commentIdx = 0; commentIdx < thread.comments.length; commentIdx += 1) {
        if (thread.comments[commentIdx].id === commentId) {
          return thread.comments[commentIdx];
        }
      }
    }
  }
  return null;
}

export default function CommentsSidebar ({ sx, inline, ...props }: BoxProps & {inline?: boolean}) {

  const { threads } = useThreads();
  const { user } = useUser();

  const allThreads = Object.values(threads);
  const unResolvedThreads = allThreads.filter(thread => thread && !thread.resolved) as ThreadWithCommentsAndAuthors[];
  const resolvedThreads = allThreads.filter(thread => thread && thread.resolved) as ThreadWithCommentsAndAuthors[];
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');
  const [threadSort, setThreadSort] = useState<'earliest' | 'latest' | 'position'>('position');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };
  const handleThreadListSortChange: SelectProps['onChange'] = (event) => {
    setThreadSort(event.target.value as any);
  };

  const { setCurrentPageActionDisplay } = usePageActionDisplay();

  let threadList: ThreadWithCommentsAndAuthors[] = [];
  if (threadFilter === 'resolved') {
    threadList = resolvedThreads;
  }
  else if (threadFilter === 'open') {
    threadList = unResolvedThreads;
  }
  else if (threadFilter === 'all') {
    threadList = allThreads as ThreadWithCommentsAndAuthors[];
  }
  else if (threadFilter === 'you') {
    // Filter the threads where there is at-least a single comment by the current user
    threadList = unResolvedThreads.filter(unResolvedThread => unResolvedThread.comments.some(comment => comment.userId === user?.id));
  }

  const view = useEditorViewContext();
  // Making sure the position sort doesn't filter out comments that are not in the view
  const inlineThreadsIds = threadSort === 'position' ? Array.from(new Set([...findTotalInlineComments(view.state.schema, view.state.doc, threads, true).threadIds, ...allThreads.map(thread => thread?.id).filter(isTruthy)])) : [];

  let sortedThreadList: ThreadWithCommentsAndAuthors[] = [];
  if (threadSort === 'earliest') {
    sortedThreadList = threadList.sort(
      (threadA, threadB) => threadA && threadB ? new Date(threadA.createdAt).getTime() - new Date(threadB.createdAt).getTime() : 0
    );
  }
  else if (threadSort === 'latest') {
    sortedThreadList = threadList.sort(
      (threadA, threadB) => threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
    );
  }
  else {
    const threadListSet = new Set(threadList.map(thread => thread.id));
    const filteredThreadIds = inlineThreadsIds.filter(inlineThreadsId => threadListSet.has(inlineThreadsId));
    sortedThreadList = filteredThreadIds.map(filteredThreadId => threads[filteredThreadId] as ThreadWithCommentsAndAuthors);
  }

  useEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab
    const highlightedCommentId = (new URLSearchParams(window.location.search)).get('commentId');
    if (highlightedCommentId) {
      const highlightedComment = getCommentFromThreads(allThreads, highlightedCommentId);
      if (highlightedComment) {
        const highlightedCommentDomNode = document.getElementById(`comment.${highlightedComment.id}`);
        if (highlightedCommentDomNode) {
          setTimeout(() => {
            setCurrentPageActionDisplay('comments');
            setThreadFilter('all');
            // Remove query parameters from url
            silentlyUpdateURL(window.location.href.split('?')[0]);
            requestAnimationFrame(() => {
              highlightedCommentDomNode.scrollIntoView({
                behavior: 'smooth'
              });
              setTimeout(() => {
                requestAnimationFrame(() => {
                  highlightDomElement(highlightedCommentDomNode);
                });
              }, 250);
            });
          }, 250);
        }
      }
    }
  }, [allThreads, window.location.search]);

  return (
    <StyledPageThreadsBox
      {...props}
      sx={{
        ...(sx ?? {}),
        display: 'flex',
        gap: 1,
        flexDirection: 'column'
      }}
    >
      <Box display='flex' gap={1}>
        <PageActionToggle />
        <Typography fontWeight={600} fontSize={20}>Comments</Typography>
      </Box>
      <Box display='flex' alignItems='center' gap={1}>
        <InputLabel>Sort</InputLabel>
        <Select variant='outlined' value={threadSort} onChange={handleThreadListSortChange}>
          <MenuItem value='position'>Position</MenuItem>
          <MenuItem value='latest'>Latest</MenuItem>
          <MenuItem value='earliest'>Earliest</MenuItem>
        </Select>
        <InputLabel>Filter</InputLabel>
        <Select variant='outlined' value={threadFilter} onChange={handleThreadClassChange}>
          <MenuItem value='open'>Open</MenuItem>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='you'>For you</MenuItem>
          <MenuItem value='all'>All</MenuItem>
        </Select>
      </Box>
      <StyledSidebar className='charm-inline-comment-sidebar'>
        {sortedThreadList.length === 0 ? (
          <NoCommentsMessage threadType={threadFilter} />
        ) : sortedThreadList.map(resolvedThread => resolvedThread
          && <PageThread showFindButton inline={inline} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
      </StyledSidebar>
    </StyledPageThreadsBox>
  );
}

function NoCommentsMessage ({ threadType }: { threadType: string }) {
  return (
    <EmptyThreadContainerBox>
      <Center>
        <CommentOutlinedIcon
          fontSize='large'
          color='secondary'
          sx={{
            height: '2em',
            width: '2em'
          }}
        />
        <Typography variant='subtitle1' color='secondary'>No {threadType} comments yet</Typography>
      </Center>
    </EmptyThreadContainerBox>
  );
}
