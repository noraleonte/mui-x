import * as React from 'react';
import { styled } from '@mui/material/styles';
import { selectorChartAxisZoomOptionsLookup, useStore } from '@mui/x-charts/internals';
import type { AxisId, SeriesId } from '@mui/x-charts/internals';
import { alpha } from '@mui/system';
import useId from '@mui/utils/useId';
import { selectorChartAxisZoomData } from '../../internals/plugins/useChartProZoom';
import { ChartsAxisZoomSliderPreviewContent } from './ChartsAxisZoomSliderPreviewContent';
import { calculateZoomSliderPosition } from './zoom-utils';

const PreviewBackgroundRect = styled('rect', {
  slot: 'internal',
  shouldForwardProp: undefined,
})(({ theme }) => ({
  rx: 4,
  ry: 4,
  stroke: (theme.vars || theme).palette.grey[700],
  fill: alpha(theme.palette.grey[700], 0.4),
}));

interface ChartsAxisZoomSliderPreviewProps {
  axisId: AxisId;
  axisDirection: 'x' | 'y';
  reverse: boolean;
  x: number;
  y: number;
  height: number;
  width: number;
  /**
   * If provided, only the series with these IDs will be shown in the preview.
   */
  seriesIds?: SeriesId[];
}

export function ChartsAxisZoomSliderPreview({
  axisId,
  axisDirection,
  reverse,
  seriesIds,
  ...props
}: ChartsAxisZoomSliderPreviewProps) {
  return (
    <g {...props}>
      <PreviewRectangles {...props} axisId={axisId} axisDirection={axisDirection} />
      <rect {...props} fill="transparent" rx={4} ry={4} />
      <ChartsAxisZoomSliderPreviewContent axisId={axisId} seriesIds={seriesIds} {...props} />
    </g>
  );
}

function PreviewRectangles(props: {
  axisId: AxisId;
  axisDirection: 'x' | 'y';
  x: number;
  y: number;
  height: number;
  width: number;
}) {
  const { axisId, axisDirection } = props;
  const store = useStore();

  const zoomData = store.use(selectorChartAxisZoomData, axisId);
  const zoomOptions = store.use(selectorChartAxisZoomOptionsLookup, axisId);
  const id = useId();

  if (!zoomData) {
    return null;
  }

  const maskId = `zoom-preview-mask-${axisId}-${id}`;

  let x;
  let y;
  let width;
  let height;

  const { start, end } = calculateZoomSliderPosition(
    zoomData,
    zoomOptions,
    axisDirection === 'x' ? props.width : props.height,
  );
  if (axisDirection === 'x') {
    x = props.x + Math.min(start, end);
    y = props.y;
    width = Math.abs(end - start);
    height = props.height;
  } else {
    x = props.x;
    y = props.y + Math.min(start, end);
    width = props.width;
    height = Math.abs(end - start);
  }

  return (
    <React.Fragment>
      <mask id={maskId}>
        <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="white" />
        <rect x={x} y={y} width={width} height={height} fill="black" rx={4} ry={4} />
      </mask>
      <PreviewBackgroundRect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        mask={`url(#${maskId})`}
      />
    </React.Fragment>
  );
}
