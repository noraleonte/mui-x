import * as React from 'react';
import { fireEvent } from '@mui-internal/test-utils';
import { DesktopDatePicker, DesktopDatePickerProps } from '@mui/x-date-pickers/DesktopDatePicker';
import {
  createPickerRenderer,
  buildFieldInteractions,
  getTextbox,
  expectFieldValue,
  expectInputPlaceholder,
  adapterToUse,
  describeAdapters,
} from 'test/utils/pickers';

describe('<DesktopDatePicker /> - Field', () => {
  describe('Basic behaviors', () => {
    const { render, clock } = createPickerRenderer({
      clock: 'fake',
      clockConfig: new Date('2018-01-01T10:05:05.000'),
    });
    const { clickOnField } = buildFieldInteractions({
      clock,
      render,
      Component: DesktopDatePicker,
    });

    it('should be able to reset a single section', () => {
      render(
        <DesktopDatePicker
          format={`${adapterToUse.formats.month} ${adapterToUse.formats.dayOfMonth}`}
        />,
      );

      const input = getTextbox();
      expectInputPlaceholder(input, 'MMMM DD');
      clickOnField(input, 0);

      fireEvent.change(input, { target: { value: 'N DD' } }); // Press "1"
      expectFieldValue(input, 'November DD');

      fireEvent.change(input, { target: { value: 'November 4' } }); // Press "1"
      expectFieldValue(input, 'November 04');

      fireEvent.change(input, { target: { value: 'November ' } });
      expectFieldValue(input, 'November DD');
    });

    it('should adapt the default field format based on the props of the picker', () => {
      const testFormat = (props: DesktopDatePickerProps<any>, expectedFormat: string) => {
        const { unmount } = render(<DesktopDatePicker {...props} />);
        const input = getTextbox();
        expectInputPlaceholder(input, expectedFormat);
        unmount();
      };

      testFormat({ views: ['year'] }, 'YYYY');
      testFormat({ views: ['month'] }, 'MMMM');
      testFormat({ views: ['day'] }, 'DD');
      testFormat({ views: ['month', 'day'] }, 'MMMM DD');
      testFormat({ views: ['year', 'month'] }, 'MMMM YYYY');
      testFormat({ views: ['year', 'month', 'day'] }, 'MM/DD/YYYY');
      testFormat({ views: ['year', 'day'] }, 'MM/DD/YYYY');
    });
  });

  describeAdapters('Timezone', DesktopDatePicker, ({ adapter, render, clickOnField }) => {
    it('should clear the selected section when all sections are completed when using timezones', () => {
      function WrappedDesktopDatePicker() {
        const [value, setValue] = React.useState(adapter.date()!);
        return (
          <DesktopDatePicker
            value={value}
            onChange={setValue}
            format={`${adapter.formats.month} ${adapter.formats.year}`}
            timezone="America/Chicago"
          />
        );
      }
      render(<WrappedDesktopDatePicker />);

      const input = getTextbox();
      expectFieldValue(input, 'June 2022');
      clickOnField(input, 0);

      fireEvent.change(input, { target: { value: ' 2022' } });
      expectFieldValue(input, 'MMMM 2022');
    });
  });
});
