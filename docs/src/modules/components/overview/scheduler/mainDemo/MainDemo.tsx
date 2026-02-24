import * as React from 'react';
import { ThemeOptions, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { EventCalendarPremium } from '@mui/x-scheduler-premium/event-calendar-premium';
import { SchedulerEvent } from '@mui/x-scheduler/models';
import ViewToggleGroup, { SchedulerView } from './ViewToggleGroup';
import TimelineDemo from './TimelineDemo';
import { calendarEvents, calendarResources, defaultVisibleDate } from './data';
import { getTheme } from '../theme/getTheme';

export default function MainDemo() {
  const brandingTheme = useTheme();

  const [selectedView, setSelectedView] = React.useState<SchedulerView>('calendar');
  const [showCustomTheme, setShowCustomTheme] = React.useState(false);
  const [calendarEventsState, setCalendarEventsState] =
    React.useState<SchedulerEvent[]>(calendarEvents);

  const baseTheme = createTheme({ palette: { mode: brandingTheme.palette.mode } });
  const customTheme = createTheme(
    brandingTheme as ThemeOptions,
    getTheme(brandingTheme.palette.mode),
  );

  return (
    <Stack spacing={1} sx={{ p: 1, width: '100%' }}>
      {/* Toolbar: view toggle + customization switch */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <ViewToggleGroup selected={selectedView} onToggleChange={setSelectedView} />
        <FormControlLabel
          control={
            <Switch
              checked={showCustomTheme}
              onChange={() => setShowCustomTheme((prev) => !prev)}
              size="small"
            />
          }
          label="Custom theme"
        />
      </Stack>
      <ThemeProvider theme={showCustomTheme ? customTheme : baseTheme}>
        {/* Demo content */}
        {selectedView === 'calendar' && (
          <Paper variant="outlined" elevation={0} sx={{ height: 600, width: '100%', p: 1 }}>
            <EventCalendarPremium
              events={calendarEventsState}
              onEventsChange={setCalendarEventsState}
              resources={calendarResources}
              defaultVisibleDate={defaultVisibleDate}
              defaultView="week"
              defaultPreferences={{ isSidePanelOpen: false }}
            />
          </Paper>
        )}

        {selectedView === 'timeline' && <TimelineDemo />}
      </ThemeProvider>
    </Stack>
  );
}
