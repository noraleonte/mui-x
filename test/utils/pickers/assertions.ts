import { expect } from 'chai';
import { SinonSpy } from 'sinon';
import { cleanText } from 'test/utils/pickers';

export const expectFieldValueV7 = (
  fieldContainer: HTMLDivElement,
  expectedValue: string,
  specialCase?: 'singleDigit' | 'RTL',
) => {
  const content = fieldContainer.querySelector<HTMLDivElement>('.fake-text-field-input-content')!;

  const value = cleanText(content.textContent ?? '', specialCase);
  return expect(value).to.equal(expectedValue);
};

export const expectFieldValueV6 = (
  input: HTMLInputElement,
  expectedValue: string,
  specialCase?: 'singleDigit' | 'RTL',
) => {
  const value = cleanText(input.value, specialCase);
  return expect(value).to.equal(expectedValue);
};

export const expectFieldPlaceholderV6 = (
  input: HTMLInputElement,
  placeholder: string,
  specialCase?: 'singleDigit' | 'RTL',
) => {
  const cleanPlaceholder = cleanText(input.placeholder, specialCase);
  return expect(cleanPlaceholder).to.equal(placeholder);
};

export function expectPickerChangeHandlerValue(
  type: 'date' | 'date-time' | 'time' | 'date-range',
  spyCallback: SinonSpy,
  expectedValue: any,
) {
  if (type === 'date-range') {
    spyCallback.lastCall.firstArg.forEach((value, index) => {
      expect(value).to.deep.equal(expectedValue[index]);
    });
  } else {
    expect(spyCallback.lastCall.firstArg).to.deep.equal(expectedValue);
  }
}
