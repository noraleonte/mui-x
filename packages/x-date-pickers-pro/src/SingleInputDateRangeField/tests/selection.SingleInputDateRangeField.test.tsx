import * as React from 'react';
import { expect } from 'chai';
import { SingleInputDateRangeField } from '@mui/x-date-pickers-pro/SingleInputDateRangeField';
import { act, userEvent } from '@mui-internal/test-utils';
import {
  adapterToUse,
  buildFieldInteractions,
  getCleanedSelectedContentV6,
  getTextbox,
  createPickerRenderer,
  expectFieldValue,
} from 'test/utils/pickers';

describe('<SingleInputDateRangeField /> - Selection', () => {
  const { render, clock } = createPickerRenderer({ clock: 'fake' });
  const { renderWithProps } = buildFieldInteractions({
    clock,
    render,
    Component: SingleInputDateRangeField,
  });

  describe('Focus', () => {
    it('should select all on mount focus (`autoFocus = true`)', () => {
      render(<SingleInputDateRangeField autoFocus />);
      const input = getTextbox();

      expectFieldValue(input, 'MM/DD/YYYY – MM/DD/YYYY');
      expect(getCleanedSelectedContentV6(input)).to.equal('MM/DD/YYYY – MM/DD/YYYY');
    });

    it('should select all on <Tab> focus', () => {
      render(<SingleInputDateRangeField />);
      const input = getTextbox();
      // Simulate a <Tab> focus interaction on desktop
      act(() => {
        input.focus();
      });
      clock.runToLast();
      input.select();

      expectFieldValue(input, 'MM/DD/YYYY – MM/DD/YYYY');
      expect(getCleanedSelectedContentV6(input)).to.equal('MM/DD/YYYY – MM/DD/YYYY');
    });
  });

  describe('Click', () => {
    it('should select the clicked selection when the input is already focused', () => {
      const { input, selectSection } = renderWithProps({
        value: [null, adapterToUse.date(new Date(2022, 1, 24))],
      });

      // Start date
      selectSection('day');
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      selectSection('month');
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');

      // End date
      selectSection('month', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('02');

      selectSection('day', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('24');
    });

    it('should not change the selection when clicking on the only already selected section', () => {
      const { input, selectSection } = renderWithProps({
        value: [null, adapterToUse.date(new Date(2022, 1, 24))],
      });

      // Start date
      selectSection('day');
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      selectSection('day');
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      // End date
      selectSection('day', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('24');

      selectSection('day', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('24');
    });
  });

  describe('key: ArrowRight', () => {
    it('should allows to move from left to right with ArrowRight', () => {
      const { input, selectSection } = renderWithProps({});

      selectSection('month');
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');

      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');

      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');

      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');
    });

    it('should stay on the current section when the last section is selected', () => {
      const { input, selectSection } = renderWithProps({});

      selectSection('year', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');
      userEvent.keyPress(input, { key: 'ArrowRight' });
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');
    });
  });

  describe('key: ArrowLeft', () => {
    it('should allows to move from right to left with ArrowLeft', () => {
      const { input, selectSection } = renderWithProps({});

      selectSection('year', 'last');
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');
      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');

      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('YYYY');

      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('DD');

      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');
    });

    it('should stay on the current section when the first section is selected', () => {
      const { input, selectSection } = renderWithProps({});

      selectSection('month');
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');
      userEvent.keyPress(input, { key: 'ArrowLeft' });
      expect(getCleanedSelectedContentV6(input)).to.equal('MM');
    });
  });
});
