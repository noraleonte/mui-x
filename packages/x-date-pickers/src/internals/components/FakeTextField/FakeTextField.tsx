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
}

export const FakeTextField = React.forwardRef(function FakeTextField(
  props: FakeTextFieldProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { elements } = props;

  return (
    <Stack direction="row" spacing={1} ref={ref}>
      {elements.map(({ container, input, before, after }, elementIndex) => (
        <Stack {...container} key={elementIndex}>
          <span {...before} />
          <input {...input} />
          <span {...after} />
        </Stack>
      ))}
    </Stack>
  );
});
