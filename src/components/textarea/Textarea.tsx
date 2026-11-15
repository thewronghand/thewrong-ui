import { forwardRef, useState } from "react";

import { CONTROL_TEXT_CLASS } from "@/components/_shared/form-size-tokens";
import { cn } from "@/lib/utils";

import type { TextareaProps, TextareaSize } from "./types";

// size 토큰은 Button/Input/Select와 정렬: rounded·horizontal padding을 동일하게.
// height는 textarea 특성상 rows로 결정되니 vertical padding만 통일하고 h-* 미사용.
const WRAPPER_BASE_BY_SIZE: Record<TextareaSize, string> = {
  large:
    "rounded-control-large border px-control-pad-large py-3.5 transition-colors focus-within:outline-hidden",
  medium:
    "rounded-control-medium border px-control-pad-medium py-3 transition-colors focus-within:outline-hidden",
  small:
    "rounded-control-small border px-control-pad-small py-2 transition-colors focus-within:outline-hidden",
  mini: "rounded-control-mini border px-control-pad-mini py-1.5 transition-colors focus-within:outline-hidden",
};

const getWrapperClasses = (
  hasError: boolean,
  disabled: boolean,
  size: TextareaSize,
): string => {
  const WRAPPER_BASE = WRAPPER_BASE_BY_SIZE[size];
  if (disabled) {
    return [
      WRAPPER_BASE,
      "bg-bg-disabled border-border-subtle",
    ].join(" ");
  }
  if (hasError) {
    return [WRAPPER_BASE, "bg-bg-surface border-border-danger"].join(" ");
  }
  return [
    WRAPPER_BASE,
    "bg-bg-surface border-border-subtle focus-within:border-border-primary",
  ].join(" ");
};

const getTextareaClasses = (
  hasError: boolean,
  disabled: boolean,
  filled: boolean,
  resize: boolean,
  size: TextareaSize,
): string => {
  const fontSize = CONTROL_TEXT_CLASS[size];
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed ${
    resize ? "resize-y" : "resize-none"
  }`;
  if (disabled) {
    return [base, "text-fg-disabled placeholder:text-fg-disabled"].join(
      " ",
    );
  }
  if (hasError) {
    return [base, "text-fg-danger placeholder:text-fg-danger-placeholder"].join(" ");
  }
  if (filled) {
    return [base, "text-fg-default placeholder:text-fg-subtle"].join(
      " ",
    );
  }
  return [base, "text-fg-subtle placeholder:text-fg-subtle"].join(" ");
};

const getLabelClasses = (hasError: boolean): string =>
  [
    "block text-xs font-medium mb-2",
    hasError ? "text-fg-danger" : "text-fg-muted",
  ].join(" ");

const getHelpClasses = (hasError: boolean): string =>
  [
    "mt-2 text-sm",
    hasError ? "text-fg-danger" : "text-fg-muted",
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
        className={cn(
          "text-xs",
          hasError ? "text-fg-danger" : "text-fg-subtle",
        )}
      >
        {currentValue.length} / {maxLength}
      </span>
    );

    return (
      <div className={cn("w-full", containerClassName)}>
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
            className={cn(textareaClasses, className)}
          />
          {counter && <div className="mt-1 flex justify-end">{counter}</div>}
        </div>
        {help && <div className={getHelpClasses(hasError)}>{help}</div>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
