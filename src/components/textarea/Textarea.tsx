import { forwardRef, useState } from "react";

import type { TextareaProps, TextareaSize } from "./types";

// size 토큰은 Button/Input/Select와 정렬: rounded·horizontal padding을 동일하게.
// height는 textarea 특성상 rows로 결정되니 vertical padding만 통일하고 h-* 미사용.
const WRAPPER_BASE_BY_SIZE: Record<TextareaSize, string> = {
  large:
    "rounded-xl border px-5 py-3.5 transition-colors focus-within:outline-hidden",
  medium:
    "rounded-xl border px-3.5 py-3 transition-colors focus-within:outline-hidden",
  small:
    "rounded-lg border px-3 py-2 transition-colors focus-within:outline-hidden",
  mini: "rounded-md border px-2 py-1.5 transition-colors focus-within:outline-hidden",
};

// 다크모드: border-tertiary가 모달 배경과 거의 동색이라 외곽선이 사라져 보인다.
// dark:border-border-secondary로 한 단계 밝게 override. (input/select 동일 정책)
const getWrapperClasses = (
  hasError: boolean,
  disabled: boolean,
  size: TextareaSize,
): string => {
  const WRAPPER_BASE = WRAPPER_BASE_BY_SIZE[size];
  if (disabled) {
    return [
      WRAPPER_BASE,
      "bg-bg-disabled border-border-tertiary dark:border-border-secondary",
    ].join(" ");
  }
  if (hasError) {
    return [WRAPPER_BASE, "bg-bg-white border-border-danger"].join(" ");
  }
  return [
    WRAPPER_BASE,
    "bg-bg-white border-border-tertiary dark:border-border-secondary focus-within:border-border-primary",
  ].join(" ");
};

const getTextareaClasses = (
  hasError: boolean,
  disabled: boolean,
  filled: boolean,
  resize: boolean,
  size: TextareaSize,
): string => {
  const fontSize =
    size === "mini" ? "text-xs" : size === "large" ? "text-base" : "text-sm";
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed ${
    resize ? "resize-y" : "resize-none"
  }`;
  if (disabled) {
    return [base, "text-text-disabled placeholder:text-text-disabled"].join(
      " ",
    );
  }
  if (hasError) {
    return [base, "text-text-danger placeholder:text-text-danger"].join(" ");
  }
  if (filled) {
    return [base, "text-text-primary placeholder:text-text-tertiary"].join(
      " ",
    );
  }
  return [base, "text-text-tertiary placeholder:text-text-tertiary"].join(" ");
};

const getLabelClasses = (hasError: boolean): string =>
  [
    "block text-xs font-medium mb-2",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");

const getHelpClasses = (hasError: boolean): string =>
  [
    "mt-2 text-sm",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");

/**
 * Textarea 컴포넌트.
 *
 * @example
 * <Textarea label="메모" placeholder="내용을 입력하세요" rows={4} />
 * <Textarea hasError help="필수 항목이에요" />
 * <Textarea maxLength={200} showCount />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      textareaSize = "medium",
      label,
      help,
      hasError = false,
      disabled = false,
      showCount = false,
      resize = false,
      maxLength,
      rows = 4,
      className = "",
      containerClassName = "",
      value,
      defaultValue,
      onChange,
      placeholder,
      id,
      ...rest
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<string>(
      (defaultValue?.toString() ?? "") as string,
    );

    const isControlled = value !== undefined;
    const currentValue = isControlled
      ? (value?.toString() ?? "")
      : internalValue;
    const filled = currentValue.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const wrapperClasses = getWrapperClasses(hasError, disabled, textareaSize);
    const textareaClasses = getTextareaClasses(
      hasError,
      disabled,
      filled,
      resize,
      textareaSize,
    );

    const counter = showCount && maxLength != null && (
      <span
        className={[
          "text-xs",
          hasError ? "text-text-danger" : "text-text-tertiary",
        ].join(" ")}
      >
        {currentValue.length} / {maxLength}
      </span>
    );

    return (
      <div className={`w-full ${containerClassName}`.trim()}>
        {label && (
          <label className={getLabelClasses(hasError)} htmlFor={id}>
            {label}
          </label>
        )}
        <div className={wrapperClasses}>
          <textarea
            {...rest}
            ref={ref}
            id={id}
            rows={rows}
            value={isControlled ? currentValue : undefined}
            defaultValue={!isControlled ? defaultValue : undefined}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`${textareaClasses} ${className}`.trim()}
          />
          {counter && <div className="mt-1 flex justify-end">{counter}</div>}
        </div>
        {help && <div className={getHelpClasses(hasError)}>{help}</div>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
