import { describe, it, expect } from 'vitest';
import {
  calculateZoomEnd,
  calculateZoomStart,
  calculateZoomFromPointImpl,
  calculateZoomSliderPosition,
} from './zoom-utils';
import type { ZoomData } from '../../models';

describe('Zoom Utils', () => {
  describe('calculateZoomStart', () => {
    it('should return minStart when newStart is too small', () => {
      const newStart = 5;
      const currentZoom: ZoomData = { axisId: 'x-axis', start: 10, end: 100 };
      const options = { minStart: 20, minSpan: 10, maxSpan: 100 };

      const result = calculateZoomStart(newStart, currentZoom, options);

      expect(result).to.eq(20);
    });

    it('should adjust based on minSpan if newStart is outside valid range', () => {
      const newStart = 95;
      const currentZoom: ZoomData = { axisId: 'x-axis', start: 10, end: 100 };
      const options = { minStart: 20, minSpan: 10, maxSpan: 80 };

      const result = calculateZoomStart(newStart, currentZoom, options);

      expect(result).to.eq(90);
    });

    it('should adjust based on maxSpan if newStart is too small', () => {
      const newStart = 40;
      const currentZoom: ZoomData = { axisId: 'x-axis', start: 10, end: 100 };
      const options = { minStart: 20, minSpan: 10, maxSpan: 50 };

      const result = calculateZoomStart(newStart, currentZoom, options);

      expect(result).to.eq(50);
    });

    it('should return newStart if it is within the valid range', () => {
      const newStart = 70;
      const currentZoom: ZoomData = { axisId: 'x-axis', start: 10, end: 100 };
      const options = { minStart: 20, minSpan: 10, maxSpan: 90 };

      const result = calculateZoomStart(newStart, currentZoom, options);

      expect(result).to.eq(70);
    });
  });

  describe('calculateZoomEnd', () => {
    it('should return newEnd if it satisfies the constraints', () => {
      const currentZoom: ZoomData = { axisId: 'x', start: 10, end: 30 };
      const options = { maxEnd: 100, minSpan: 5, maxSpan: 50 };

      const result = calculateZoomEnd(25, currentZoom, options);

      expect(result).to.eq(25);
    });

    it('should return maxEnd if newEnd exceeds maxEnd', () => {
      const currentZoom: ZoomData = { axisId: 'x', start: 10, end: 30 };
      const options = { maxEnd: 50, minSpan: 5, maxSpan: 50 };

      const result = calculateZoomEnd(60, currentZoom, options);

      expect(result).to.eq(50);
    });

    it('should return start + maxSpan if newEnd exceeds start + maxSpan', () => {
      const currentZoom: ZoomData = { axisId: 'x', start: 10, end: 30 };
      const options = { maxEnd: 100, minSpan: 5, maxSpan: 20 };

      const result = calculateZoomEnd(35, currentZoom, options);

      expect(result).to.eq(30);
    });

    it('should return start + minSpan if newEnd is less than start + minSpan', () => {
      const currentZoom: ZoomData = { axisId: 'x', start: 10, end: 30 };
      const options = { maxEnd: 100, minSpan: 5, maxSpan: 50 };

      const result = calculateZoomEnd(12, currentZoom, options);

      expect(result).to.eq(15);
    });
  });

  describe('calculateZoomFromPointImpl', () => {
    const defaultDrawingArea = {
      left: 100,
      top: 100,
      right: 300,
      bottom: 200,
      width: 200,
      height: 100,
    };

    it('should calculate correct zoom value for x-axis (bottom position)', () => {
      const result = calculateZoomFromPointImpl(
        defaultDrawingArea,
        { position: 'bottom' },
        { minStart: 0, maxEnd: 100, reverse: false },
        { x: 200, y: 0 },
      );

      expect(result).to.eq(50);
    });

    it('should calculate correct zoom value for y-axis (left position)', () => {
      const result = calculateZoomFromPointImpl(
        defaultDrawingArea,
        { position: 'left' },
        { minStart: 0, maxEnd: 100, reverse: false },
        { x: 0, y: 100 },
      );

      expect(result).to.eq(100);
    });

    it('should handle reversed x-axis', () => {
      const result = calculateZoomFromPointImpl(
        defaultDrawingArea,
        { position: 'bottom' },
        { minStart: 0, maxEnd: 100, reverse: true },
        { x: 300, y: 0 },
      );

      expect(result).to.eq(0); // Should be at the start due to reverse
    });

    it('should handle reversed y-axis', () => {
      const result = calculateZoomFromPointImpl(
        defaultDrawingArea,
        { position: 'left' },
        { minStart: 0, maxEnd: 100, reverse: true },
        { x: 0, y: 180 },
      );

      expect(result).to.eq(80);
    });

    it('should handle custom min/max range', () => {
      const result = calculateZoomFromPointImpl(
        defaultDrawingArea,
        { position: 'bottom' },
        { minStart: 20, maxEnd: 80, reverse: false },
        { x: 150, y: 0 },
      );

      expect(result).to.eq(35);
    });
  });

  describe('calculateZoomSliderPosition', () => {
    const zoomData = { start: 0, end: 25 };
    const zoomOptions = { minStart: 0, maxEnd: 100 };

    it('should place the zoom start on the left of an x-axis slider', () => {
      const result = calculateZoomSliderPosition(
        zoomData,
        { ...zoomOptions, axisDirection: 'x', reverse: false },
        200,
      );

      expect(result).to.deep.eq({ start: 0, end: 50 });
    });

    it('should place the zoom start on the right of a reversed x-axis slider', () => {
      const result = calculateZoomSliderPosition(
        zoomData,
        { ...zoomOptions, axisDirection: 'x', reverse: true },
        200,
      );

      expect(result).to.deep.eq({ start: 200, end: 150 });
    });

    it('should place the zoom start at the bottom of a y-axis slider', () => {
      const result = calculateZoomSliderPosition(
        zoomData,
        { ...zoomOptions, axisDirection: 'y', reverse: false },
        200,
      );

      expect(result).to.deep.eq({ start: 200, end: 150 });
    });

    it('should place the zoom start at the top of a reversed y-axis slider', () => {
      const result = calculateZoomSliderPosition(
        zoomData,
        { ...zoomOptions, axisDirection: 'y', reverse: true },
        200,
      );

      expect(result).to.deep.eq({ start: 0, end: 50 });
    });

    it('should handle custom min/max range', () => {
      const result = calculateZoomSliderPosition(
        { start: 20, end: 50 },
        { minStart: 20, maxEnd: 80, axisDirection: 'y', reverse: false },
        200,
      );

      expect(result).to.deep.eq({ start: 200, end: 100 });
    });

    it('should clamp the zoom range to the min/max range', () => {
      const result = calculateZoomSliderPosition(
        { start: 0, end: 100 },
        { minStart: 20, maxEnd: 80, axisDirection: 'x', reverse: false },
        200,
      );

      expect(result).to.deep.eq({ start: 0, end: 200 });
    });

    it('should be the inverse of `calculateZoomFromPointImpl`', () => {
      const drawingArea = { left: 100, top: 100, right: 300, bottom: 200, width: 200, height: 100 };
      const options = { minStart: 20, maxEnd: 80, axisDirection: 'y', reverse: true } as const;

      const { start } = calculateZoomSliderPosition({ start: 35, end: 80 }, options, 100);
      const zoom = calculateZoomFromPointImpl(drawingArea, { position: 'left' }, options, {
        x: 0,
        y: drawingArea.top + start,
      });

      expect(zoom).to.eq(35);
    });
  });
});
