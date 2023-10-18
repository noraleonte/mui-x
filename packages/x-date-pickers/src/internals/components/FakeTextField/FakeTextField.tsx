import * as React from 'react';
import Stack from '@mui/material/Stack';

export interface FakeTextFieldElement {
  container: React.HTMLAttributes<HTMLDivElement>;
  input: React.HTMLAttributes<HTMLDivElement>;
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
    ownerState,
    ...other
  } = props;

  return (
    <Stack direction="row" spacing={1} ref={ref} {...other}>
      {elements.map(({ container, input, before, after }, elementIndex) => (
        <Stack {...container} key={elementIndex}>
          <span {...before} />
          <input {...input} />
          <span {...after} />
        </Stack>
      ))}
      <input type="hidden" value={valueStr} onChange={onValueStrChange} id={id} />
    </Stack>
  );
});
