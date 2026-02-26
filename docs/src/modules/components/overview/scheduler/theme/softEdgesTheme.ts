import { ThemeOptions, createTheme } from '@mui/material/styles';
import '@mui/x-scheduler-premium/theme-augmentation';
import '@mui/x-scheduler/theme-augmentation';

export const getSoftEdgesTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  return createTheme({
    palette: { mode },
    components: {
      MuiEventTimeline: {
        styleOverrides: {
          event: ({ theme }) => ({
            border: '1px solid var(--event-main)',
            '&::before': {
              width: 0,
            },
          }),
        },
      },
      MuiEventCalendar: {
        styleOverrides: {
          timeGridEvent: ({ theme }) => ({
            border: '1px solid var(--event-main)',
            '&::before': {
              width: 0,
            },
          }),
        },
      },
    },
  });
};
