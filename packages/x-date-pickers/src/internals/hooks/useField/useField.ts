import * as React from 'react';
import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import useEventCallback from '@mui/utils/useEventCallback';
import useForkRef from '@mui/utils/useForkRef';
import { useTheme } from '@mui/material/styles';
import { useValidation } from '../useValidation';
import { useUtils } from '../useUtils';
import {
  UseFieldParams,
  UseFieldResponse,
  UseFieldForwardedProps,
  UseFieldInternalProps,
  AvailableAdjustKeyCode,
} from './useField.types';
import {
  adjustSectionValue,
  isAndroid,
  getSectionOrder,
  getActiveSectionIndexFromDOM,
  isFocusInsideContainer,
  getSectionIndexFromDOMElement,
} from './useField.utils';
import { useFieldState } from './useFieldState';
import { useFieldCharacterEditing } from './useFieldCharacterEditing';
import { getActiveElement } from '../../utils/utils';
import { FieldSection } from '../../../models';
import type { FakeTextFieldElement } from '../../components/FakeTextField/FakeTextField';

export const useField = <
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any> & { minutesStep?: number },
>(
  params: UseFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
): UseFieldResponse<TForwardedProps> => {
  const utils = useUtils<TDate>();

  const {
    state,
    selectedSectionIndex,
    setSelectedSection,
    clearValue,
    clearActiveSection,
    updateSectionValue,
    updateValueFromValueStr,
    setTempAndroidValueStr,
    sectionsValueBoundaries,
    placeholder,
    timezone,
  } = useFieldState(params);

  const {
    internalProps,
    internalProps: { readOnly = false, unstableFieldRef, minutesStep },
    forwardedProps: {
      onBlur,
      onPaste,
      error,
      clearable,
      onClear,
      disabled,
      ref: inContainerRef,
      ...otherForwardedProps
    },
    fieldValueManager,
    valueManager,
    validator,
  } = params;

  const { applyCharacterEditing, resetCharacterQuery } = useFieldCharacterEditing<TDate, TSection>({
    sections: state.sections,
    updateSectionValue,
    sectionsValueBoundaries,
    setTempAndroidValueStr,
    timezone,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = useForkRef(inContainerRef, containerRef);
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';

  const sectionOrder = React.useMemo(
    () => getSectionOrder(state.sections, isRTL),
    [state.sections, isRTL],
  );

  const syncSelectionFromDOM = () => {
    if (readOnly) {
      setSelectedSection(null);
      return;
    }

    const browserActiveSectionIndex = getActiveSectionIndexFromDOM(containerRef);
    setSelectedSection(browserActiveSectionIndex);
  };

  const handleInputClick = useEventCallback((event: React.MouseEvent) => {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call of `handleInputClick` is actually intended, or a side effect.
    if (event.isDefaultPrevented()) {
      return;
    }

    syncSelectionFromDOM();
  });

  const handleInputMouseUp = useEventCallback((event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  });

  const handleInputFocus = useEventCallback(() => {
    syncSelectionFromDOM();
  });

  const handleContainerBlur = useEventCallback((...args) => {
    onBlur?.(...(args as []));
    setSelectedSection(null);
  });

  const handleInputPaste = useEventCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);

    if (readOnly) {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    if (selectedSectionIndex != null) {
      const activeSection = state.sections[selectedSectionIndex];

      const lettersOnly = /^[a-zA-Z]+$/.test(pastedValue);
      const digitsOnly = /^[0-9]+$/.test(pastedValue);
      const digitsAndLetterOnly = /^(([a-zA-Z]+)|)([0-9]+)(([a-zA-Z]+)|)$/.test(pastedValue);
      const isValidPastedValue =
        (activeSection.contentType === 'letter' && lettersOnly) ||
        (activeSection.contentType === 'digit' && digitsOnly) ||
        (activeSection.contentType === 'digit-with-letter' && digitsAndLetterOnly);
      if (isValidPastedValue) {
        // Early return to let the paste update section, value
        return;
      }
      if (lettersOnly || digitsOnly) {
        // The pasted value correspond to a single section but not the expected type
        // skip the modification
        event.preventDefault();
        return;
      }
    }

    event.preventDefault();
    resetCharacterQuery();
    updateValueFromValueStr(pastedValue);
  });

  const handleInputChange = useEventCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) {
      return;
    }

    const keyPressed = event.target.value;

    // TODO: Support Android
    if (isAndroid() && keyPressed.length === 0) {
      // setTempAndroidValueStr(valueStr);
      return;
    }

    applyCharacterEditing({
      keyPressed,
      sectionIndex: getSectionIndexFromDOMElement(event.target)!,
    });
  });

  const handleInputKeyDown = useEventCallback((event: React.KeyboardEvent) => {
    // eslint-disable-next-line default-case
    switch (true) {
      // // Select all
      // case event.key === 'a' && (event.ctrlKey || event.metaKey): {
      //   // prevent default to make sure that the next line "select all" while updating
      //   // the internal state at the same time.
      //   event.preventDefault();
      //   setSelectedSections('all');
      //   break;
      // }

      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();

        if (selectedSectionIndex == null) {
          setSelectedSection(sectionOrder.startIndex);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[selectedSectionIndex].rightIndex;
          if (nextSectionIndex !== null) {
            setSelectedSection(nextSectionIndex);
          }
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSectionIndex == null) {
          setSelectedSection(sectionOrder.endIndex);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[selectedSectionIndex].leftIndex;
          if (nextSectionIndex !== null) {
            setSelectedSection(nextSectionIndex);
          }
        }
        break;
      }

      // Reset the value of the selected section
      case ['Backspace', 'Delete'].includes(event.key): {
        event.preventDefault();

        if (readOnly) {
          break;
        }

        clearActiveSection();
        resetCharacterQuery();
        break;
      }

      // Increment / decrement the selected section value
      case ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key): {
        event.preventDefault();

        if (readOnly || selectedSectionIndex == null) {
          break;
        }

        const activeSection = state.sections[selectedSectionIndex];
        const activeDateManager = fieldValueManager.getActiveDateManager(
          utils,
          state,
          activeSection,
        );

        const newSectionValue = adjustSectionValue(
          utils,
          timezone,
          activeSection,
          event.key as AvailableAdjustKeyCode,
          sectionsValueBoundaries,
          activeDateManager.date,
          { minutesStep },
        );

        updateSectionValue({
          activeSection,
          newSectionValue,
          shouldGoToNextSection: false,
        });
        break;
      }
    }
  });

  useEnhancedEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (selectedSectionIndex == null) {
      if (isFocusInsideContainer(containerRef)) {
        containerRef.current.blur();
      }
      return;
    }

    const inputToFocus = containerRef.current.querySelector<HTMLInputElement>(
      `input[data-sectionindex="${selectedSectionIndex}"]`,
    );
    if (!inputToFocus) {
      return;
    }

    // Fix scroll jumping on iOS browser: https://github.com/mui/mui-x/issues/8321
    const currentScrollTop = inputToFocus.scrollTop;
    inputToFocus.select();
    // Even reading this variable seems to do the trick, but also setting it just to make use of it
    inputToFocus.scrollTop = currentScrollTop;
  });

  const validationError = useValidation(
    { ...internalProps, value: state.value, timezone },
    validator,
    valueManager.isSameError,
    valueManager.defaultErrorState,
  );

  const inputError = React.useMemo(() => {
    // only override when `error` is undefined.
    // in case of multi input fields, the `error` value is provided externally and will always be defined.
    if (error !== undefined) {
      return error;
    }

    return valueManager.hasError(validationError);
  }, [valueManager, validationError, error]);

  React.useEffect(() => {
    if (!inputError && selectedSectionIndex == null) {
      resetCharacterQuery();
    }
  }, [state.referenceValue, selectedSectionIndex, inputError]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    // Select the right section when focused on mount (`autoFocus = true` on the input)
    if (containerRef.current && containerRef.current.contains(getActiveElement(document))) {
      setSelectedSection(0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If `state.tempValueStrAndroid` is still defined when running `useEffect`,
  // Then `onChange` has only been called once, which means the user pressed `Backspace` to reset the section.
  // This causes a small flickering on Android,
  // But we can't use `useEnhancedEffect` which is always called before the second `onChange` call and then would cause false positives.
  React.useEffect(() => {
    if (state.tempValueStrAndroid != null && selectedSectionIndex != null) {
      resetCharacterQuery();
      clearActiveSection();
    }
  }, [state.tempValueStrAndroid]); // eslint-disable-line react-hooks/exhaustive-deps

  const valueStr = React.useMemo(
    () =>
      state.tempValueStrAndroid ?? fieldValueManager.getValueStrFromSections(state.sections, isRTL),
    [state.sections, fieldValueManager, state.tempValueStrAndroid, isRTL],
  );

  const inputMode = React.useMemo(() => {
    if (selectedSectionIndex == null) {
      return 'text';
    }

    if (state.sections[selectedSectionIndex].contentType === 'letter') {
      return 'text';
    }

    return 'numeric';
  }, [selectedSectionIndex, state.sections]);

  const areAllSectionsEmpty = valueManager.areValuesEqual(
    utils,
    state.value,
    valueManager.emptyValue,
  );
  const shouldShowPlaceholder = !isFocusInsideContainer(containerRef) && areAllSectionsEmpty;

  React.useImperativeHandle(unstableFieldRef, () => ({
    getSections: () => state.sections,
    getActiveSectionIndex: () => getActiveSectionIndexFromDOM(containerRef),
    setSelectedSections: (activeSectionIndex) => setSelectedSection(activeSectionIndex),
  }));

  const handleClearValue = useEventCallback((event: React.MouseEvent, ...args) => {
    event.preventDefault();
    onClear?.(event, ...(args as []));
    clearValue();
    setSelectedSection(0);
  });

  const textFieldElements = React.useMemo<FakeTextFieldElement[]>(
    () =>
      state.sections.map((section, sectionIndex) => ({
        before: section.startSeparator,
        after: section.endSeparator,
        value: shouldShowPlaceholder ? '' : section.value || section.placeholder,
        placeholder: section.placeholder,
        'data-sectionindex': sectionIndex,
        onChange: handleInputChange,
        onClick: handleInputClick,
        onFocus: handleInputFocus,
        onKeyDown: handleInputKeyDown,
        onMouseUp: handleInputMouseUp,
      })),
    [
      state.sections,
      shouldShowPlaceholder,
      handleInputFocus,
      handleInputKeyDown,
      handleInputChange,
      handleInputClick,
      handleInputMouseUp,
    ],
  );

  return {
    placeholder,
    autoComplete: 'off',
    disabled: Boolean(disabled),
    ...otherForwardedProps,
    elements: textFieldElements,
    value: shouldShowPlaceholder ? '' : valueStr,
    inputMode,
    readOnly,
    onBlur: handleContainerBlur,
    onPaste: handleInputPaste,
    onClear: handleClearValue,
    error: inputError,
    ref: handleRef,
    clearable: Boolean(clearable && !areAllSectionsEmpty && !readOnly && !disabled),
  };
};
