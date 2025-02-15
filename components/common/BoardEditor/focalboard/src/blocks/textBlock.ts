import { ContentBlock } from './contentBlock';
import { Block, createBlock } from './block';

export type TextBlock = ContentBlock & {
    type: 'text'
}

function createTextBlock (block?: Block): TextBlock {
  return {
    ...createBlock(block),
    type: 'text'
  };
}

export { createTextBlock };
