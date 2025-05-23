'use client';

import * as React from 'react';
import { styled } from '@mui/material/styles';
import useForkRef from '@mui/utils/useForkRef';
import useEventCallback from '@mui/utils/useEventCallback';
import { rafThrottle } from '@mui/x-internals/rafThrottle';
import clsx from 'clsx';
import {
  chartAxisZoomSliderHandleClasses,
  useUtilityClasses,
} from './chartAxisZoomSliderHandleClasses';

const Rect = styled('rect')(({ theme }) => ({
  [`&.${chartAxisZoomSliderHandleClasses.root}`]: {
    fill:
      theme.palette.mode === 'dark'
        ? (theme.vars || theme).palette.grey[300]
        : (theme.vars || theme).palette.common.white,
    stroke:
      theme.palette.mode === 'dark'
        ? (theme.vars || theme).palette.grey[600]
        : (theme.vars || theme).palette.grey[500],
  },
  [`&.${chartAxisZoomSliderHandleClasses.horizontal}`]: {
    cursor: 'ew-resize',
  },
  [`&.${chartAxisZoomSliderHandleClasses.vertical}`]: {
    cursor: 'ns-resize',
  },
}));

export interface ChartZoomSliderHandleOwnerState {
  onMove: (event: PointerEvent) => void;
  orientation: 'horizontal' | 'vertical';
  placement: 'start' | 'end';
}

export interface ChartZoomSliderHandleProps
  extends Omit<React.ComponentProps<'rect'>, 'orientation'>,
    ChartZoomSliderHandleOwnerState {}

/**
 * Renders the zoom slider handle, which is responsible for resizing the zoom range.
 * @internal
 */
export const ChartAxisZoomSliderHandle = React.forwardRef<
  SVGRectElement,
  ChartZoomSliderHandleProps
>(function ChartPreviewHandle(
  { className, onMove, orientation, placement, rx = 4, ry = 4, ...rest },
  forwardedRef,
) {
  const classes = useUtilityClasses({ onMove, orientation, placement });

  const handleRef = React.useRef<SVGRectElement>(null);
  const ref = useForkRef(handleRef, forwardedRef);

  const onMoveEvent = useEventCallback(onMove);

  React.useEffect(() => {
    const handle = handleRef.current;

    if (!handle) {
      return;
    }

    const onPointerMove = rafThrottle((event: PointerEvent) => {
      onMoveEvent(event);
    });

    const onPointerUp = () => {
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
    };

    const onPointerDown = (event: PointerEvent) => {
      // Prevent text selection when dragging the handle
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture(event.pointerId);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointermove', onPointerMove);
    };

    handle.addEventListener('pointerdown', onPointerDown);

    // eslint-disable-next-line consistent-return
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      onPointerMove.clear();
    };
  }, [onMoveEvent, orientation]);

  return <Rect className={clsx(classes.root, className)} ref={ref} rx={rx} ry={ry} {...rest} />;
});
