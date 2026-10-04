import React, { useEffect, useState } from 'react';
import { TextField, type TextFieldProps } from '../../ui/components';

export interface NumberFieldProps
  extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: number;
  onChangeValue: (value: number) => void;
  /** Decimal places allowed while typing. */
  decimals?: number;
  max?: number;
}

/** Keeps digits and one decimal point (2 places), like the website's numeric inputs. */
export function normalizeDecimalInput(raw: string, decimals = 2): string {
  let cleaned = raw
    .replace(/[^\d.]/g, '')
    .replace(/(\..*?)\..*/g, '$1')
    .replace(/^0+(?=\d)/, '');
  const dot = cleaned.indexOf('.');
  if (dot !== -1)
    cleaned =
      decimals > 0
        ? cleaned.slice(0, dot + 1 + decimals)
        : cleaned.slice(0, dot);
  return cleaned;
}

const display = (value: number) => (value > 0 ? String(value) : '');

/** Numeric text input that keeps what the user typed while reporting a number. */
export function NumberField({
  value,
  onChangeValue,
  decimals = 2,
  max,
  ...field
}: NumberFieldProps) {
  const [text, setText] = useState(() => display(value));

  // Follow outside changes (e.g. values carried from the home calculator).
  useEffect(() => {
    setText(current =>
      Number(current || 0) === value ? current : display(value),
    );
  }, [value]);

  return (
    <TextField
      {...field}
      value={text}
      keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
      maxLength={12}
      onChangeText={raw => {
        const next = normalizeDecimalInput(raw, decimals);
        const numeric = Number(next || 0);
        if (max !== undefined && numeric > max) return;
        setText(next);
        onChangeValue(Number.isFinite(numeric) ? numeric : 0);
      }}
    />
  );
}
