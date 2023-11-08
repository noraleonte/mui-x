import * as React from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField';

export default function BasicDateTimeField() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DateTimeField']}>
        <DateTimeField />
        <DateTimeField shouldUseV6TextField />
        <input type="datetime-local" />
      </DemoContainer>
    </LocalizationProvider>
  );
}
