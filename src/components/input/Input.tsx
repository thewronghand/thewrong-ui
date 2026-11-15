import { forwardRef, useState } from "react";
import { CircleX } from "lucide-react";

import {
  SLOT_BADGE_TEXT_CLASS,
  SLOT_CHILD_ICON_CLASS,
  SLOT_GAP_CLASS,
  SLOT_ICON_SIZE_CLASS,
} from "@/components/_shared/form-size-tokens";
import { cn } from "@/lib/utils";

import type { InputProps } from "./types";
import { useInputFormat } from "./use-input-format";
import {
  getInputClasses,
  getInputContainerClasses,
  getInputHelpClasses,
  getInputLabelClasses,
  getInputTrailingIconColor,
  getInputVariantClasses,
} from "./utils";

/**
 * Input 컴포넌트
 *
 * @example
 * <Input variant="box" label="이름" placeholder="이름을 입력하세요" />
 * <Input variant="box" hasError help="에러 메시지" />
 * <Input variant="box" disabled />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant,
      inputSize = "medium",
      label,
      labelOption = "appear",
      help,
      hasError = false,
      disabled = false,
      prefix,
      suffix,
      trailingIcon,
      clearable = false,
      badge,
      placeholder,
      format,
      containerProps,
      containerRef,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      className = "",
      ...restProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const {
      displayValue,
      handleChange,
      handleCompositionStart,
      handleCompositionEnd,
      setMergedInputRef,
      handleClear,
    } = useInputFormat({
      value, defaultValue, format, onChange, readOnly: restProps.readOnly,
    });

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const restRef = (restProps as { ref?: React.Ref<HTMLInputElement> }).ref;

    const filled = displayValue.length > 0;
    const containerClasses = getInputContainerClasses();
    const variantClasses = getInputVariantClasses(
      variant,
      hasError,
      disabled,
      inputSize,
    );
    const inputClasses = getInputClasses(
      variant,
      hasError,
      disabled,
      filled,
      inputSize,
    );
    const trailingIconColor = getInputTrailingIconColor(
      hasError,
      disabled,
      filled || isFocused,
    );

    const showLabel =
      labelOption === "sustain" ||
      (labelOption === "appear" && Boolean(displayValue));

    const isBox = variant === "box";

    // size 토큰은 form-size-tokens 단일 출처. 호출부가 inline className으로 h-*/w-*/text-*를
    // 명시하면 cascade에서 자식이 우선이라 자연스럽게 override 가능.
    const slotGap = SLOT_GAP_CLASS[inputSize];
    const slotIconSize = SLOT_CHILD_ICON_CLASS[inputSize];
    const slotBadgeText = SLOT_BADGE_TEXT_CLASS[inputSize];
    const builtinIconSize = SLOT_ICON_SIZE_CLASS[inputSize];

    const inputElement = (
      <div
        className={
          isBox
            ? cn(variantClasses, "flex items-center", slotGap, className)
            : "relative flex items-center text-sm"
        }
      >
        {prefix && (
          <span className={cn("whitespace-nowrap text-sm", trailingIconColor)}>
            {prefix}
          </span>
        )}
        <input
          {...(restProps as Omit<typeof restProps, "ref">)}
          ref={setMergedInputRef(ref, restRef)}
          className={
            isBox
              ? inputClasses
              : cn(
                  inputClasses,
                  variantClasses,
                  hasError && "border-border-danger focus:border-border-danger focus:ring-focus-danger",
                  disabled && "opacity-50",
                  className,
                )
          }
          value={displayValue}
          onChange={handleChange}
          onCompositionStart={(e) => {
            handleCompositionStart(e);
            restProps.onCompositionStart?.(e);
          }}
          onCompositionEnd={(e) => {
            handleCompositionEnd(e);
            restProps.onCompositionEnd?.(e);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && (
          <span className={cn("whitespace-nowrap text-sm", trailingIconColor)}>
            {suffix}
          </span>
        )}
        {trailingIcon && (
          <span
            className={cn("flex shrink-0 items-center", trailingIconColor, slotIconSize)}
          >
            {trailingIcon}
          </span>
        )}
        {clearable && !disabled && !restProps.readOnly && filled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="입력 지우기"
            // focus-visible로 키보드 사용자에게만 ring을 보여 마우스 클릭 후 잔상 ring을 피한다.
            className={cn(
              "flex shrink-0 cursor-pointer items-center rounded",
              trailingIconColor,
              "hover:text-fg-default focus:outline-hidden focus-visible:ring-input-clear focus-visible:ring-input-clear-ring",
            )}
          >
            <CircleX
              className={builtinIconSize}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        )}
        {badge && (
          <span
            className={cn("flex shrink-0 items-center", slotIconSize, slotBadgeText)}
          >
            {badge}
          </span>
        )}
      </div>
    );

    return (
      <div ref={containerRef} className={containerClasses} {...containerProps}>
        {showLabel && label && (
          <label
            className={getInputLabelClasses(variant, hasError)}
            htmlFor={restProps.id}
          >
            {label}
          </label>
        )}
        {inputElement}
        {help && <div className={getInputHelpClasses(hasError)}>{help}</div>}
      </div>
    );
  },
);

Input.displayName = "Input";
