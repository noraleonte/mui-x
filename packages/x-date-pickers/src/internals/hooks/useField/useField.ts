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
    activeSectionIndex,
    parsedSelectedSections,
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

  const getElementContainerClickHandler = useEventCallback(
    (sectionIndex: number) => (event: React.MouseEvent<HTMLDivElement>) => {
      // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
      // We avoid this by checking if the call to this function is actually intended, or a side effect.
      if (event.isDefaultPrevented() || readOnly) {
        return;
      }

      setSelectedSections(sectionIndex);
    },
  );

  const handleInputMouseUp = useEventCallback((event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  });

  const getInputFocusHandler = useEventCallback((sectionIndex: number) => () => {
    if (readOnly) {
      return;
    }

    setSelectedSections(sectionIndex);
  });

  const handleContainerBlur = useEventCallback((...args) => {
    onBlur?.(...(args as []));
    setSelectedSections(null);
  });

  const handleContainerPaste = useEventCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    onPaste?.(event);
    if (readOnly || parsedSelectedSections !== 'all') {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    event.preventDefault();
    resetCharacterQuery();
    updateValueFromValueStr(pastedValue);
  });

  const handleInputPaste = useEventCallback((event: React.ClipboardEvent<HTMLSpanElement>) => {
    if (readOnly || typeof parsedSelectedSections !== 'number') {
      event.preventDefault();
      return;
    }

    const activeSection = state.sections[parsedSelectedSections];
    const pastedValue = event.clipboardData.getData('text');
    const lettersOnly = /^[a-zA-Z]+$/.test(pastedValue);
    const digitsOnly = /^[0-9]+$/.test(pastedValue);
    const digitsAndLetterOnly = /^(([a-zA-Z]+)|)([0-9]+)(([a-zA-Z]+)|)$/.test(pastedValue);
    const isValidPastedValue =
      (activeSection.contentType === 'letter' && lettersOnly) ||
      (activeSection.contentType === 'digit' && digitsOnly) ||
      (activeSection.contentType === 'digit-with-letter' && digitsAndLetterOnly);
    if (isValidPastedValue) {
      updateSectionValue({
        activeSection,
        newSectionValue: pastedValue,
        shouldGoToNextSection: true,
      });
    }
    if (lettersOnly || digitsOnly) {
      // The pasted value correspond to a single section but not the expected type
      // skip the modification
      event.preventDefault();
    }
  });

  const handleInputDragOver = useEventCallback((event: React.DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  });

  const handleInputChange = useEventCallback((event: React.FormEvent<HTMLSpanElement>) => {
    if (readOnly || !containerRef.current) {
      return;
    }

    const target = event.target as HTMLSpanElement;

    const keyPressed = target.innerHTML;
    if (keyPressed === '') {
      resetCharacterQuery();
      clearValue();
      return;
    }

    const sectionIndex = getSectionIndexFromDOMElement(target)!;

    if (keyPressed.length === 0) {
      if (isAndroid()) {
        setSectionTempValueStr(sectionIndex, keyPressed);
      } else {
        resetCharacterQuery();
        clearActiveSection();
      }
      return;
    }

    const isValid = applyCharacterEditing({
      keyPressed,
      sectionIndex,
    });

    // Without this, the span will contain the newly typed character.
    if (!isValid) {
      containerRef.current.querySelector(
        `span[data-sectionindex="${sectionIndex}"] .content`,
      )!.innerHTML = state.sections[sectionIndex].value || state.sections[sectionIndex].placeholder;
    }
  });

  const handleContainerKeyDown = useEventCallback((event: React.KeyboardEvent<HTMLSpanElement>) => {
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

        if (parsedSelectedSections == null) {
          setSelectedSections(sectionOrder.startIndex);
        } else if (parsedSelectedSections === 'all') {
          setSelectedSections(state.sections.length - 1);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[parsedSelectedSections].rightIndex;
          if (nextSectionIndex !== null) {
            setSelectedSections(nextSectionIndex);
          }
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (parsedSelectedSections == null) {
          setSelectedSections(sectionOrder.endIndex);
        } else if (parsedSelectedSections === 'all') {
          setSelectedSections(0);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[parsedSelectedSections].leftIndex;
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

        if (parsedSelectedSections == null || parsedSelectedSections === 'all') {
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

        if (readOnly || activeSectionIndex == null) {
          break;
        }

        const activeSection = state.sections[activeSectionIndex];
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
    if (parsedSelectedSections == null) {
      if (isFocusInsideContainer(containerRef)) {
        containerRef.current.blur();
      }
      return;
    }

    // Focus several sections
    const selection = document.getSelection();
    if (!selection) {
      return;
    }

    const range = new Range();
    if (parsedSelectedSections === 'all') {
      range.selectNodeContents(containerRef.current);
    } else {
      range.selectNodeContents(
        containerRef.current.querySelector(
          `span[data-sectionindex="${parsedSelectedSections}"] .content`,
        )!,
      );
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
    if (!inputError && activeSectionIndex == null) {
      resetCharacterQuery();
    }
  }, [state.referenceValue, activeSectionIndex, inputError]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (sectionWithTempValueStr > -1 && activeSectionIndex != null) {
      resetCharacterQuery();
      clearActiveSection();
    }
  }, [state.sections]); // eslint-disable-line react-hooks/exhaustive-deps

  const areAllSectionsEmpty = valueManager.areValuesEqual(
    utils,
    state.value,
    valueManager.emptyValue,
  );

  React.useImperativeHandle(unstableFieldRef, () => ({
    getSections: () => state.sections,
    getActiveSectionIndex: () => {
      const activeElement = getActiveElement(document) as HTMLElement | undefined;
      if (
        !activeElement ||
        !containerRef.current ||
        !containerRef.current.contains(activeElement)
      ) {
        return null;
      }

      return getSectionIndexFromDOMElement(
        getActiveElement(document) as HTMLSpanElement | undefined,
      );
    },
    setSelectedSections: (newActiveSectionIndex) => setSelectedSections(newActiveSectionIndex),
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
          onClick: getElementContainerClickHandler(sectionIndex),
        } as React.HTMLAttributes<HTMLSpanElement>,
        content: {
          className: 'content',
          contentEditable: !disabled && !readOnly && parsedSelectedSections !== 'all',
          role: 'textbox',
          children: section.value || section.placeholder,
          onInput: handleInputChange,
          onPaste: handleInputPaste,
          onFocus: getInputFocusHandler(sectionIndex),
          onDragOver: handleInputDragOver,
          onMouseUp: handleInputMouseUp,
          inputMode: section.contentType === 'letter' ? 'text' : 'numeric',
          suppressContentEditableWarning: true,
          style: {
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
      parsedSelectedSections,
      getInputFocusHandler,
      handleInputPaste,
      handleInputDragOver,
      handleInputChange,
      getElementContainerClickHandler,
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
    valueType:
      !isFocusInsideContainer(containerRef) && areAllSectionsEmpty ? 'placeholder' : 'value',
    valueStr,
    onValueStrChange: handleValueStrChange,
    contentEditable: !disabled && !readOnly && parsedSelectedSections === 'all',
    suppressContentEditableWarning: true,
    onKeyDown: handleContainerKeyDown,
    onBlur: handleContainerBlur,
    onPaste: handleContainerPaste,
    onClear: handleClearValue,
    error: inputError,
    ref: handleRef,
    clearable: Boolean(clearable && !areAllSectionsEmpty && !readOnly && !disabled),
  };
};
