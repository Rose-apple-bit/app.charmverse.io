import {
  blockquote,
  bold,
  bulletList,
  code,
  heading,
  history,
  italic,
  link,
  orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { EditorState, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { BlockquoteIcon, BoldIcon, BulletListIcon, CodeIcon, HeadingIcon, ItalicIcon, LinkIcon, OrderedListIcon, ParagraphIcon, RedoIcon, TodoListIcon, UndoIcon } from '@bangle.dev/react-menu';
import {
  defaultKeys as floatingMenuKeys, focusFloatingMenuInput, toggleLinkSubMenu
} from '@bangle.dev/react-menu/dist/floating-menu';
import { HintPos } from '@bangle.dev/react-menu/dist/types';
import { filter, rafCommandExec } from '@bangle.dev/utils';
import React, { useCallback } from 'react';
import { MenuButton } from './Icon';

const {
  defaultKeys: orderedListKeys,
  queryIsOrderedListActive,
  toggleOrderedList,
} = orderedList;
const { defaultKeys: italicKeys, queryIsItalicActive, toggleItalic } = italic;
const { defaultKeys: historyKeys, undo, redo } = history;

const { defaultKeys: boldKeys, queryIsBoldActive, toggleBold } = bold;
const { defaultKeys: codeKeys, queryIsCodeActive, toggleCode } = code;
const {
  defaultKeys: paragraphKeys,
  queryIsTopLevelParagraph,
  convertToParagraph,
} = paragraph;
const {
  defaultKeys: headingKeys,
  queryIsHeadingActive,
  toggleHeading,
} = heading;

const { createLink, queryIsLinkActive } = link;
const {
  defaultKeys: bulletListKeys,
  queryIsBulletListActive,
  queryIsTodoListActive,
  toggleBulletList,
  toggleTodoList,
} = bulletList;

interface ButtonProps {
  hints?: string[];
  hintPos?: HintPos;
  children?: React.ReactNode;
}

export function BoldButton({
  hints = ['Bold', boldKeys.toggleBold],
  hintPos = 'top',
  children = <BoldIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleBold()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!view.editable || !toggleBold()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function BlockquoteButton({
  hints = ['Blockquote', blockquote.defaultKeys.wrapIn],
  hintPos = 'top',
  children = <BlockquoteIcon fontSize={16} />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (
        blockquote.commands.wrapInBlockquote()(view.state, view.dispatch, view)
      ) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={blockquote.commands.queryIsBlockquoteActive()(view.state)}
      isDisabled={
        !view.editable || !blockquote.commands.wrapInBlockquote()(view.state)
      }
    >
      {children}
    </MenuButton>
  );
}

export function ItalicButton({
  hints = ['Italic', italicKeys.toggleItalic],
  hintPos = 'top',
  children = <ItalicIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleItalic()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!view.editable || !toggleItalic()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function UndoButton({
  hints = ['Undo', historyKeys.undo],
  hintPos = 'top',
  children = <UndoIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (undo()(view.state, view.dispatch)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isDisabled={!view.editable || !undo()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function RedoButton({
  hints = ['Redo', historyKeys.redo],
  hintPos = 'top',
  children = <RedoIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (redo()(view.state, view.dispatch)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isDisabled={!view.editable || !redo()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function CodeButton({
  hints = ['Code', codeKeys.toggleCode],
  hintPos = 'top',
  children = <CodeIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleCode()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={queryIsCodeActive()(view.state)}
      isDisabled={!view.editable || !toggleCode()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function BulletListButton({
  hints = ['BulletList', bulletListKeys.toggle],
  hintPos = 'top',
  children = <BulletListIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleBulletList()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isDisabled={!view.editable}
      isActive={
        queryIsBulletListActive()(view.state) &&
        !queryIsTodoListActive()(view.state)
      }
    >
      {children}
    </MenuButton>
  );
}

export function OrderedListButton({
  hints = ['Ordered list', orderedListKeys.toggle],
  hintPos = 'top',
  children = <OrderedListIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleOrderedList()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isDisabled={!view.editable}
      isActive={queryIsOrderedListActive()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function TodoListButton({
  hints = ['Todo list', bulletListKeys.toggleTodo],
  hintPos = 'top',
  children = <TodoListIcon />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();

      if (toggleTodoList()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isDisabled={!view.editable}
      isActive={queryIsTodoListActive()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function HeadingButton({
  level,
  hints = [`Heading ${level}`, headingKeys['toH' + level] ?? "1"],
  hintPos = 'top',
  children = <HeadingIcon level={level} />,
  ...props
}: ButtonProps & { level: number }) {
  const view = useEditorViewContext();

  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleHeading(level)(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view, level],
  );
  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={queryIsHeadingActive(level)(view.state)}
      isDisabled={!view.editable || !toggleHeading(level)(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function ParagraphButton({
  hints = [`Paragraph`, paragraphKeys.convertToParagraph],
  hintPos = 'top',
  children = <ParagraphIcon fontSize={16} />,
  ...props
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (convertToParagraph()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view],
  );

  return (
    <MenuButton
      {...props}
      hintPos={hintPos}
      onMouseDown={onSelect}
      hints={hints}
      isActive={queryIsTopLevelParagraph()(view.state)}
      isDisabled={!view.editable || !convertToParagraph()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function FloatingLinkButton({
  hints = ['Create a link', floatingMenuKeys.toggleLink],
  hintPos = 'top',
  children = <LinkIcon />,
  menuKey,
}: ButtonProps & { menuKey: PluginKey }) {
  const view = useEditorViewContext();

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const command = filter(
        (state: EditorState) => createLink('')(state),
        (_state, dispatch, view) => {
          if (dispatch) {
            toggleLinkSubMenu(menuKey)(view!.state, view!.dispatch, view);
            rafCommandExec(view!, focusFloatingMenuInput(menuKey));
          }
          return true;
        },
      );
      if (command(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view, menuKey],
  );

  return (
    <MenuButton
      onMouseDown={onMouseDown}
      hints={hints}
      hintPos={hintPos}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!view.editable || !createLink('')(view.state)}
    >
      {children}
    </MenuButton>
  );
}