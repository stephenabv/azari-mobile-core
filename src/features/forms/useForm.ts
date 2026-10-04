import { useCallback, useRef, useState } from 'react';
import { ValidationError } from '../../core/http/ApiError';
import { FormValidator, type FieldErrors } from '../../domain/validation/rules';

export interface FormState<F extends string, V extends Record<F, string>> {
  values: V;
  errors: FieldErrors<F>;
  set: (field: F, value: string) => void;
  /** Validates one field once the user leaves it. */
  touch: (field: F) => void;
  /** Validates everything; returns true when the form can be sent. */
  validate: () => boolean;
  /** Shows server-side field errors (400 responses) next to their fields. */
  applyServerErrors: (error: unknown) => boolean;
  reset: () => void;
  replace: (values: V) => void;
}

/** Controlled form bound to a declarative FormValidator. */
export function useForm<F extends string, V extends Record<F, string>>(
  validator: FormValidator<F>,
  initial: V,
): FormState<F, V> {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<FieldErrors<F>>({});
  const latest = useRef(values);
  latest.current = values;

  const set = useCallback((field: F, value: string) => {
    setValues(v => ({ ...v, [field]: value }));
    setErrors(e => (e[field] ? { ...e, [field]: undefined } : e));
  }, []);

  const touch = useCallback(
    (field: F) => {
      const error = validator.field(field, latest.current[field]);
      setErrors(e => ({ ...e, [field]: error ?? undefined }));
    },
    [validator],
  );

  const validate = useCallback(() => {
    const next = validator.all(values);
    setErrors(next);
    return FormValidator.isValid(next);
  }, [validator, values]);

  const applyServerErrors = useCallback(
    (error: unknown) => {
      if (!(error instanceof ValidationError)) return false;
      const mapped: FieldErrors<F> = {};
      let any = false;
      for (const [key, messages] of Object.entries(error.fieldErrors)) {
        const field = key.split('.').pop() as F;
        if (field in values && messages[0]) {
          mapped[field] = messages[0];
          any = true;
        }
      }
      if (any) setErrors(mapped);
      return any;
    },
    [values],
  );

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
  }, [initial]);

  return {
    values,
    errors,
    set,
    touch,
    validate,
    applyServerErrors,
    reset,
    replace: setValues,
  };
}
