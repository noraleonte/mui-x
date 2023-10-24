import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { getSectionIndexFromDOMElement, isAndroid, isFocusInsideContainer } from './useField.utils';
import {
  UseFieldForwardedProps,
  UseFieldInternalProps,
  UseFieldParams,
  UseFieldTextFieldInteractions,
} from './useField.types';
import { UseFieldStateResponse } from './useFieldState';
import { UseFieldCharacterEditingResponse } from './useFieldCharacterEditing';
import { FakeTextFieldElement } from '../../components/FakeTextField/FakeTextField';
import { FieldSection } from '../../../models';
import { getActiveElement } from '@mui/x-date-pickers/internals';

interface UseFieldV7TextFieldParams<
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
> extends UseFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
    UseFieldStateResponse<TValue, TDate, TSection>,
    UseFieldCharacterEditingResponse {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useFieldV7TextField = <
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
>(
  params: UseFieldV7TextFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
) => {
  const {
    internalProps: { readOnly, disabled },
    fieldValueManager,
    applyCharacterEditing,
    resetCharacterQuery,
    setSelectedSections,
    parsedSelectedSections,
    state,
    clearActiveSection,
    setSectionTempValueStr,
    updateSectionValue,
    updateValueFromValueStr,
    containerRef,
  } = params;

  const getContainerClickHandler = useEventCallback(
    (sectionIndex: number) => (event: React.MouseEvent<HTMLDivElement>) => {
      // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
      // We avoid this by checking if the call to this function is actually intended, or a side effect.
      if (event.isDefaultPrevented() || readOnly) {
        return;
      }

      setSelectedSections(sectionIndex);
    },
  );

  const handleContentMouseUp = useEventCallback((event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  });

  const getContentFocusHandler = useEventCallback((sectionIndex: number) => () => {
    if (readOnly) {
      return;
    }

    setSelectedSections(sectionIndex);
  });

  const handleContentPaste = useEventCallback((event: React.ClipboardEvent<HTMLSpanElement>) => {
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

  const handleContentDragOver = useEventCallback((event: React.DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  });

  const handleContentInput = useEventCallback((event: React.FormEvent<HTMLSpanElement>) => {
    if (readOnly || !containerRef.current) {
      return;
    }

    const target = event.target as HTMLSpanElement;
    const keyPressed = target.innerText;
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
      const section = state.sections[sectionIndex];
      containerRef.current.querySelector(
        `span[data-sectionindex="${sectionIndex}"] .content`,
      )!.innerHTML = section.value || section.placeholder;
    }
  });

  const elements = React.useMemo<FakeTextFieldElement[]>(
    () =>
      state.sections.map((section, sectionIndex) => ({
        container: {
          'data-sectionindex': sectionIndex,
          onClick: getContainerClickHandler(sectionIndex),
        } as React.HTMLAttributes<HTMLSpanElement>,
        content: {
          className: 'content',
          contentEditable: !disabled && !readOnly,
          role: 'textbox',
          children: section.value || section.placeholder,
          onInput: handleContentInput,
          onPaste: handleContentPaste,
          onFocus: getContentFocusHandler(sectionIndex),
          onDragOver: handleContentDragOver,
          onMouseUp: handleContentMouseUp,
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
      getContentFocusHandler,
      handleContentPaste,
      handleContentDragOver,
      handleContentInput,
      getContainerClickHandler,
      handleContentMouseUp,
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

  const interactions = React.useMemo<UseFieldTextFieldInteractions>(
    () => ({
      syncSelectionToDOM: () => {
        if (!containerRef.current) {
          return;
        }

        if (parsedSelectedSections == null) {
          if (isFocusInsideContainer(containerRef)) {
            containerRef.current.blur();
          }
          return;
        }

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
      },
      getActiveSectionIndexFromDOM: () => {
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
    }),
    [containerRef, parsedSelectedSections],
  );

  return {
    interactions,
    returnedValue: { elements, valueStr, onValueStrChange: handleValueStrChange, interactions },
  };
};
