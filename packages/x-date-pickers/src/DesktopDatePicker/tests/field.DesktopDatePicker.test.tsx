import { fireEvent } from '@mui-internal/test-utils';
import { DesktopDatePicker, DesktopDatePickerProps } from '@mui/x-date-pickers/DesktopDatePicker';
import {
  createPickerRenderer,
  buildFieldInteractions,
  getTextbox,
  expectFieldValueV7,
  expectFieldValueV6,
  expectInputPlaceholderV6,
  adapterToUse,
  describeAdapters,
} from 'test/utils/pickers';

describe('<DesktopDatePicker /> - Field', () => {
  describe('Basic behaviors', () => {
    const { render, clock } = createPickerRenderer({
      clock: 'fake',
      clockConfig: new Date('2018-01-01T10:05:05.000'),
    });
    const { renderWithProps } = buildFieldInteractions({
      clock,
      render,
      Component: DesktopDatePicker,
    });

    it('should be able to reset a single section', () => {
      // Test with v7 input
      const v7Response = renderWithProps(
        { format: `${adapterToUse.formats.month} ${adapterToUse.formats.dayOfMonth}` },
        { componentFamily: 'picker' },
      );

      v7Response.selectSection('month');
      expectFieldValueV7(v7Response.fieldContainer, 'MMMM DD');

      fireEvent.input(v7Response.getActiveSection(0), { target: { innerText: 'N' } });
      expectFieldValueV7(v7Response.fieldContainer, 'November DD');

      fireEvent.input(v7Response.getActiveSection(1), { target: { innerText: '4' } });
      expectFieldValueV7(v7Response.fieldContainer, 'November 04');

      fireEvent.input(v7Response.getActiveSection(1), { target: { innerText: '' } });
      expectFieldValueV7(v7Response.fieldContainer, 'November DD');

      v7Response.unmount();

      // Test with v6 input
      const v6Response = renderWithProps(
        {
          shouldUseV6TextField: true,
          format: `${adapterToUse.formats.month} ${adapterToUse.formats.dayOfMonth}`,
        },
        { componentFamily: 'picker' },
      );

      const input = getTextbox();
      v6Response.selectSection('month');
      expectInputPlaceholderV6(input, 'MMMM DD');

      fireEvent.change(input, { target: { value: 'N DD' } }); // Press "N"
      expectFieldValueV6(input, 'November DD');

      fireEvent.change(input, { target: { value: 'November 4' } }); // Press "4"
      expectFieldValueV6(input, 'November 04');

      fireEvent.change(input, { target: { value: 'November ' } });
      expectFieldValueV6(input, 'November DD');
    });

    it('should adapt the default field format based on the props of the picker', () => {
      const testFormat = (props: DesktopDatePickerProps<any>, expectedFormat: string) => {
        // Test with v7 input
        const v7Response = renderWithProps(props);
        expectFieldValueV7(v7Response.fieldContainer, expectedFormat);
        v7Response.unmount();

        // Test with v6 input
        const v6Response = renderWithProps({ ...props, shouldUseV6TextField: true });
        const input = getTextbox();
        expectInputPlaceholderV6(input, expectedFormat);
        v6Response.unmount();
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

  describeAdapters('Timezone', DesktopDatePicker, ({ adapter, renderWithProps }) => {
    it('should clear the selected section when all sections are completed when using timezones', () => {
      const v7Response = renderWithProps(
        {
          value: adapter.date()!,
          format: `${adapter.formats.month} ${adapter.formats.year}`,
          timezone: 'America/Chicago',
        },
        { componentFamily: 'picker' },
      );

      expectFieldValueV7(v7Response.fieldContainer, 'June 2022');
      v7Response.selectSection('month');

      fireEvent.input(v7Response.getActiveSection(0), { target: { innerText: '' } });
      expectFieldValueV7(v7Response.fieldContainer, 'MMMM 2022');
    });
  });
});
