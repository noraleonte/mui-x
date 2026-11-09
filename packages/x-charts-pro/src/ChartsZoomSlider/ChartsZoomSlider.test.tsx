/* eslint-disable no-promise-executor-return */
import * as React from 'react';
import { createRenderer, act } from '@mui/internal-test-utils';
import { isJSDOM } from 'test/utils/skipIf';
import { vi, describe, it, expect } from 'vitest';
import { BarChartPro } from '../BarChartPro/BarChartPro';
import type { BarChartProProps } from '../BarChartPro/BarChartPro';
import { LineChartPro } from '../LineChartPro/LineChartPro';
import type { LineChartProProps } from '../LineChartPro/LineChartPro';
import { chartsAxisZoomSliderThumbClasses } from './internals/chartsAxisZoomSliderThumbClasses';
import { chartsAxisZoomSliderTrackClasses } from './internals/chartsAxisZoomSliderTrackClasses';
import { ZOOM_SLIDER_TOUCH_TARGET } from './internals/constants';

const getAxisTickValues = (axis: 'x' | 'y'): string[] => {
  const axisData = Array.from(
    document.querySelectorAll(
      `.MuiChartsAxis-direction${axis.toUpperCase()} .MuiChartsAxis-tickContainer`,
    ),
  )
    .map((v) => v.textContent)
    .filter(Boolean);

  return axisData as string[];
};

describe.skipIf(isJSDOM)('<ChartsZoomSlider />', () => {
  const { render } = createRenderer();

  const lineChartProps: LineChartProProps = {
    series: [
      {
        data: [10, 20, 30, 40],
      },
    ],
    xAxis: [
      {
        scaleType: 'point',
        data: ['A', 'B', 'C', 'D'],
        zoom: {
          slider: {
            enabled: true,
          },
        },
        height: 30,
        id: 'x',
      },
    ],
    yAxis: [{ position: 'none' }],
    width: 100,
    height: 130,
    margin: 5,
    slotProps: { tooltip: { trigger: 'none' } },
  } as const;

  const options = {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <div style={{ width: 100, height: 130 }}>{children}</div>
    ),
  };

  it('should pan when using the slider track', async () => {
    const onZoomChange = vi.fn();
    const { user } = render(
      <LineChartPro
        {...lineChartProps}
        onZoomChange={onZoomChange}
        initialZoom={[{ axisId: 'x', start: 50, end: 100 }]}
      />,
      options,
    );

    expect(getAxisTickValues('x')).to.deep.equal(['C', 'D']);

    // Get the zoom slider thumb elements
    const sliderTrack = document.querySelector(`.${chartsAxisZoomSliderTrackClasses.active}`)!;

    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: sliderTrack,
        coords: { x: 50, y: 0 },
      },
      {
        target: sliderTrack,
        coords: { x: 20, y: 0 },
      },
      {
        keys: '[/MouseLeft]',
        target: sliderTrack,
        coords: { x: 20, y: 0 },
      },
    ]);
    await act(async () => new Promise((r) => requestAnimationFrame(r)));

    expect(onZoomChange.mock.calls.length).to.equal(1);
    // The visible area should have shifted left
    expect(getAxisTickValues('x')).to.deep.equal(['B']);
  });

  it('should zoom pulling the slider thumb', async () => {
    const onZoomChange = vi.fn();
    const { user } = render(
      <LineChartPro {...lineChartProps} onZoomChange={onZoomChange} />,
      options,
    );

    expect(getAxisTickValues('x')).to.deep.equal(['A', 'B', 'C', 'D']);

    // Find the slider elements
    const startThumb = document.querySelector(`.${chartsAxisZoomSliderThumbClasses.start}`)!;
    const endThumb = document.querySelector(`.${chartsAxisZoomSliderThumbClasses.end}`)!;

    // Move the start thumb to zoom in from the left
    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: startThumb,
        coords: { x: 0, y: 0 },
      },
      {
        target: startThumb,
        coords: { x: 40, y: 0 },
      },
      {
        keys: '[/MouseLeft]',
        target: startThumb,
        coords: { x: 40, y: 0 },
      },
    ]);
    await act(async () => new Promise((r) => requestAnimationFrame(r)));

    expect(onZoomChange.mock.calls.length).to.be.above(0);
    expect(getAxisTickValues('x')).to.not.include('A');

    // Reset zoom change spy
    onZoomChange.mockClear();

    // Move the end thumb to zoom in from the right
    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: endThumb,
        coords: { x: 0, y: 0 },
      },
      {
        target: endThumb,
        coords: { x: 60, y: 0 },
      },
      {
        keys: '[/MouseLeft]',
        target: endThumb,
        coords: { x: 60, y: 0 },
      },
    ]);
    await act(async () => new Promise((r) => requestAnimationFrame(r)));

    expect(onZoomChange.mock.calls.length).to.be.above(0);
    expect(getAxisTickValues('x')).to.not.include('D');
  });

  it('should pan down the list when dragging the slider track down on a band y-axis', async () => {
    const { user } = render(
      <BarChartPro
        layout="horizontal"
        series={[{ data: [10, 20, 30, 40] }]}
        yAxis={[
          {
            scaleType: 'band',
            data: ['A', 'B', 'C', 'D'],
            zoom: { slider: { enabled: true } },
            width: 30,
            id: 'y',
          },
        ]}
        xAxis={[{ position: 'none' }]}
        initialZoom={[{ axisId: 'y', start: 0, end: 50 }]}
        width={130}
        height={100}
        margin={5}
        slotProps={{ tooltip: { trigger: 'none' } }}
      />,
      {
        wrapper: ({ children }: { children?: React.ReactNode }) => (
          <div style={{ width: 130, height: 100 }}>{children}</div>
        ),
      },
    );

    expect(getAxisTickValues('y')).to.deep.equal(['A', 'B']);

    const sliderTrack = document.querySelector(`.${chartsAxisZoomSliderTrackClasses.active}`)!;

    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: sliderTrack,
        coords: { x: 0, y: 20 },
      },
      {
        target: sliderTrack,
        coords: { x: 0, y: 80 },
      },
      {
        keys: '[/MouseLeft]',
        target: sliderTrack,
        coords: { x: 0, y: 80 },
      },
    ]);
    await act(async () => new Promise((r) => requestAnimationFrame(r)));

    expect(getAxisTickValues('y')).to.deep.equal(['C', 'D']);
  });

  describe('touch targets', () => {
    it('should render invisible touch targets on thumbs that are at least ZOOM_SLIDER_TOUCH_TARGET size', () => {
      render(<LineChartPro {...lineChartProps} />, options);

      const thumbGroups = document.querySelectorAll(
        `[data-charts-zoom-slider] .${chartsAxisZoomSliderThumbClasses.root}`,
      );

      // Each thumb's visible rect should have a sibling touch target rect in the parent <g>
      thumbGroups.forEach((thumb) => {
        const group = thumb.parentElement!;
        const rects = group.querySelectorAll('rect');
        // The group should contain the touch target rect and the visible thumb rect
        expect(rects.length).to.equal(2);

        // The touch target (last rect, rendered on top) should be at least ZOOM_SLIDER_TOUCH_TARGET size
        const touchTarget = rects[1];
        expect(Number(touchTarget.getAttribute('width'))).to.be.greaterThanOrEqual(
          ZOOM_SLIDER_TOUCH_TARGET,
        );
        expect(Number(touchTarget.getAttribute('height'))).to.be.greaterThanOrEqual(
          ZOOM_SLIDER_TOUCH_TARGET,
        );
      });
    });

    it('should render invisible touch target on active track that is at least ZOOM_SLIDER_TOUCH_TARGET in the thin dimension', () => {
      render(<LineChartPro {...lineChartProps} />, options);

      const activeTrack = document.querySelector(`.${chartsAxisZoomSliderTrackClasses.active}`)!;

      // The touch target rect is the next sibling of the visible active track rect
      const touchTarget = activeTrack.nextElementSibling!;
      expect(touchTarget.tagName).to.equal('rect');
      expect(Number(touchTarget.getAttribute('height'))).to.be.greaterThanOrEqual(
        ZOOM_SLIDER_TOUCH_TARGET,
      );
    });
  });

  describe('tooltip', () => {
    const getZoomSliderTooltips = () => document.querySelectorAll('[data-popper-placement]');

    it('should show tooltip when showTooltip is "always"', async () => {
      render(
        <LineChartPro
          {...lineChartProps}
          xAxis={[
            {
              ...lineChartProps.xAxis![0],
              zoom: { slider: { enabled: true, showTooltip: 'always' } },
            },
          ]}
        />,
        options,
      );

      await act(async () => new Promise((r) => requestAnimationFrame(r)));

      expect(getZoomSliderTooltips().length).to.be.greaterThan(0);
    });

    it('should show tooltip on pointer enter when showTooltip is "hover"', async () => {
      const { user } = render(
        <LineChartPro
          {...lineChartProps}
          xAxis={[
            {
              ...lineChartProps.xAxis![0],
              zoom: { slider: { enabled: true, showTooltip: 'hover' } },
            },
          ]}
        />,
        options,
      );

      const startThumb = document.querySelector(`.${chartsAxisZoomSliderThumbClasses.start}`)!;

      await user.pointer([{ target: startThumb }]);
      await act(async () => new Promise((r) => requestAnimationFrame(r)));

      expect(getZoomSliderTooltips().length).to.be.greaterThan(0);
    });

    it('should show tooltip on pointerdown (touch interaction) when showTooltip is "hover"', async () => {
      const { user } = render(
        <LineChartPro
          {...lineChartProps}
          xAxis={[
            {
              ...lineChartProps.xAxis![0],
              zoom: { slider: { enabled: true, showTooltip: 'hover' } },
            },
          ]}
        />,
        options,
      );

      expect(getZoomSliderTooltips().length).to.equal(0);

      const startThumb = document.querySelector(`.${chartsAxisZoomSliderThumbClasses.start}`)!;

      // Simulate a touch press on the thumb
      await user.pointer([
        {
          keys: '[TouchA>]',
          target: startThumb,
          coords: { x: 0, y: 0 },
        },
      ]);
      await act(async () => new Promise((r) => requestAnimationFrame(r)));

      expect(getZoomSliderTooltips().length).to.be.greaterThan(0);

      // Release
      await user.pointer([
        {
          keys: '[/TouchA]',
          target: startThumb,
          coords: { x: 0, y: 0 },
        },
      ]);
    });

    it('should not show tooltip when showTooltip is "never"', async () => {
      const { user } = render(
        <LineChartPro
          {...lineChartProps}
          xAxis={[
            {
              ...lineChartProps.xAxis![0],
              zoom: { slider: { enabled: true, showTooltip: 'never' } },
            },
          ]}
        />,
        options,
      );

      const startThumb = document.querySelector(`.${chartsAxisZoomSliderThumbClasses.start}`)!;

      await user.pointer([{ target: startThumb }]);
      await act(async () => new Promise((r) => requestAnimationFrame(r)));

      expect(getZoomSliderTooltips().length).to.equal(0);
    });
  });
});

describe('<ChartsZoomSlider /> selection position', () => {
  const { render } = createRenderer();

  const getRect = (element: Element | null) => ({
    x: Number(element!.getAttribute('x')),
    y: Number(element!.getAttribute('y')),
    width: Number(element!.getAttribute('width')),
    height: Number(element!.getAttribute('height')),
  });

  const getSlider = (container: HTMLElement) => {
    const slider = container.querySelector('[data-charts-zoom-slider]')!;

    return {
      track: getRect(slider.querySelector('mask rect:nth-of-type(1)')),
      selectionMask: getRect(slider.querySelector('mask rect:nth-of-type(2)')),
      selection: getRect(slider.querySelector(`.${chartsAxisZoomSliderTrackClasses.active}`)),
      startThumb: getRect(slider.querySelector(`.${chartsAxisZoomSliderThumbClasses.start}`)),
      endThumb: getRect(slider.querySelector(`.${chartsAxisZoomSliderThumbClasses.end}`)),
    };
  };

  const barChartProps: BarChartProProps = {
    layout: 'horizontal',
    series: [{ data: [10, 20, 30, 40] }],
    initialZoom: [{ axisId: 'y', start: 0, end: 25 }],
    width: 400,
    height: 400,
  };

  // The first value of a band y-axis is rendered at the top of the chart.
  it('should place the selection at the top of the slider when a band y-axis shows its first values', () => {
    const { container } = render(
      <BarChartPro
        {...barChartProps}
        yAxis={[
          {
            id: 'y',
            scaleType: 'band',
            data: ['A', 'B', 'C', 'D'],
            zoom: { slider: { enabled: true, preview: true } },
          },
        ]}
      />,
    );

    const { track, selection, selectionMask, startThumb, endThumb } = getSlider(container);

    expect(selection.y).to.equal(0);
    expect(selection.height).to.be.closeTo(track.height / 4, 0.01);
    expect(selectionMask.y).to.equal(selection.y);
    expect(selectionMask.height).to.equal(selection.height);
    expect(startThumb.y).to.be.lessThan(endThumb.y);
  });

  it('should place the selection at the bottom of the slider when a reversed band y-axis shows its first values', () => {
    const { container } = render(
      <BarChartPro
        {...barChartProps}
        yAxis={[
          {
            id: 'y',
            scaleType: 'band',
            data: ['A', 'B', 'C', 'D'],
            reverse: true,
            zoom: { slider: { enabled: true, preview: true } },
          },
        ]}
      />,
    );

    const { track, selection, selectionMask, startThumb, endThumb } = getSlider(container);

    expect(selection.y + selection.height).to.be.closeTo(track.height, 0.01);
    expect(selection.height).to.be.closeTo(track.height / 4, 0.01);
    expect(selectionMask.y).to.equal(selection.y);
    expect(selectionMask.height).to.equal(selection.height);
    expect(startThumb.y).to.be.greaterThan(endThumb.y);
  });

  it('should align the preview mask with the selection on a reversed x-axis', () => {
    const { container } = render(
      <LineChartPro
        series={[{ data: [10, 20, 30, 40] }]}
        xAxis={[
          {
            id: 'x',
            data: [1, 2, 3, 4],
            reverse: true,
            zoom: { slider: { enabled: true, preview: true } },
          },
        ]}
        initialZoom={[{ axisId: 'x', start: 0, end: 25 }]}
        width={400}
        height={400}
      />,
    );

    const { track, selection, selectionMask } = getSlider(container);

    expect(selection.x + selection.width).to.be.closeTo(track.width, 0.01);
    expect(selectionMask.x).to.equal(selection.x);
    expect(selectionMask.width).to.equal(selection.width);
  });

  it('should align the preview mask with the selection on a reversed y-axis', () => {
    const { container } = render(
      <LineChartPro
        series={[{ data: [10, 20, 30, 40] }]}
        xAxis={[{ data: [1, 2, 3, 4] }]}
        yAxis={[{ id: 'y', reverse: true, zoom: { slider: { enabled: true, preview: true } } }]}
        initialZoom={[{ axisId: 'y', start: 0, end: 25 }]}
        width={400}
        height={400}
      />,
    );

    const { selection, selectionMask } = getSlider(container);

    expect(selection.y).to.equal(0);
    expect(selectionMask.y).to.equal(selection.y);
    expect(selectionMask.height).to.equal(selection.height);
  });
});
