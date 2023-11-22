import { screen, userEvent } from '@mui-internal/test-utils';
import { getFieldRoot } from 'test/utils/pickers/fields';

export type OpenPickerParams =
  | {
      type: 'date' | 'date-time' | 'time';
      variant: 'mobile' | 'desktop';
    }
  | {
      type: 'date-range';
      variant: 'mobile' | 'desktop';
      initialFocus: 'start' | 'end';
      /**
       * @default false
       */
      isSingleInput?: boolean;
    };

export const openPicker = (params: OpenPickerParams) => {
  const fieldRoot = getFieldRoot(
    params.type === 'date-range' && !params.isSingleInput && params.initialFocus === 'end' ? 1 : 0,
  );

  if (params.type === 'date-range') {
    if (params.isSingleInput) {
      userEvent.mousePress(fieldRoot);
      const cursorPosition = params.initialFocus === 'start' ? 0 : target.value.length - 1;

      // TODO: Bring back end selection
    }

    return userEvent.mousePress(fieldRoot);
  }

  if (params.variant === 'mobile') {
    return userEvent.mousePress(fieldRoot);
  }

  const target =
    params.type === 'time'
      ? screen.getByLabelText(/choose time/i)
      : screen.getByLabelText(/choose date/i);
  return userEvent.mousePress(target);
};
