import * as React from 'react';
import clsx from 'clsx';
import { alpha, styled, useThemeProps, CSSInterpolation } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import {
  unstable_useEnhancedEffect as useEnhancedEffect,
  unstable_composeClasses as composeClasses,
  unstable_useForkRef as useForkRef,
} from '@mui/utils';
import { DAY_MARGIN } from '../internals/constants/dimensions';
import {
  enhancedPickersDayClasses,
  getEnhancedPickersDayUtilityClass,
} from './enhancedPickersDayClasses';
import { useUtils } from '../internals/hooks/useUtils';
import { EnhancedPickersDayOwnerState, EnhancedPickersDayProps } from './EnhancedPickersDay.types';
import { usePickerDayOwnerState } from '../PickersDay/usePickerDayOwnerState';

const DAY_SIZE = 40;

const useUtilityClasses = (ownerState: EnhancedPickersDayOwnerState) => {
  const {
    isDaySelected,
    disableHighlightToday,
    isDayCurrent,
    isDayDisabled,
    isDayOutsideMonth,
    isDayFillerCell,
    isDayPreviewStart,
    isDayPreviewEnd,
    isDayInsidePreview,
    isDayPreviewed,
    isDaySelectionStart,
    isDaySelectionEnd,
    isDayInsideSelection,
    isDayStartOfWeek,
    isDayEndOfWeek,
    disableMargin,
    isDayStartOfMonth,
    isDayEndOfMonth,
  } = ownerState;

  const slots = {
    root: [
      'root',
      isDaySelected && !isDayFillerCell && 'selected',
      isDayDisabled && 'disabled',
      !disableHighlightToday && isDayCurrent && !isDaySelected && !isDayFillerCell && 'today',
      isDayOutsideMonth && 'dayOutsideMonth',
      isDayFillerCell && 'hiddenDay',
      isDayPreviewStart && 'previewStart',
      isDayPreviewEnd && 'previewEnd',
      isDayInsidePreview && 'insidePreviewing',
      isDaySelectionStart && 'selectionStart',
      isDaySelectionEnd && 'selectionEnd',
      isDayInsideSelection && 'insideSelection',
      isDayEndOfWeek && 'endOfWeek',
      isDayStartOfWeek && 'startOfWeek',
      isDayPreviewed && 'previewed',
      isDayStartOfMonth && 'startOfMonth',
      isDayEndOfMonth && 'endOfMonth',
      disableMargin && 'disableMargin',
    ],
  };

  return composeClasses(slots, getEnhancedPickersDayUtilityClass, {});
};

const overridesResolver = (props: { ownerState: any }, styles: Record<any, CSSInterpolation>) => {
  const { ownerState } = props;
  return [
    styles.root,
    !ownerState.disableHighlightToday && ownerState.today && styles.today,
    !ownerState.isDayOutsideMonth && styles.dayOutsideMonth,
    ownerState.isDayFillerCell && styles.hiddenDay,
    ownerState.isDayPreviewStart && styles.previewStart,
    ownerState.isDayPreviewEnd && styles.previewEnd,
    ownerState.isDayInsidePreview && styles.insidePreviewing,
    ownerState.isDaySelectionStart && styles.selectionStart,
    ownerState.isDaySelectionEnd && styles.selectionEnd,
    ownerState.isDayInsideSelection && styles.insideSelection,
    ownerState.isDragSelected && styles.dragSelected,
    ownerState.isDayStartOfWeek && styles.startOfWeek,
    ownerState.isDayEndOfWeek && styles.endOfWeek,
  ];
};

const SET_MARGIN = DAY_MARGIN; // should be working with any given margin
const highlightStyles = (theme) => ({
  zIndex: 0,
  content: '""' /* Creates an empty element */,
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.focusOpacity})`
    : alpha(theme.palette.primary.main, theme.palette.action.focusOpacity),
  boxSizing: 'content-box',
});
const previewStyles = (theme) => ({
  zIndex: 0,
  content: '""' /* Creates an empty element */,
  position: 'absolute',
  width: 'calc(100% - 2px)',
  height: 'calc(100% - 2px)',
  border: `1px dashed ${(theme.vars || theme).palette.divider}`,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  boxSizing: 'content-box',
});

const selectedDayStyles = (theme) => ({
  color: (theme.vars || theme).palette.primary.contrastText,
  backgroundColor: (theme.vars || theme).palette.primary.main,
  fontWeight: theme.typography.fontWeightMedium,
  '&:focus': {
    willChange: 'background-color',
    backgroundColor: (theme.vars || theme).palette.primary.dark,
  },
  '&:hover': {
    willChange: 'background-color',
    backgroundColor: (theme.vars || theme).palette.primary.dark,
  },
  [`&.${enhancedPickersDayClasses.disabled}`]: {
    opacity: 0.6,
  },
});

const styleArg = ({ theme }) => ({
  ...theme.typography.caption,
  width: DAY_SIZE,
  height: DAY_SIZE,
  borderRadius: '50%',
  padding: 0,
  marginLeft: SET_MARGIN,
  marginRight: SET_MARGIN,
  // explicitly setting to `transparent` to avoid potentially getting impacted by change from the overridden component
  backgroundColor: 'transparent',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short,
  }),
  color: (theme.vars || theme).palette.text.primary,

  '@media (pointer: fine)': {
    '&:hover': {
      backgroundColor: theme.vars
        ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.hoverOpacity})`
        : alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
    },
  },
  '&:focus': {
    backgroundColor: theme.vars
      ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.focusOpacity})`
      : alpha(theme.palette.primary.main, theme.palette.action.focusOpacity),
  },

  variants: [
    {
      props: { isDaySelected: true },
      style: {
        ...selectedDayStyles(theme),
      },
    },
    {
      props: { isDayDisabled: true },
      style: {
        color: (theme.vars || theme).palette.text.disabled,
      },
    },
    {
      props: { isDayFillerCell: true },
      style: {
        visibility: 'hidden',
      },
    },
    {
      props: { isDayOutsideMonth: true },
      style: {
        color: (theme.vars || theme).palette.text.secondary,
      },
    },
    {
      props: {
        isDayCurrent: true,
        isDaySelected: false,
      },
      style: {
        outline: `1px solid ${(theme.vars || theme).palette.text.secondary}`,
        outlineOffset: -1,
      },
    },
    {
      props: { isDayPreviewStart: true },
      style: {
        '::after': {
          ...previewStyles(theme),
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
          paddingRight: SET_MARGIN,
          left: 0,
        },
      },
    },
    {
      props: { isDayPreviewStart: true, isDaySelectionEnd: false },
      style: {
        '::after': {
          borderLeftColor: (theme.vars || theme).palette.divider,
        },
      },
    },

    {
      props: { isDayPreviewEnd: true },
      style: {
        '::after': {
          ...previewStyles(theme),
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
          paddingLeft: SET_MARGIN,
          right: 0,
        },
      },
    },
    {
      props: { isDayPreviewEnd: true, isDaySelectionStart: false },
      style: {
        '::after': {
          borderRightColor: (theme.vars || theme).palette.divider,
        },
      },
    },

    {
      props: { isDayInsidePreview: true },
      style: {
        '::after': {
          ...previewStyles(theme),
          paddingLeft: SET_MARGIN,
          paddingRight: SET_MARGIN,
        },
      },
    },

    {
      props: { isDaySelectionStart: true },
      style: {
        '::before': {
          ...highlightStyles(theme),
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
          paddingRight: SET_MARGIN,
          left: 0,
        },
      },
    },
    {
      props: { isDaySelectionEnd: true },
      style: {
        '::before': {
          ...highlightStyles(theme),
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
          paddingLeft: SET_MARGIN,
          right: 0,
        },
      },
    },
    {
      props: { isDayInsideSelection: true },
      color: 'initial',
      background: 'initial',

      style: {
        '::before': {
          ...highlightStyles(theme),
          paddingLeft: SET_MARGIN,
          paddingRight: SET_MARGIN,
        },
      },
    },

    {
      props: { isDayEndOfWeek: true },
      style: {
        '::after': {
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
          borderRightColor: (theme.vars || theme).palette.divider,
          paddingRight: 0,
          right: 0,
        },
        '::before': {
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
          paddingRight: 0,
          right: 0,
        },
      },
    },
    {
      props: {
        isDayStartOfWeek: true,
      },
      style: {
        '::after': {
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
          borderLeftColor: (theme.vars || theme).palette.divider,
          paddingLeft: 0,
          left: 0,
        },
        '::before': {
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
          paddingLeft: 0,
          left: 0,
        },
      },
    },
  ],
});

const EnhancedPickersDayRoot = styled(ButtonBase, {
  name: 'MuiEnhancedPickersDay',
  slot: 'Root',
  overridesResolver,
})<{ ownerState: EnhancedPickersDayOwnerState }>(styleArg);

type EnhancedPickersDayComponent = ((
  props: EnhancedPickersDayProps & React.RefAttributes<HTMLButtonElement>,
) => React.JSX.Element) & { propTypes?: any };

const noop = () => {};

const EnhancedPickersDayRaw = React.forwardRef(function EnhancedPickersDay(
  inProps: EnhancedPickersDayProps,
  forwardedRef: React.Ref<HTMLButtonElement>,
) {
  const props = useThemeProps({
    props: inProps,
    name: 'MuiEnhancedPickersDay',
  });

  const utils = useUtils();

  const {
    autoFocus = false,
    className,
    classes: classesProp,
    hidden,
    isAnimating,
    onClick,
    onDaySelect,
    onFocus = noop,
    onBlur = noop,
    onKeyDown = noop,
    onMouseDown = noop,
    onMouseEnter = noop,
    children,
    isFirstVisibleCell,
    isLastVisibleCell,
    day,
    selected,
    disabled,
    today,
    outsideCurrentMonth,
    disableMargin,
    disableHighlightToday,
    showDaysOutsideCurrentMonth,
    isEndOfHighlighting,
    isEndOfPreviewing,
    isHighlighting,
    isPreviewing,
    isStartOfHighlighting,
    isStartOfPreviewing,
    isVisuallySelected,
    ...other
  } = props;

  const pickersDayOwnerState = usePickerDayOwnerState({
    day,
    selected,
    disabled,
    today,
    outsideCurrentMonth,
    disableMargin,
    disableHighlightToday,
    showDaysOutsideCurrentMonth,
  });

  const ownerState: EnhancedPickersDayOwnerState = {
    ...pickersDayOwnerState,
    // Properties that the Base UI implementation will have
    isDaySelectionStart: isStartOfHighlighting,
    isDaySelectionEnd: isEndOfHighlighting,
    isDayInsideSelection: isHighlighting && !isStartOfHighlighting && !isEndOfHighlighting,
    isDaySelected: isHighlighting || Boolean(selected),
    isDayPreviewed: isPreviewing,
    isDayPreviewStart: isStartOfPreviewing,
    isDayPreviewEnd: isEndOfPreviewing,
    isDayInsidePreview: isPreviewing && !isStartOfPreviewing && !isEndOfPreviewing,
    // Properties specific to the MUI implementation (some might be removed in the next major)
    isDayStartOfMonth: utils.isSameDay(day, utils.startOfMonth(day)),
    isDayEndOfMonth: utils.isSameDay(day, utils.endOfMonth(day)),
    isDayFirstVisibleCell: isFirstVisibleCell,
    isDayLastVisibleCell: isLastVisibleCell,
    isDayFillerCell: outsideCurrentMonth && !showDaysOutsideCurrentMonth,
  };

  const classes = useUtilityClasses(ownerState);

  const ref = React.useRef<HTMLButtonElement>(null);
  const handleRef = useForkRef(ref, forwardedRef);

  // Since this is rendered when a Popper is opened we can't use passive effects.
  // Focusing in passive effects in Popper causes scroll jump.
  useEnhancedEffect(() => {
    if (autoFocus && !disabled && !isAnimating && !outsideCurrentMonth) {
      // ref.current being null would be a bug in MUI
      ref.current!.focus();
    }
  }, [autoFocus, disabled, isAnimating, outsideCurrentMonth]);

  // For a day outside the current month, move the focus from mouseDown to mouseUp
  // Goal: have the onClick ends before sliding to the new month
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    onMouseDown(event);
    if (outsideCurrentMonth) {
      event.preventDefault();
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      onDaySelect(day);
    }

    if (outsideCurrentMonth) {
      event.currentTarget.focus();
    }

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <EnhancedPickersDayRoot
      ref={handleRef}
      centerRipple
      data-testid="day"
      disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onKeyDown={(event) => onKeyDown(event, day)}
      onFocus={(event) => onFocus(event, day)}
      onBlur={(event) => onBlur(event, day)}
      onMouseEnter={(event) => onMouseEnter(event, day)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      {...other}
      ownerState={ownerState}
      className={clsx(classes.root, className)}
    >
      {!children ? utils.format(day, 'dayOfMonth') : children}
    </EnhancedPickersDayRoot>
  );
});

export const EnhancedPickersDay = React.memo(EnhancedPickersDayRaw) as EnhancedPickersDayComponent;
