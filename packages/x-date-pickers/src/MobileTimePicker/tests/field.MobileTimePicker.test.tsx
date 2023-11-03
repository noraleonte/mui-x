import * as React from 'react';
import { createPickerRenderer, getTextbox, expectInputPlaceholderV6 } from 'test/utils/pickers';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

describe('<MobileTimePicker /> - Field', () => {
  const { render } = createPickerRenderer();

  it('should pass the ampm prop to the field', () => {
    const { setProps } = render(<MobileTimePicker ampm />);

    const input = getTextbox();
    expectInputPlaceholderV6(input, 'hh:mm aa');

    setProps({ ampm: false });
    expectInputPlaceholderV6(input, 'hh:mm');
  });
});
