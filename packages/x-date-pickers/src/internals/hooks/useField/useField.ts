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
    selectedSectionIndexes,
    setSelectedSections,
    clearValue,
    clearActiveSection,
    updateSectionValue,
    updateValueFromValueStr,
    setSectionTempValueStr,
    resetSectionsTempValueStr,
    sectionsValueBoundaries,
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
      disabled = false,
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
    resetSectionsTempValueStr,
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
      setSelectedSections(null);
      return;
    }

    const browserActiveSectionIndex = getActiveSectionIndexFromDOM(containerRef);
    setSelectedSections(browserActiveSectionIndex);
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
    setSelectedSections(null);
  });

  const handleContainerPaste = useEventCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (readOnly) {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    if (
      selectedSectionIndexes &&
      selectedSectionIndexes.startIndex === selectedSectionIndexes.endIndex
    ) {
      const activeSection = state.sections[selectedSectionIndexes.startIndex];

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
    if (keyPressed === '') {
      resetCharacterQuery();
      clearValue();
      return;
    }

    const sectionIndex = getSectionIndexFromDOMElement(event.target)!;

    if (keyPressed.length === 0) {
      if (isAndroid()) {
        setSectionTempValueStr(sectionIndex, keyPressed);
      } else {
        resetCharacterQuery();
        clearActiveSection();
      }
      return;
    }

    applyCharacterEditing({
      keyPressed,
      sectionIndex,
    });
  });

  const handleInputKeyDown = useEventCallback((event: React.KeyboardEvent) => {
    // eslint-disable-next-line default-case
    switch (true) {
      // Select all
      case event.key === 'a' && (event.ctrlKey || event.metaKey): {
        // prevent default to make sure that the next line "select all" while updating
        // the internal state at the same time.
        event.preventDefault();
        setSelectedSections('all');
        break;
      }

      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();

        if (selectedSectionIndexes == null) {
          setSelectedSections(sectionOrder.startIndex);
        } else if (selectedSectionIndexes.startIndex !== selectedSectionIndexes.endIndex) {
          setSelectedSections(selectedSectionIndexes.endIndex);
        } else {
          const nextSectionIndex =
            sectionOrder.neighbors[selectedSectionIndexes.startIndex].rightIndex;
          if (nextSectionIndex !== null) {
            setSelectedSections(nextSectionIndex);
          }
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSectionIndexes == null) {
          setSelectedSections(sectionOrder.endIndex);
        } else if (selectedSectionIndexes.startIndex !== selectedSectionIndexes.endIndex) {
          setSelectedSections(selectedSectionIndexes.startIndex);
        } else {
          const nextSectionIndex =
            sectionOrder.neighbors[selectedSectionIndexes.startIndex].leftIndex;
          if (nextSectionIndex !== null) {
            setSelectedSections(nextSectionIndex);
          }
        }
        break;
      }

      // Reset the value of the selected section
      case event.key === 'Delete': {
        event.preventDefault();

        if (readOnly) {
          break;
        }

        if (
          selectedSectionIndexes == null ||
          (selectedSectionIndexes.startIndex === 0 &&
            selectedSectionIndexes.endIndex === state.sections.length - 1)
        ) {
          clearValue();
        } else {
          clearActiveSection();
        }
        resetCharacterQuery();
        break;
      }

      // Increment / decrement the selected section value
      case ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key): {
        event.preventDefault();

        if (readOnly || selectedSectionIndexes == null) {
          break;
        }

        const activeSection = state.sections[selectedSectionIndexes.startIndex];
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

    // Focus no section
    if (selectedSectionIndexes == null) {
      if (isFocusInsideContainer(containerRef)) {
        containerRef.current.blur();
      }
      return;
    }

    // Focus one section
    if (selectedSectionIndexes.startIndex === selectedSectionIndexes.endIndex) {
      const inputToFocus = containerRef.current.querySelector<HTMLInputElement>(
        `div[data-sectionindex="${selectedSectionIndexes.startIndex}"] input`,
      );
      if (!inputToFocus) {
        return;
      }

      // Fix scroll jumping on iOS browser: https://github.com/mui/mui-x/issues/8321
      const currentScrollTop = inputToFocus.scrollTop;
      inputToFocus.select();
      // Even reading this variable seems to do the trick, but also setting it just to make use of it
      inputToFocus.scrollTop = currentScrollTop;
      return;
    }

    // Focus several sections
    const selection = document.getSelection();
    if (!selection) {
      return;
    }

    const range = new Range();
    const startSectionBefore = containerRef.current.querySelector(
      `div[data-sectionindex="${selectedSectionIndexes.startIndex}"] .before`,
    )!;
    const endSectionAfter = containerRef.current.querySelector(
      `div[data-sectionindex="${selectedSectionIndexes.endIndex}"] .after`,
    )!;

    if (selectedSectionIndexes.shouldSelectBoundarySelectors) {
      range.setStart(startSectionBefore, 0);
      range.setEnd(endSectionAfter, 1);
    } else {
      range.setStart(startSectionBefore, 1);
      range.setEnd(endSectionAfter, 0);
    }

    selection.removeAllRanges();
    selection.addRange(range);
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
    if (!inputError && selectedSectionIndexes == null) {
      resetCharacterQuery();
    }
  }, [state.referenceValue, selectedSectionIndexes, inputError]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    // Select the right section when focused on mount (`autoFocus = true` on the input)
    if (containerRef.current && containerRef.current.contains(getActiveElement(document))) {
      setSelectedSections('all');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If `tempValueStr` is still defined for some section when running `useEffect`,
  // Then `onChange` has only been called once, which means the user pressed `Backspace` to reset the section.
  // This causes a small flickering on Android,
  // But we can't use `useEnhancedEffect` which is always called before the second `onChange` call and then would cause false positives.
  React.useEffect(() => {
    const sectionWithTempValueStr = state.sections.findIndex(
      (section) => section.tempValueStr != null,
    );
    if (sectionWithTempValueStr > -1 && selectedSectionIndexes != null) {
      resetCharacterQuery();
      clearActiveSection();
    }
  }, [state.sections]); // eslint-disable-line react-hooks/exhaustive-deps

  const areAllSectionsEmpty = valueManager.areValuesEqual(
    utils,
    state.value,
    valueManager.emptyValue,
  );
  const shouldShowPlaceholder = !isFocusInsideContainer(containerRef) && areAllSectionsEmpty;

  React.useImperativeHandle(unstableFieldRef, () => ({
    getSections: () => state.sections,
    getActiveSectionIndex: () => getActiveSectionIndexFromDOM(containerRef),
    setSelectedSections: (activeSectionIndex) => setSelectedSections(activeSectionIndex),
  }));

  const handleClearValue = useEventCallback((event: React.MouseEvent, ...args) => {
    event.preventDefault();
    onClear?.(event, ...(args as []));
    clearValue();
    setSelectedSections(0);
  });

  const textFieldElements = React.useMemo<FakeTextFieldElement[]>(
    () =>
      state.sections.map((section, sectionIndex) => ({
        container: {
          'data-sectionindex': sectionIndex,
          style: { margin: 0, display: 'flex', flexDirection: 'row', height: 16 },
        } as React.HTMLAttributes<HTMLDivElement>,
        input: {
          value: shouldShowPlaceholder ? '' : section.value || section.placeholder,
          placeholder: section.placeholder,
          onChange: handleInputChange,
          onClick: handleInputClick,
          onFocus: handleInputFocus,
          onKeyDown: handleInputKeyDown,
          onMouseUp: handleInputMouseUp,
          inputMode: section.contentType === 'letter' ? 'text' : 'numeric',
          autoComplete: 'off',
          disabled,
          readOnly,
          style: {
            width: `calc(8px + ${(section.value || section.placeholder).length}ch)`,
            padding: 0,
            border: 0,
            height: 16,
            lineHeight: 16,
            outline: 'none',
          },
        },
        before: {
          className: 'before',
          children: section.startSeparator,
          style: { height: 16, fontSize: 12, whiteSpace: 'pre' },
        },
        after: {
          className: 'after',
          children: section.endSeparator,
          style: { height: 16, fontSize: 12, whiteSpace: 'pre' },
        },
      })),
    [
      state.sections,
      shouldShowPlaceholder,
      handleInputFocus,
      handleInputKeyDown,
      handleInputChange,
      handleInputClick,
      handleInputMouseUp,
      disabled,
      readOnly,
    ],
  );

  const handleValueStrChange = useEventCallback((event: React.ChangeEvent<HTMLInputElement>) =>
    updateValueFromValueStr(event.target.value),
  );

  const valueStr = React.useMemo(
    () => fieldValueManager.getHiddenInputValueFromSections(state.sections),
    [state.sections, fieldValueManager],
  );

  return {
    disabled,
    ...otherForwardedProps,
    elements: textFieldElements,
    readOnly,
    valueStr,
    onValueStrChange: handleValueStrChange,
    onBlur: handleContainerBlur,
    onPaste: handleContainerPaste,
    onClear: handleClearValue,
    error: inputError,
    ref: handleRef,
    clearable: Boolean(clearable && !areAllSectionsEmpty && !readOnly && !disabled),
  };
};
