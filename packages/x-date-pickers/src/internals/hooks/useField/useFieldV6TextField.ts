import * as React from 'react';
import {
  UseFieldForwardedProps,
  UseFieldInternalProps,
  UseFieldParams,
  UseFieldTextFieldInteractions,
} from './useField.types';
import { UseFieldStateResponse } from './useFieldState';
import { UseFieldCharacterEditingResponse } from './useFieldCharacterEditing';
import { FieldSection } from '../../../models';
import { getActiveElement } from '../../utils/utils';

interface UseFieldV6TextFieldParams<
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
> extends UseFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
    UseFieldStateResponse<TValue, TDate, TSection>,
    UseFieldCharacterEditingResponse {
  inputRef: React.RefObject<HTMLInputElement>;
}

export const useFieldV6TextField = <
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
>(
  params: UseFieldV6TextFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
) => {
  const { parsedSelectedSections, state, inputRef } = params;

  const interactions = React.useMemo<UseFieldTextFieldInteractions>(
    () => ({
      syncSelectionToDOM: () => {
        if (!inputRef.current) {
          return;
        }

        if (parsedSelectedSections == null) {
          if (inputRef.current.scrollLeft) {
            // Ensure that input content is not marked as selected.
            // setting selection range to 0 causes issues in Safari.
            // https://bugs.webkit.org/show_bug.cgi?id=224425
            inputRef.current.scrollLeft = 0;
          }
          return;
        }

        // On multi input range pickers we want to update selection range only for the active input
        // This helps to avoid the focus jumping on Safari https://github.com/mui/mui-x/issues/9003
        // because WebKit implements the `setSelectionRange` based on the spec: https://bugs.webkit.org/show_bug.cgi?id=224425
        if (inputRef.current !== getActiveElement(document)) {
          return;
        }

        // Fix scroll jumping on iOS browser: https://github.com/mui/mui-x/issues/8321
        const currentScrollTop = inputRef.current.scrollTop;

        if (parsedSelectedSections === 'all') {
          inputRef.current.select();
        } else {
          const selectedSection = state.sections[parsedSelectedSections];

          if (
            selectedSection.startInInput !== inputRef.current.selectionStart ||
            selectedSection.endInInput !== inputRef.current.selectionEnd
          ) {
            if (inputRef.current === getActiveElement(document)) {
              inputRef.current.setSelectionRange(
                selectedSection.startInInput,
                selectedSection.endInInput,
              );
            }
          }
        }

        // Even reading this variable seems to do the trick, but also setting it just to make use of it
        inputRef.current.scrollTop = currentScrollTop;
      },
      getActiveSectionIndexFromDOM: () => {
        const browserStartIndex = inputRef.current!.selectionStart ?? 0;
        const browserEndIndex = inputRef.current!.selectionEnd ?? 0;
        if (browserStartIndex === 0 && browserEndIndex === 0) {
          return null;
        }

        const nextSectionIndex =
          browserStartIndex <= state.sections[0].startInInput
            ? 1 // Special case if browser index is in invisible characters at the beginning.
            : state.sections.findIndex(
                (section) =>
                  section.startInInput - section.startSeparator.length > browserStartIndex,
              );
        return nextSectionIndex === -1 ? state.sections.length - 1 : nextSectionIndex - 1;
      },
    }),
    [inputRef, parsedSelectedSections, state.sections],
  );

  return { interactions };
};
