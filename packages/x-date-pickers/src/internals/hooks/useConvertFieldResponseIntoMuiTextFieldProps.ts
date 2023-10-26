import { UseFieldResponse } from './useField';

export const useConvertFieldResponseIntoMuiTextFieldProps = <
  TFieldResponse extends UseFieldResponse<any, any>,
>(
  fieldResponse: TFieldResponse,
) => {
  const { textField, ...props } = fieldResponse;

  if (textField === 'v6') {
    const { onPaste, onKeyDown, inputMode, readOnly, InputProps, inputProps, inputRef, ...other } =
      props;

    return {
      ...other,
      InputProps: { ...(InputProps ?? {}), readOnly },
      inputProps: { ...(inputProps ?? {}), inputMode, onPaste, onKeyDown, ref: inputRef },
    };
  }

  return props;
};
