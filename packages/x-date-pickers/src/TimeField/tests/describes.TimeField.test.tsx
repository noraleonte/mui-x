import { userEvent } from '@mui-internal/test-utils';
import {
  adapterToUse,
  createPickerRenderer,
  expectFieldPlaceholderV6,
  expectFieldValueV7,
  getTextbox,
  describeValidation,
  describeValue,
  formatFullTimeValue,
} from 'test/utils/pickers';
import { TimeField } from '@mui/x-date-pickers/TimeField';

describe('<TimeField /> - Describes', () => {
  const { render, clock } = createPickerRenderer({ clock: 'fake' });

  describeValidation(TimeField, () => ({
    render,
    clock,
    views: ['hours', 'minutes'],
    componentFamily: 'field',
  }));

  describeValue.skip(TimeField, () => ({
    render,
    componentFamily: 'field',
    values: [adapterToUse.date(new Date(2018, 0, 1)), adapterToUse.date(new Date(2018, 0, 2))],
    emptyValue: null,
    clock,
    assertRenderedValue: (expectedValue: any) => {
      const hasMeridiem = adapterToUse.is12HourCycleInCurrentLocale();
      const input = getTextbox();
      if (!expectedValue) {
        expectFieldPlaceholderV6(input, hasMeridiem ? 'hh:mm aa' : 'hh:mm');
      }
      const expectedValueStr = expectedValue
        ? formatFullTimeValue(adapterToUse, expectedValue)
        : '';
      expectFieldValueV7(input, expectedValueStr);
    },
    setNewValue: (value, { selectSection }) => {
      const newValue = adapterToUse.addHours(value, 1);
      selectSection('hours');
      const input = getTextbox();
      userEvent.keyPress(input, { key: 'ArrowUp' });

      return newValue;
    },
  }));
});
