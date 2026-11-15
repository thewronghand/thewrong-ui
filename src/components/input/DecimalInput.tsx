import { forwardRef, useEffect, useState } from "react";

import { Input } from "./Input";
import { validateDecimalDraft } from "./decimal-validation";
import type { InputProps } from "./types";

export interface DecimalInputProps extends Omit<
  InputProps,
  "value" | "defaultValue" | "onChange" | "type"
> {
  value?: string | number | null;
  defaultValue?: string | number | null;
  onChange?: (value: string) => void;
  /** 허용할 소수 자릿수. 0 이상의 유한한 정수로 지정한다. 기본 2. */
  decimalPlaces?: number;
  /** 음수 입력 허용. 기본 false. */
  allowNegative?: boolean;
  /** 빈 값을 onChange로 전달할지 여부. 기본 false. */
  emitEmpty?: boolean;
  min?: number;
  max?: number;
}

function asText(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** 소수 입력을 문자열로 전달한다. 범위 밖이지만 완성 가능한 접두사는 임시로 유지하고
 * 포커스를 잃으면 마지막 유효 값으로 복원한다. 빈 값도 전달하려면 emitEmpty를 켠다.
 * Input의 variant는 필수이며 소수점 자릿수와 범위는 호출부에서 지정한다. */
export const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      decimalPlaces = 2,
      allowNegative = false,
      emitEmpty = false,
      min,
      max,
      onBlur,
      ...inputProps
    },
    ref,
  ) => {
    const controlled = value !== undefined;
    const [draft, setDraft] = useState(() => asText(value ?? defaultValue));
    const [lastValid, setLastValid] = useState(() =>
      asText(value ?? defaultValue),
    );
    useEffect(() => {
      if (controlled) {
        const next = asText(value);
        setDraft(next);
        setLastValid(next);
      }
    }, [controlled, value]);

    const accept = (next: string) => {
      const outcome = validateDecimalDraft(next, {
        decimalPlaces,
        allowNegative,
        min,
        max,
      });
      if (outcome === "reject") return;
      setDraft(next);
      if (outcome === "empty") {
        if (emitEmpty) onChange?.(next);
      } else if (outcome === "value") {
        setLastValid(next);
        onChange?.(next);
      }
    };

    return (
      <Input
        {...inputProps}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => accept(event.target.value)}
        onBlur={(event) => {
          if (draft !== lastValid) setDraft(lastValid);
          onBlur?.(event);
        }}
      />
    );
  },
);
DecimalInput.displayName = "DecimalInput";
