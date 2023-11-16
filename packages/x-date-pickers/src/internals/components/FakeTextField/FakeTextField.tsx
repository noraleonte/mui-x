import * as React from 'react';
import clsx from 'clsx';
import { styled } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import useForkRef from '@mui/utils/useForkRef';

export interface FakeTextFieldElement {
  container: React.HTMLAttributes<HTMLSpanElement>;
  content: React.HTMLAttributes<HTMLSpanElement>;
  before: React.HTMLAttributes<HTMLSpanElement>;
  after: React.HTMLAttributes<HTMLSpanElement>;
}

interface FakeTextFieldProps {
  elements: FakeTextFieldElement[];
  valueStr: string;
  onValueStrChange: React.ChangeEventHandler<HTMLInputElement>;
  error: boolean;
  id?: string;
  InputProps: any;
  inputProps: any;
  disabled?: boolean;
  autoFocus?: boolean;
  ownerState?: any;
  valueType: 'value' | 'placeholder';
  contentEditable?: boolean;
  fullWidth?: boolean;
  focused?: boolean;
  readOnly?: boolean;
}

const FakeTextFieldRoot = styled('div', {
  name: 'MuiFakeTextField',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root,
})({
  display: 'flex',
  border: '1px solid black',
  alignItems: 'center',
  borderRadius: 4,
  padding: '0 8px',
});

const FakeTextFieldInputContent = styled('div', {
  name: 'MuiFakeTextField',
  slot: 'InputContent',
  overridesResolver: (props, styles) => styles.inputContent,
})`
  /*! @noflip */
  direction: ltr;
  display: inline-block;
  padding: 6px 0;
`;

const FakeTextFieldHiddenInput = styled('input', {
  name: 'MuiFakeTextField',
  slot: 'HiddenInput',
  overridesResolver: (props, styles) => styles.hiddenInput,
})({
  ...visuallyHidden,
});

export const FakeTextField = React.forwardRef(function FakeTextField(
  props: FakeTextFieldProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const {
    elements,
    valueStr,
    onValueStrChange,
    id,
    error,
    InputProps,
    inputProps,
    autoFocus,
    disabled,
    valueType,
    fullWidth,
    focused,
    ownerState,
    readOnly,
    ...other
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRef = useForkRef(ref, rootRef);

  let children: React.ReactNode;
  if (other.contentEditable) {
    children = elements
      .map(({ content, before, after }) => `${before.children}${content.children}${after.children}`)
      .join('');
  } else {
    children = elements.map(({ container, content, before, after }, elementIndex) => (
      <span {...container} key={elementIndex}>
        <span {...before} />
        <span {...content} />
        <span {...after} />
      </span>
    ));
  }

  return (
    <FakeTextFieldRoot
      ref={handleRef}
      {...other}
      style={{
        color: valueType === 'placeholder' ? 'grey' : 'black',
      }}
      aria-invalid={error}
      // TODO: Stop hard-coding
      className={clsx(['fake-text-field-root', error && 'Mui-error', disabled && 'Mui-disabled'])}
    >
      <FakeTextFieldInputContent
        ref={InputProps?.ref}
        // TODO: Stop hard-coding
        className={clsx(['fake-text-field-input-content', readOnly && 'Mui-readOnly'])}
      >
        {children}
      </FakeTextFieldInputContent>
      <FakeTextFieldHiddenInput
        value={valueStr}
        onChange={onValueStrChange}
        id={id}
        aria-hidden="true"
        tabIndex={-1}
      />
      {InputProps?.endAdornment}
    </FakeTextFieldRoot>
  );
});
