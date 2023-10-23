import * as React from 'react';
import { createRenderer, screen, userEvent, act, fireEvent } from '@mui-internal/test-utils';
import { FieldRef, FieldSection, FieldSectionType } from '@mui/x-date-pickers/models';
import { expectFieldValue } from './assertions';

interface BuildFieldInteractionsParams<P extends {}> {
  // TODO: Export `Clock` from monorepo
  clock: ReturnType<typeof createRenderer>['clock'];
  render: ReturnType<typeof createRenderer>['render'];
  Component: React.FunctionComponent<P>;
}

export type FieldSectionSelector = (
  selectedSection: FieldSectionType | undefined,
  index?: 'first' | 'last',
) => { sectionContent: HTMLSpanElement };

export interface BuildFieldInteractionsResponse<P extends {}> {
  renderWithProps: (
    props: P,
    hook?: (props: P) => Record<string, any>,
    componentFamily?: 'picker' | 'field',
  ) => ReturnType<ReturnType<typeof createRenderer>['render']> & {
    selectSection: FieldSectionSelector;
    fieldContainer: HTMLDivElement;
  };
  clickOnField: (container: HTMLDivElement, sectionIndex: number) => void;
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
    },
  ) => void;
}

export const buildFieldInteractions = <P extends {}>({
  clock,
  render,
  Component,
}: BuildFieldInteractionsParams<P>): BuildFieldInteractionsResponse<P> => {
  const clickOnField: BuildFieldInteractionsResponse<P>['clickOnField'] = (
    container,
    sectionIndex,
  ) => {
    const inputToClick = container.querySelector<HTMLInputElement>(
      `data[data-sectionindex="${sectionIndex}"] input`,
    )!;

    act(() => {
      fireEvent.mouseDown(inputToClick);
      fireEvent.mouseUp(inputToClick);
      fireEvent.click(inputToClick);

      clock.runToLast();
    });
  };

  const renderWithProps: BuildFieldInteractionsResponse<P>['renderWithProps'] = (
    props,
    hook,
    componentFamily = 'field',
  ) => {
    let fieldRef: React.RefObject<FieldRef<FieldSection>> = { current: null };
    let fieldContainerRef: React.RefObject<HTMLDivElement> = { current: null };

    function WrappedComponent() {
      fieldRef = React.useRef<FieldRef<FieldSection>>(null);
      fieldContainerRef = React.useRef<HTMLDivElement>(null);
      const hookResult = hook?.(props);

      const allProps = {
        ...props,
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

    const result = render(<WrappedComponent />);

    const getSectionIndex = (
      selectedSection: FieldSectionType | undefined,
      index: 'first' | 'last',
    ) => {
      let sectionIndex: number;
      if (selectedSection) {
        const sections = fieldRef.current!.getSections();
        const cleanSections = index === 'first' ? sections : [...sections].reverse();
        sectionIndex = cleanSections.findIndex((section) => section.type === selectedSection);
        if (sectionIndex === -1) {
          throw new Error(`No section of type ${selectedSection}`);
        }

        return sectionIndex;
      }

      return 0;
    };

    const selectSection: FieldSectionSelector = (selectedSection, index = 'first') => {
      const sectionIndex = getSectionIndex(selectedSection, index);
      const sectionContent = fieldContainerRef.current!.querySelector<HTMLSpanElement>(
        `span[data-sectionindex="${sectionIndex}"] .content`,
      )!;

      if (document.activeElement !== fieldContainerRef.current) {
        // focus input to trigger setting placeholder as value if no value is present
        act(() => {
          sectionContent.focus();
        });
        // make sure the value of the input is rendered before proceeding
        clock.runToLast();
      }

      return { sectionContent };
    };

    return {
      selectSection,
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
    const { selectSection, fieldContainer } = renderWithProps(props as any as P);
    const { sectionContent } = selectSection(selectedSection);
    userEvent.keyPress(sectionContent, { key });
    expectFieldValue(fieldContainer, expectedValue);
  };

  const testFieldChange: BuildFieldInteractionsResponse<P>['testFieldChange'] = ({
    keyStrokes,
    selectedSection,
    ...props
  }) => {
    const { selectSection, fieldContainer } = renderWithProps(props as any as P);
    const { sectionContent } = selectSection(selectedSection);

    keyStrokes.forEach((keyStroke) => {
      fireEvent.input(sectionContent, { target: { innerText: keyStroke.value } });
      expectFieldValue(
        fieldContainer,
        keyStroke.expected,
        (props as any).shouldRespectLeadingZeros ? 'singleDigit' : undefined,
      );
    });
  };

  return { clickOnField, testFieldKeyPress, testFieldChange, renderWithProps };
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

export const getCleanedSelectedContent = (input: HTMLInputElement) =>
  cleanText(input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0));

export const getTextbox = (): HTMLInputElement => screen.getByRole('textbox');
