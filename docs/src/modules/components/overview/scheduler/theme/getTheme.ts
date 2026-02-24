import { ThemeOptions } from '@mui/material/styles';
import '@mui/x-scheduler-premium/theme-augmentation';
import '@mui/x-scheduler/theme-augmentation';

export const getTheme = (_mode: 'light' | 'dark'): ThemeOptions => {
  return {
    // TODO: Populate with custom scheduler theme overrides
    components: {
      MuiEventTimeline: {
        styleOverrides: {
          event: ({ theme }) => ({
            paddingLeft: theme.spacing(1.5),
            '&::before': {
              borderRadius: 'inherit',
              top: 6,
              bottom: 6,
              left: 6,
            },
          }),
        },
      },
      MuiEventCalendar: {
        styleOverrides: {
          timeGridEvent: ({ theme }) => ({
            paddingLeft: theme.spacing(1.5),
            borderRadoius: theme.shape.borderRadius,
            '&::before': {},
          }),
        },
      },
    },
  };
};
