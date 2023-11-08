import * as React from 'react';
import useForkRef from '@mui/utils/useForkRef';
import useEventCallback from '@mui/utils/useEventCallback';
import { getSectionIndexFromDOMElement, isFocusInsideContainer } from './useField.utils';
import {
  UseFieldForwardedProps,
  UseFieldInternalProps,
  UseFieldTextFieldInteractions,
  UseFieldTextFieldParams,
} from './useField.types';
import { FakeTextFieldElement } from '../../components/FakeTextField/FakeTextField';
import { FieldSection } from '../../../models';
import { getActiveElement } from '../../utils/utils';

const noop = () => {};

export const useFieldV7TextField = <
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
>(
  params: UseFieldTextFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
) => {
  const {
    internalProps: { readOnly, disabled, autoFocus },
    forwardedProps: { ref: inContainerRef, onPaste, onBlur, onFocus = noop, onClick = noop },
    fieldValueManager,
    applyCharacterEditing,
    resetCharacterQuery,
    setSelectedSections,
    parsedSelectedSections,
    state,
    clearActiveSection,
    clearValue,
    updateSectionValue,
    updateValueFromValueStr,
    areAllSectionsEmpty,
    sectionOrder,
  } = params;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = useForkRef(inContainerRef, containerRef);

  const isFocused = !isFocusInsideContainer(containerRef);

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

        const range = new window.Range();

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
      focusField: () => containerRef.current?.focus(),
    }),
    [containerRef, parsedSelectedSections],
  );

  /**
   * If a section content has been updated with a value we don't want to keep,
   * Then we need to imperatively revert it (we can't let React do it because the value did not change in his internal representation).
   */
  const revertDOMSectionChange = useEventCallback((sectionIndex: number) => {
    if (!containerRef.current) {
      return;
    }

    const section = state.sections[sectionIndex];

    containerRef.current.querySelector(
      `span[data-sectionindex="${sectionIndex}"] .content`,
    )!.innerHTML = section.value || section.placeholder;
    interactions.syncSelectionToDOM();
  });

  const handleContainerClick = useEventCallback((event: React.MouseEvent, ...args) => {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call of `handleContainerClick` is actually intended, or a side effect.
    if (event.isDefaultPrevented() || !containerRef.current) {
      return;
    }

    onClick?.(event, ...(args as []));

    if (parsedSelectedSections === 'all') {
      window.setTimeout(() => {
        const cursorPosition = document.getSelection()!.getRangeAt(0).startOffset;

        if (cursorPosition === 0) {
          setSelectedSections(0);
          return;
        }

        let sectionIndex = 0;
        let cursorOnStartOfSection = 0;

        while (cursorOnStartOfSection < cursorPosition && sectionIndex < state.sections.length) {
          const section = state.sections[sectionIndex];
          sectionIndex += 1;
          cursorOnStartOfSection += `${section.startSeparator}${
            section.value || section.placeholder
          }${section.endSeparator}`.length;
        }

        setSelectedSections(sectionIndex - 1);
      });
    } else {
      const hasClickedOnASection = containerRef.current
        .querySelector('.fake-text-field-input-content')!
        .contains(event.target as Node);
      if (!hasClickedOnASection) {
        setSelectedSections(sectionOrder.startIndex);
      }
    }
  });

  const handleContainerInput = useEventCallback((event: React.FormEvent<HTMLDivElement>) => {
    if (!containerRef.current || parsedSelectedSections !== 'all') {
      return;
    }

    const target = event.target as HTMLSpanElement;
    const keyPressed = target.innerText;

    containerRef.current.innerHTML = state.sections
      .map(
        (section) =>
          `${section.startSeparator}${section.value || section.placeholder}${section.endSeparator}`,
      )
      .join('');
    interactions.syncSelectionToDOM();

    if (keyPressed.length === 0 || keyPressed.charCodeAt(0) === 10) {
      resetCharacterQuery();
      clearValue();
      setSelectedSections('all');
    } else {
      applyCharacterEditing({
        keyPressed,
        sectionIndex: 0,
      });
    }
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

  const handleContainerBlur = useEventCallback((...args) => {
    onBlur?.(...(args as []));

    window.setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(getActiveElement(document))) {
        setSelectedSections(null);
      }
    });
  });

  const getInputContainerClickHandler = useEventCallback(
    (sectionIndex: number) => (event: React.MouseEvent<HTMLDivElement>) => {
      // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
      // We avoid this by checking if the call to this function is actually intended, or a side effect.
      if (event.isDefaultPrevented() || readOnly) {
        return;
      }

      setSelectedSections(sectionIndex);
    },
  );

  const handleInputContentMouseUp = useEventCallback((event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  });

  const getInputContentFocusHandler = useEventCallback((sectionIndex: number) => () => {
    if (readOnly) {
      return;
    }

    setSelectedSections(sectionIndex);
  });

  const handleInputContentPaste = useEventCallback(
    (event: React.ClipboardEvent<HTMLSpanElement>) => {
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
    },
  );

  const handleInputContentDragOver = useEventCallback((event: React.DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  });

  const handleInputContentInput = useEventCallback((event: React.FormEvent<HTMLSpanElement>) => {
    const target = event.target as HTMLSpanElement;
    const keyPressed = target.innerText;
    const sectionIndex = getSectionIndexFromDOMElement(target)!;
    const section = state.sections[sectionIndex];

    if (readOnly || !containerRef.current) {
      revertDOMSectionChange(sectionIndex);
      return;
    }

    if (keyPressed.length === 0) {
      if (section.value === '') {
        revertDOMSectionChange(sectionIndex);
        return;
      }

      resetCharacterQuery();
      clearActiveSection();
      return;
    }

    applyCharacterEditing({
      keyPressed,
      sectionIndex,
    });

    // The DOM value needs to remain the one React is expecting.
    revertDOMSectionChange(sectionIndex);
  });

  const elements = React.useMemo<FakeTextFieldElement[]>(() => {
    const orderedSections: { section: TSection; index: number }[] = [];
    let sectionIndex: number | null = sectionOrder.startIndex;
    while (sectionIndex != null) {
      orderedSections.push({ section: state.sections[sectionIndex], index: sectionIndex });
      sectionIndex = sectionOrder.neighbors[sectionIndex].rightIndex;
    }

    return orderedSections.map(({ section, index }) => {
      return {
        container: {
          'data-sectionindex': index,
          onClick: getInputContainerClickHandler(index),
        } as React.HTMLAttributes<HTMLSpanElement>,
        content: {
          tabIndex: parsedSelectedSections === 'all' ? undefined : 0,
          className: 'content',
          contentEditable: parsedSelectedSections === index && !disabled && !readOnly,
          suppressContentEditableWarning: true,
          role: 'textbox',
          children: section.value || section.placeholder,
          onInput: handleInputContentInput,
          onPaste: handleInputContentPaste,
          onFocus: getInputContentFocusHandler(index),
          onDragOver: handleInputContentDragOver,
          onMouseUp: handleInputContentMouseUp,
          inputMode: section.contentType === 'letter' ? 'text' : 'numeric',
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
      };
    });
  }, [
    state.sections,
    getInputContentFocusHandler,
    handleInputContentPaste,
    handleInputContentDragOver,
    handleInputContentInput,
    getInputContainerClickHandler,
    handleInputContentMouseUp,
    disabled,
    readOnly,
    parsedSelectedSections,
    sectionOrder,
  ]);

  const handleValueStrChange = useEventCallback((event: React.ChangeEvent<HTMLInputElement>) =>
    updateValueFromValueStr(event.target.value),
  );

  const valueStr = React.useMemo(
    () => fieldValueManager.getV7HiddenInputValueFromSections(state.sections),
    [state.sections, fieldValueManager],
  );

  React.useEffect(() => {
    if (autoFocus && containerRef.current) {
      setSelectedSections('all');
      containerRef.current.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    interactions,
    returnedValue: {
      textField: 'v7' as const,
      onFocus,
      onClick: handleContainerClick,
      onInput: handleContainerInput,
      onPaste: handleContainerPaste,
      onBlur: handleContainerBlur,
      contentEditable: parsedSelectedSections === 'all',
      suppressContentEditableWarning: true,
      elements,
      ref: handleRef,
      valueStr,
      onValueStrChange: handleValueStrChange,
      valueType: isFocused && areAllSectionsEmpty ? 'placeholder' : 'value',
    },
  };
};
