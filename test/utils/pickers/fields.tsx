import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen, userEvent, act, fireEvent } from '@mui-internal/test-utils';
import { FieldRef, FieldSection, FieldSectionType } from '@mui/x-date-pickers/models';
import { expectFieldValue, expectFieldValueV6 } from './assertions';

export const getTextbox = (): HTMLInputElement => screen.getByRole('textbox');

interface BuildFieldInteractionsParams<P extends {}> {
  // TODO: Export `Clock` from monorepo
  clock: ReturnType<typeof createRenderer>['clock'];
  render: ReturnType<typeof createRenderer>['render'];
  Component: React.FunctionComponent<P>;
}

export type FieldSectionSelector = (
  selectedSection: FieldSectionType | undefined,
  index?: 'first' | 'last',
) => void;

export interface BuildFieldInteractionsResponse<P extends { shouldUseV6TextField?: boolean }> {
  renderWithProps: (
    props: P,
    hook?: (props: P) => Record<string, any>,
    componentFamily?: 'picker' | 'field',
  ) => ReturnType<ReturnType<typeof createRenderer>['render']> & {
    selectSection: FieldSectionSelector;
    fieldContainer: HTMLDivElement;
    /**
     * Returns the contentEditable DOM node of the requested section.
     * @param {number} sectionIndex The index of the requested section.
     * @returns {HTMLSpanElement} The contentEditable DOM node of the requested section.
     */
    getSection: (sectionIndex: number) => HTMLSpanElement;
    /**
     * Returns the contentEditable DOM node of the active section.
     * @param {number | undefined} sectionIndex If defined, asserts that the active section is the expected one.
     * @returns {HTMLSpanElement} The contentEditable DOM node of the active section.
     */
    getActiveSection: (sectionIndex: number | undefined) => HTMLSpanElement;
    getHiddenInput: () => HTMLInputElement;
  };
  testFieldKeyPress: (
    params: P & {
      key: string;
      expectedValue: string;
      selectedSection?: FieldSectionType;
    },
  ) => void;
  testFieldChange: (
    params: P & {
      keyStrokes: { value: string; expected: string }[];
      selectedSection?: FieldSectionType;
      skipV7?: boolean;
    },
  ) => void;
}

export const buildFieldInteractions = <P extends { shouldUseV6TextField?: boolean }>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clock,
  render,
  Component,
}: BuildFieldInteractionsParams<P>): BuildFieldInteractionsResponse<P> => {
  const renderWithProps: BuildFieldInteractionsResponse<P>['renderWithProps'] = (
    props,
    hook,
    componentFamily = 'field',
  ) => {
    let fieldRef: React.RefObject<FieldRef<FieldSection>> = { current: null };
    let fieldContainerRef: React.RefObject<HTMLDivElement> = { current: null };

    function WrappedComponent(propsFromRender: any) {
      fieldRef = React.useRef<FieldRef<FieldSection>>(null);
      fieldContainerRef = React.useRef<HTMLDivElement>(null);
      const hookResult = hook?.(propsFromRender);

      const allProps = {
        ...propsFromRender,
        ...hookResult,
      } as any;

      if (componentFamily === 'field') {
        allProps.unstableFieldRef = fieldRef;
        allProps.ref = fieldContainerRef;
      } else {
        if (!allProps.slotProps) {
          allProps.slotProps = {};
        }

        if (!allProps.slotProps.field) {
          allProps.slotProps.field = {};
        }

        const hasMultipleInputs =
          // @ts-ignore
          Component.render.name.includes('Range') &&
          allProps.slots?.field?.fieldType !== 'single-input';
        if (hasMultipleInputs) {
          allProps.slotProps.field.unstableStartFieldRef = fieldRef;
        } else {
          allProps.slotProps.field.unstableFieldRef = fieldRef;
        }

        allProps.slotProps.field.ref = fieldContainerRef;
      }

      return <Component {...(allProps as P)} />;
    }

    const result = render(<WrappedComponent {...(props as any)} />);

    const getSection = (sectionIndex: number) =>
      fieldContainerRef.current!.querySelector<HTMLSpanElement>(
        `span[data-sectionindex="${sectionIndex}"] .content`,
      )!;

    const selectSection: FieldSectionSelector = (selectedSection, index = 'first') => {
      let sectionIndexToSelect: number;
      if (selectedSection === undefined) {
        sectionIndexToSelect = 0;
      } else {
        const sections = fieldRef.current!.getSections();
        sectionIndexToSelect = sections[index === 'first' ? 'findIndex' : 'findLastIndex'](
          (section) => section.type === selectedSection,
        );
      }

      act(() => {
        fieldRef.current!.setSelectedSections(sectionIndexToSelect);

        if (props.shouldUseV6TextField) {
          getTextbox().focus();
        }
      });

      act(() => {
        if (!props.shouldUseV6TextField) {
          getSection(sectionIndexToSelect).focus();
        }
      });
    };

    const getActiveSection = (sectionIndex: number | undefined) => {
      const activeElement = document.activeElement! as HTMLSpanElement;

      if (sectionIndex !== undefined) {
        expect(activeElement.parentElement!.dataset.sectionindex).to.equal(sectionIndex.toString());
      }

      return activeElement;
    };

    return {
      selectSection,
      getActiveSection,
      getSection,
      getHiddenInput: () => fieldContainerRef.current!.querySelector<HTMLInputElement>('input')!,
      fieldContainer: fieldContainerRef.current!,
      ...result,
    };
  };

  const testFieldKeyPress: BuildFieldInteractionsResponse<P>['testFieldKeyPress'] = ({
    key,
    expectedValue,
    selectedSection,
    ...props
  }) => {
    // Test with v7 input
    const v7Response = renderWithProps(props as any as P);
    v7Response.selectSection(selectedSection);
    userEvent.keyPress(v7Response.getActiveSection(undefined), { key });
    expectFieldValue(v7Response.fieldContainer, expectedValue);
    v7Response.unmount();

    // Test with v6 input
    const v6Response = renderWithProps({ ...props, shouldUseV6TextField: true } as any as P);
    v6Response.selectSection(selectedSection);
    const input = getTextbox();
    userEvent.keyPress(input, { key });
    expectFieldValueV6(input, expectedValue);
    v6Response.unmount();
  };

  const testFieldChange: BuildFieldInteractionsResponse<P>['testFieldChange'] = ({
    keyStrokes,
    selectedSection,
    skipV7,
    ...props
  }) => {
    if (!skipV7) {
      // Test with v7 input
      const v7Response = renderWithProps(props as any as P);
      v7Response.selectSection(selectedSection);
      keyStrokes.forEach((keyStroke) => {
        fireEvent.input(v7Response.getActiveSection(undefined), {
          target: { innerText: keyStroke.value },
        });
        expectFieldValue(
          v7Response.fieldContainer,
          keyStroke.expected,
          (props as any).shouldRespectLeadingZeros ? 'singleDigit' : undefined,
        );
      });
      v7Response.unmount();
    }

    // Test with v6 input
    const v6Response = renderWithProps({ ...props, shouldUseV6TextField: true } as any as P);
    v6Response.selectSection(selectedSection);
    const input = getTextbox();

    keyStrokes.forEach((keyStroke) => {
      fireEvent.change(input, { target: { value: keyStroke.value } });
      expectFieldValueV6(
        input,
        keyStroke.expected,
        (props as any).shouldRespectLeadingZeros ? 'singleDigit' : undefined,
      );
    });
    v6Response.unmount();
  };

  return { testFieldKeyPress, testFieldChange, renderWithProps };
};

export const cleanText = (text: string, specialCase?: 'singleDigit' | 'RTL') => {
  const clean = text.replace(/\u202f/g, ' ');
  switch (specialCase) {
    case 'singleDigit':
      return clean.replace(/\u200e/g, '');
    case 'RTL':
      return clean.replace(/\u2066|\u2067|\u2068|\u2069/g, '');
    default:
      return clean;
  }
};

export const getCleanedSelectedContent = () => cleanText(document.getSelection()?.toString() ?? '');
