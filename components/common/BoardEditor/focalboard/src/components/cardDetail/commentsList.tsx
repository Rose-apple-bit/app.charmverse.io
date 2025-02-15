import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import Avatar from 'components/common/Avatar';
import { CommentBlock, createCommentBlock } from '../../blocks/commentBlock';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';

import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';

import Comment from './comment';

type Props = {
    comments: readonly CommentBlock[]
    rootId: string
    cardId: string
    readonly: boolean
}

const CommentsList = React.memo((props: Props) => {
  const {user} = useUser();
  const [contributors] = useContributors();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  const onSendClicked = (newComment: CommentBlock['fields']) => {
    const { rootId, cardId } = props;
    Utils.log(`Send comment: ${newComment.contentText}`);
    Utils.assertValue(cardId);

    const comment = createCommentBlock();
    const { content, contentText } = newComment;
    comment.parentId = cardId;
    comment.rootId = rootId;
    comment.title = contentText || '';
    comment.fields = { content }
    mutator.insertBlock(comment, 'add comment');
    // clear the editor
    setEditorKey(key => key + 1);
  };

  const { comments } = props;

  return (
    <div className='CommentsList'>
      {/* New comment */}
      {!props.readonly && (
        <NewCommentInput
          $key={editorKey}
          key={editorKey}
          avatar={user?.avatar}
          username={user?.username}
          onSubmit={onSendClicked}
        />
      )}

      {comments.slice(0).reverse().map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          contributor={contributors.find(_contributor => _contributor.id === comment.createdBy)}
          readonly={props.readonly}
        />
      ))}

      {/* horizontal divider below comments */}
      {!(comments.length === 0 && props.readonly) && <hr className='CommentsList__divider' />}
    </div>
  );
});

interface NewCommentProps {
  initialValue?: any | null;
  $key?: string | number;
  username?: string;
  avatar?: string | null;
  onSubmit: (i: CommentBlock['fields']) => void;
}

export function NewCommentInput ({ initialValue = null, $key, username, avatar, onSubmit }: NewCommentProps) {

  const intl = useIntl();
  const [newComment, setNewComment] = useState<CommentBlock['fields'] | null>(initialValue);

  return (
    <div className='CommentsList__new'>
      <Avatar size='xSmall' name={username} avatar={avatar} />
      <InlineCharmEditor
        content={newComment?.content}
        key={$key} // use the size of comments so it resets when the new one is added
        onContentChange={({ doc, rawText }) => {
          setNewComment({ content: doc, contentText: rawText });
        }}
        placeholderText={intl.formatMessage({ id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...' })}
        style={{ fontSize: '14px' }}
      />

      {newComment && (
        <Button
          filled={true}
          onClick={() => onSubmit(newComment)}
        >
          <FormattedMessage
            id='CommentsList.send'
            defaultMessage='Send'
          />
        </Button>
      )}
    </div>
  );
}


export default CommentsList;
