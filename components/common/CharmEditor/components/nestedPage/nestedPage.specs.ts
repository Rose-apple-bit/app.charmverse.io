import { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import log from 'lib/log';
import { nestedPageNodeName, nestedPageSuggestMarkName } from './nestedPage.constants';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';
import { encloseNestedPage } from './nestedPage.utils';

export function nestedPageSpec (): RawSpecs {
  return [{
    type: 'node',
    name: nestedPageNodeName,
    schema: {
      inline: false,
      attrs: {
        // This property is used to reference the page
        id: {
          default: null
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-nested-page' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-nested-page' }];
      },
      atom: true
    },
    markdown: {
      toMarkdown: (state, node) => {
        try {
          state.write(encloseNestedPage(node.attrs.id));
          state.ensureNewLine();
        }
        catch (err) {
          log.warn('Conversion err', err);
        }
      }
    }
  }, suggestTooltip.spec({ markName: nestedPageSuggestMarkName })];
}
