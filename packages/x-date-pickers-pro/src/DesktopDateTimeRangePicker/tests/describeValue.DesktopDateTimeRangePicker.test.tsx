import { fireEvent, screen } from '@mui/internal-test-utils';
import { PickerNonNullableRangeValue, PickerRangeValue } from '@mui/x-date-pickers/internals';
import {
  createPickerRenderer,
  adapterToUse,
  expectFieldValueV7,
  describeValue,
  getFieldSectionsContainer,
} from 'test/utils/pickers';
import { DesktopDateTimeRangePicker } from '@mui/x-date-pickers-pro/DesktopDateTimeRangePicker';
import { MultiInputDateTimeRangeField } from '@mui/x-date-pickers-pro/MultiInputDateTimeRangeField';

describe('<DesktopDateTimeRangePicker /> - Describe Value', () => {
  const { render } = createPickerRenderer();

  describeValue<PickerRangeValue, 'picker'>(DesktopDateTimeRangePicker, () => ({
    render,
    componentFamily: 'picker',
    type: 'date-time-range',
    variant: 'desktop',
    initialFocus: 'start',
    fieldType: 'multi-input',
    defaultProps: {
      slots: { field: MultiInputDateTimeRangeField },
      slotProps: {
        tabs: {
          hidden: false,
        },
      },
    },
    values: [
      // initial start and end dates
      [adapterToUse.date('2018-01-01T11:30:00'), adapterToUse.date('2018-01-04T11:45:00')],
      // start and end dates after `setNewValue`
      [adapterToUse.date('2018-01-02T12:35:00'), adapterToUse.date('2018-01-05T12:50:00')],
    ],
    emptyValue: [null, null],
    assertRenderedValue: (expectedValues: any[]) => {
      const hasMeridiem = adapterToUse.is12HourCycleInCurrentLocale();
      const expectedPlaceholder = hasMeridiem ? 'MM/DD/YYYY hh:mm aa' : 'MM/DD/YYYY hh:mm';

      const startSectionsContainer = getFieldSectionsContainer(0);
      const expectedStartValueStr = expectedValues[0]
        ? adapterToUse.format(
            expectedValues[0],
            hasMeridiem ? 'keyboardDateTime12h' : 'keyboardDateTime24h',
          )
        : expectedPlaceholder;
      expectFieldValueV7(startSectionsContainer, expectedStartValueStr);

      const endSectionsContainer = getFieldSectionsContainer(1);
      const expectedEndValueStr = expectedValues[1]
        ? adapterToUse.format(
            expectedValues[1],
            hasMeridiem ? 'keyboardDateTime12h' : 'keyboardDateTime24h',
          )
        : expectedPlaceholder;
      expectFieldValueV7(endSectionsContainer, expectedEndValueStr);
    },
    setNewValue: (
      value,
      { isOpened, applySameValue, setEndDate = false, selectSection, pressKey },
    ) => {
      let newValue: PickerNonNullableRangeValue;
      if (applySameValue) {
        newValue = value;
      } else if (setEndDate) {
        newValue = [
          value[0],
          adapterToUse.addMinutes(adapterToUse.addHours(adapterToUse.addDays(value[1], 1), 1), 5),
        ];
      } else {
        newValue = [
          adapterToUse.addMinutes(adapterToUse.addHours(adapterToUse.addDays(value[0], 1), 1), 5),
          value[1],
        ];
      }
      if (isOpened) {
        const nextButton = screen.queryByRole('button', { name: 'Next' });
        // if we want to set the end date, we firstly need to switch to end date "range position"
        if (setEndDate && nextButton) {
          fireEvent.click(nextButton);
        }

        fireEvent.click(
          screen.getByRole('gridcell', {
            name: adapterToUse.getDate(newValue[setEndDate ? 1 : 0]).toString(),
          }),
        );
        const hasMeridiem = adapterToUse.is12HourCycleInCurrentLocale();
        const hours = adapterToUse.format(
          newValue[setEndDate ? 1 : 0],
          hasMeridiem ? 'hours12h' : 'hours24h',
        );
        const hoursNumber = adapterToUse.getHours(newValue[setEndDate ? 1 : 0]);
        fireEvent.click(screen.getByRole('option', { name: `${parseInt(hours, 10)} hours` }));
        fireEvent.click(
          screen.getByRole('option', {
            name: `${adapterToUse.getMinutes(newValue[setEndDate ? 1 : 0])} minutes`,
          }),
        );
        if (hasMeridiem) {
          fireEvent.click(screen.getByRole('option', { name: hoursNumber >= 12 ? 'PM' : 'AM' }));
        }
        if (setEndDate) {
          // Switch back to start date "range position" in case we'd need to repeat selection
          let previousViewButton = screen.queryByRole('button', { name: 'Open previous view' });
          while (previousViewButton) {
            fireEvent.click(previousViewButton);
            previousViewButton = screen.queryByRole('button', { name: 'Open previous view' });
          }
        }
      } else {
        selectSection('day');
        pressKey(undefined, 'ArrowUp');

        selectSection('hours');
        pressKey(undefined, 'ArrowUp');

        selectSection('minutes');
        pressKey(undefined, 'PageUp'); // increment by 5 minutes

        const hasMeridiem = adapterToUse.is12HourCycleInCurrentLocale();
        if (hasMeridiem) {
          selectSection('meridiem');
          const previousHours = adapterToUse.getHours(value[setEndDate ? 1 : 0]);
          const newHours = adapterToUse.getHours(newValue[setEndDate ? 1 : 0]);
          // update meridiem section if it changed
          if ((previousHours < 12 && newHours >= 12) || (previousHours >= 12 && newHours < 12)) {
            pressKey(undefined, 'ArrowUp');
          }
        }
      }

      return newValue;
    },
  }));
});
