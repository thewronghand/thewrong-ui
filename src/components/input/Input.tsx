import { forwardRef, useRef, useState } from "react";
import { CircleX } from "lucide-react";

import {
  SLOT_BADGE_TEXT_CLASS,
  SLOT_CHILD_ICON_CLASS,
  SLOT_GAP_CLASS,
  SLOT_ICON_SIZE_CLASS,
} from "@/components/_shared/form-size-tokens";

import type { InputProps } from "./types";
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
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(() => {
      const initial = value ?? defaultValue ?? "";
      return format ? format.transform(initial).toString() : initial.toString();
    });
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isControlled = value !== undefined;
    const rawValue = isControlled ? value.toString() : uncontrolledValue;
    /**
     * 화면에 표시할 값. format이 있으면 transform 적용.
     * controlled 모드에서는 매 렌더마다 derive — 부모가 거부한 입력은 다시 표시되지 않는다.
     */
    const displayValue = format
      ? format.transform(rawValue).toString()
      : rawValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const typedValue = e.target.value;
      if (format) {
        const sanitized = format.transform(typedValue).toString();
        const rawForParent = format.reset
          ? format.reset(sanitized).toString()
          : sanitized;
        if (!isControlled) setUncontrolledValue(sanitized);
        onChange?.({
          ...e,
          target: { ...e.target, value: rawForParent },
        } as React.ChangeEvent<HTMLInputElement>);
      } else {
        if (!isControlled) setUncontrolledValue(typedValue);
        onChange?.(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // react-hook-form `register` 사용 시 register가 반환하는 ref가 restProps에 섞여 들어옴.
    // 외부 forwardRef + RHF register ref + 내부 inputRef 셋 다 병합해, clearable의 native dispatch가
    // 항상 같은 노드를 향하도록 한다.
    const restRef = (restProps as { ref?: React.Ref<HTMLInputElement> }).ref;
    const setMergedInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.RefObject<HTMLInputElement | null>).current = node;
      if (typeof restRef === "function") restRef(node);
      else if (restRef && "current" in restRef) {
        (restRef as React.RefObject<HTMLInputElement | null>).current =
          node;
      }
    };

    const handleClear = () => {
      // input의 native value를 빈 값으로 세팅한 뒤 input 이벤트를 디스패치해
      // 기존 handleChange/onChange 흐름을 그대로 탄다. react-hook-form/format
      // 등 부수 로직이 자연스럽게 따라옴.
      const node = inputRef.current;
      if (!node) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter?.call(node, "");
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.focus();
    };

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
            ? `${variantClasses} flex items-center ${slotGap} ${className}`
                .trim()
                .replace(/\s+/g, " ")
            : "relative flex items-center text-sm"
        }
      >
        {prefix && (
          <span className={`whitespace-nowrap text-sm ${trailingIconColor}`}>
            {prefix}
          </span>
        )}
        <input
          {...(restProps as Omit<typeof restProps, "ref">)}
          ref={setMergedInputRef}
          className={
            isBox
              ? inputClasses
              : `${inputClasses} ${variantClasses} ${
                  hasError
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500"
                    : ""
                } ${disabled ? "opacity-50" : ""} ${className}`
                  .trim()
                  .replace(/\s+/g, " ")
          }
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && (
          <span className={`whitespace-nowrap text-sm ${trailingIconColor}`}>
            {suffix}
          </span>
        )}
        {trailingIcon && (
          <span
            className={`flex shrink-0 items-center ${trailingIconColor} ${slotIconSize}`}
          >
            {trailingIcon}
          </span>
        )}
        {clearable && !disabled && filled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="입력 지우기"
            // focus-visible로 키보드 사용자에게만 ring을 보여 마우스 클릭 후 잔상 ring을 피한다.
            className={`flex shrink-0 cursor-pointer items-center rounded ${trailingIconColor} hover:text-text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500/40`}
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
            className={`flex shrink-0 items-center ${slotIconSize} ${slotBadgeText}`}
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
