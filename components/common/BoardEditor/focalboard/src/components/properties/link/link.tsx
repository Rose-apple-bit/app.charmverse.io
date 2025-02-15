
import React, { ReactNode } from 'react';

import Editable from '../../../widgets/editable';

import { Utils } from '../../../utils';
import LinkIcon from '../../../widgets/icons/Link';

type Props = {
    value: string
    readonly?: boolean
    placeholder?: string
    onChange: (value: string) => void
    onSave: () => void
    onCancel: () => void
    validator: (newValue: string) => boolean
}

function URLProperty (props: Props): JSX.Element {
  let link: ReactNode = null;
  const hasValue = Boolean(props.value?.trim());
  if (hasValue) {
    link = (
      <a
        className='Link__button'
        href={Utils.ensureProtocol(props.value.trim())}
        target='_blank'
        rel='noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        <LinkIcon />
      </a>
    );
  }
  return (
    <div className='URLProperty property-link url'>
      {(hasValue || props.placeholder)
        && (
        <Editable
          className='octo-propertyvalue'
          placeholderText={props.placeholder}
          value={props.value}
          autoExpand={false}
          readonly={props.readonly}
          onChange={props.onChange}
          onSave={props.onSave}
          onCancel={props.onCancel}
          validator={props.validator}
        />
        )}
      {link}
    </div>
  );
}

export default URLProperty;
