import * as React from 'react';
import Box from '@mui/material/Box';

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
}

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
    ownerState,
    ...other
  } = props;

  let children: React.ReactNode;
  if (other.contentEditable) {
    children = elements
      .map(({ content, before, after }) => `${before.children}${content.children}${after.children}`)
      .join('');
  } else {
    children = (
      <React.Fragment>
        {elements.map(({ container, content, before, after }, elementIndex) => (
          <span {...container} key={elementIndex}>
            <span {...before} />
            <span {...content} />
            <span {...after} />
          </span>
        ))}
        <input type="hidden" value={valueStr} onChange={onValueStrChange} id={id} />
      </React.Fragment>
    );
  }

  return (
    <Box
      ref={ref}
      {...other}
      style={{
        display: 'inline-block',
        border: '1px solid black',
        borderRadius: 4,
        padding: '2px 4px',
        color: valueType === 'placeholder' ? 'grey' : 'black',
      }}
    >
      {children}
    </Box>
  );
});
