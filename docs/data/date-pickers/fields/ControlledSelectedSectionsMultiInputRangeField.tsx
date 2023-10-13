import * as React from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  FieldSectionType,
  FieldSelectedSection,
  RangePosition,
} from '@mui/x-date-pickers-pro';
import { MultiInputDateRangeField } from '@mui/x-date-pickers-pro/MultiInputDateRangeField';

export default function ControlledSelectedSectionsMultiInputRangeField() {
  const [selectedSection, setSelectedSection] =
    React.useState<FieldSelectedSection>(null);
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  const setSelectedSectionType = (
    selectedSectionType: FieldSectionType,
    position: RangePosition,
  ) => {
    if (position === 'start') {
      startInputRef.current?.focus();
    } else {
      endInputRef.current?.focus();
    }
    setSelectedSection(selectedSectionType);
  };

  const renderDateHeader = (position: RangePosition) => (
    <Stack spacing={2} alignItems="center">
      <Typography textTransform="capitalize">{position}</Typography>
      <Stack direction="row" spacing={1}>
        {(['month', 'day', 'year'] as const).map((sectionName) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedSectionType(sectionName, position)}
          >
            {sectionName}
          </Button>
        ))}
      </Stack>
    </Stack>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2}>
        <Stack spacing={2} justifyContent="space-between">
          {renderDateHeader('start')}
          {renderDateHeader('end')}
        </Stack>
        <MultiInputDateRangeField
          sx={{ minWidth: 300 }}
          slotProps={{
            textField: (ownerState) => ({
              inputRef:
                ownerState.position === 'start' ? startInputRef : endInputRef,
            }),
          }}
          selectedSection={selectedSection}
          onSelectedSectionChange={setSelectedSection}
        />
      </Stack>
    </LocalizationProvider>
  );
}
