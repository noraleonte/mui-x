import * as React from 'react';
import useControlled from '@mui/utils/useControlled';
import { useTheme } from '@mui/material/styles';
import { useUtils, useLocaleText, useLocalizationContext } from '../useUtils';
import {
  UseFieldForwardedProps,
  UseFieldInternalProps,
  UseFieldParams,
  UseFieldState,
  FieldChangeHandlerContext,
} from './useField.types';
import {
  splitFormatIntoSections,
  mergeDateIntoReferenceDate,
  getSectionsBoundaries,
  validateSections,
  getDateFromDateSections,
  resetSectionsTempValueStr,
} from './useField.utils';
import { InferError } from '../useValidation';
import { FieldSection, FieldSelectedSection } from '../../../models';
import { useValueWithTimezone } from '../useValueWithTimezone';
import {
  GetDefaultReferenceDateProps,
  getSectionTypeGranularity,
} from '../../utils/getDefaultReferenceDate';

export interface UpdateSectionValueParams<TSection extends FieldSection> {
  /**
   * The section on which we want to apply the new value.
   */
  activeSection: TSection;
  /**
   * Value to apply to the active section.
   */
  newSectionValue: string;
  /**
   * If `true`, the focus will move to the next section.
   */
  shouldGoToNextSection: boolean;
}

export const useFieldState = <
  TValue,
  TDate,
  TSection extends FieldSection,
  TForwardedProps extends UseFieldForwardedProps,
  TInternalProps extends UseFieldInternalProps<any, any, any, any>,
>(
  params: UseFieldParams<TValue, TDate, TSection, TForwardedProps, TInternalProps>,
) => {
  const utils = useUtils<TDate>();
  const localeText = useLocaleText<TDate>();
  const adapter = useLocalizationContext<TDate>();
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';

  const {
    valueManager,
    fieldValueManager,
    valueType,
    validator,
    internalProps,
    internalProps: {
      value: valueProp,
      defaultValue,
      referenceDate: referenceDateProp,
      onChange,
      format,
      formatDensity = 'dense',
      selectedSection: selectedSectionProp,
      onSelectedSectionChange,
      shouldRespectLeadingZeros = false,
      timezone: timezoneProp,
    },
  } = params;

  const {
    timezone,
    value: valueFromTheOutside,
    handleValueChange,
  } = useValueWithTimezone({
    timezone: timezoneProp,
    value: valueProp,
    defaultValue,
    onChange,
    valueManager,
  });

  const sectionsValueBoundaries = React.useMemo(
    () => getSectionsBoundaries<TDate>(utils, timezone),
    [utils, timezone],
  );

  const getSectionsFromValue = React.useCallback(
    (value: TValue, fallbackSections: TSection[] | null = null) =>
      fieldValueManager.getSectionsFromValue(utils, value, fallbackSections, (date) =>
        splitFormatIntoSections(
          utils,
          timezone,
          localeText,
          format,
          date,
          formatDensity,
          shouldRespectLeadingZeros,
          isRTL,
        ),
      ),
    [
      fieldValueManager,
      format,
      localeText,
      isRTL,
      shouldRespectLeadingZeros,
      utils,
      formatDensity,
      timezone,
    ],
  );

  const placeholder = React.useMemo(
    () =>
      fieldValueManager.getValueStrFromSections(
        getSectionsFromValue(valueManager.emptyValue),
        isRTL,
      ),
    [fieldValueManager, getSectionsFromValue, valueManager.emptyValue, isRTL],
  );

  const [state, setState] = React.useState<UseFieldState<TValue, TSection>>(() => {
    const sections = getSectionsFromValue(valueFromTheOutside);
    validateSections(sections, valueType);

    const stateWithoutReferenceDate: UseFieldState<TValue, TSection> = {
      sections,
      value: valueFromTheOutside,
      referenceValue: valueManager.emptyValue,
    };

    const granularity = getSectionTypeGranularity(sections);
    const referenceValue = valueManager.getInitialReferenceValue({
      referenceDate: referenceDateProp,
      value: valueFromTheOutside,
      utils,
      props: internalProps as GetDefaultReferenceDateProps<TDate>,
      granularity,
      timezone,
    });

    return {
      ...stateWithoutReferenceDate,
      referenceValue,
    };
  });

  const [selectedSection, innerSetSelectedSection] = useControlled({
    controlled: selectedSectionProp,
    default: null,
    name: 'useField',
    state: 'selectedSectionIndexes',
  });

  const setSelectedSection = (newSelectedSections: FieldSelectedSection) => {
    innerSetSelectedSection(newSelectedSections);
    onSelectedSectionChange?.(newSelectedSections);

    setState((prevState) => ({
      ...prevState,
      selectedSectionQuery: null,
    }));
  };

  const selectedSectionIndex = React.useMemo<number | null>(() => {
    if (selectedSection == null) {
      return null;
    }

    if (typeof selectedSection === 'number') {
      return selectedSection;
    }

    const index = state.sections.findIndex((section) => section.type === selectedSection);

    return index === -1 ? null : index;
  }, [selectedSection, state.sections]);

  const publishValue = ({
    value,
    referenceValue,
    sections,
  }: Pick<UseFieldState<TValue, TSection>, 'value' | 'referenceValue' | 'sections'>) => {
    setState((prevState) => ({
      ...prevState,
      sections: resetSectionsTempValueStr(sections),
      value,
      referenceValue,
    }));

    if (valueManager.areValuesEqual(utils, state.value, value)) {
      return;
    }

    const context: FieldChangeHandlerContext<InferError<TInternalProps>> = {
      validationError: validator({
        adapter,
        value,
        props: { ...internalProps, value, timezone },
      }),
    };

    handleValueChange(value, context);
  };

  const setSectionValue = (sectionIndex: number, newSectionValue: string) => {
    const newSections = [...state.sections];

    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      value: newSectionValue,
      modified: true,
    };

    return newSections;
  };

  const clearValue = () => {
    publishValue({
      value: valueManager.emptyValue,
      referenceValue: state.referenceValue,
      sections: getSectionsFromValue(valueManager.emptyValue),
    });
  };

  const clearActiveSection = () => {
    if (selectedSectionIndex == null) {
      return;
    }

    const activeSection = state.sections[selectedSectionIndex];
    const activeDateManager = fieldValueManager.getActiveDateManager(utils, state, activeSection);

    const nonEmptySectionCountBefore = activeDateManager
      .getSections(state.sections)
      .filter((section) => section.value !== '').length;
    const hasNoOtherNonEmptySections =
      nonEmptySectionCountBefore === (activeSection.value === '' ? 0 : 1);

    const newSections = setSectionValue(selectedSectionIndex, '');
    const newActiveDate = hasNoOtherNonEmptySections ? null : utils.date(new Date(''));
    const newValues = activeDateManager.getNewValuesFromNewActiveDate(newActiveDate);

    if (
      (newActiveDate != null && !utils.isValid(newActiveDate)) !==
      (activeDateManager.date != null && !utils.isValid(activeDateManager.date))
    ) {
      publishValue({ ...newValues, sections: newSections });
    } else {
      setState((prevState) => ({
        ...prevState,
        ...newValues,
        sections: resetSectionsTempValueStr(newSections),
      }));
    }
  };

  const updateSectionValue = ({
    activeSection,
    newSectionValue,
    shouldGoToNextSection,
  }: UpdateSectionValueParams<TSection>) => {
    /**
     * 1. Decide which section should be focused
     */
    if (
      shouldGoToNextSection &&
      selectedSectionIndex != null &&
      selectedSectionIndex < state.sections.length - 1
    ) {
      setSelectedSection(selectedSectionIndex + 1);
    }

    /**
     * 2. Try to build a valid date from the new section value
     */
    const activeDateManager = fieldValueManager.getActiveDateManager(utils, state, activeSection);
    const newSections = setSectionValue(selectedSectionIndex!, newSectionValue);
    const newActiveDateSections = activeDateManager.getSections(newSections);
    const newActiveDate = getDateFromDateSections(utils, newActiveDateSections);

    let values: Pick<UseFieldState<TValue, TSection>, 'value' | 'referenceValue'>;
    let shouldPublish: boolean;

    /**
     * If the new date is valid,
     * Then we merge the value of the modified sections into the reference date.
     * This makes sure that we don't lose some information of the initial date (like the time on a date field).
     */
    if (newActiveDate != null && utils.isValid(newActiveDate)) {
      const mergedDate = mergeDateIntoReferenceDate(
        utils,
        timezone,
        newActiveDate,
        newActiveDateSections,
        activeDateManager.referenceDate,
        true,
      );

      values = activeDateManager.getNewValuesFromNewActiveDate(mergedDate);
      shouldPublish = true;
    } else {
      values = activeDateManager.getNewValuesFromNewActiveDate(newActiveDate);
      shouldPublish =
        (newActiveDate != null && !utils.isValid(newActiveDate)) !==
        (activeDateManager.date != null && !utils.isValid(activeDateManager.date));
    }

    /**
     * Publish or update the internal state with the new value and sections.
     */
    if (shouldPublish) {
      return publishValue({ ...values, sections: newSections });
    }

    return setState((prevState) => ({
      ...prevState,
      ...values,
      sections: resetSectionsTempValueStr(newSections),
    }));
  };

  const setSectionTempValueStr = (sectionIndex: number, tempValueStr: string) =>
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, tempValueStr } : section,
      ),
    }));

  const resetSectionsTempValueStrFromState = () =>
    setState((prev) => ({ ...prev, sections: resetSectionsTempValueStr(prev.sections) }));

  React.useEffect(() => {
    const sections = getSectionsFromValue(state.value);
    validateSections(sections, valueType);
    setState((prevState) => ({
      ...prevState,
      sections,
    }));
  }, [format, utils.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    let shouldUpdate = false;
    if (!valueManager.areValuesEqual(utils, state.value, valueFromTheOutside)) {
      shouldUpdate = true;
    } else {
      shouldUpdate =
        valueManager.getTimezone(utils, state.value) !==
        valueManager.getTimezone(utils, valueFromTheOutside);
    }

    if (shouldUpdate) {
      setState((prevState) => ({
        ...prevState,
        value: valueFromTheOutside,
        referenceValue: fieldValueManager.updateReferenceValue(
          utils,
          valueFromTheOutside,
          prevState.referenceValue,
        ),
        sections: getSectionsFromValue(valueFromTheOutside),
      }));
    }
  }, [valueFromTheOutside]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    selectedSectionIndex,
    setSelectedSection,
    clearValue,
    clearActiveSection,
    updateSectionValue,
    setSectionTempValueStr,
    resetSectionsTempValueStr: resetSectionsTempValueStrFromState,
    sectionsValueBoundaries,
    placeholder,
    timezone,
  };
};
