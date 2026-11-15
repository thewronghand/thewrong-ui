import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { CheckboxProps, CheckboxVariant } from "./types";
import {
  getCheckboxVariantClasses,
  getCheckboxSizeStyle,
  getLabelClasses,
} from "./utils";

/**
 * 내부 Checkbox 컴포넌트
 */
const CheckboxInternal = forwardRef<
  HTMLInputElement,
  CheckboxProps & { variant: CheckboxVariant }
>(
  (
    {
      variant,
      inputType = "checkbox",
      size = 24,
      baseColor = "primary",
      label,
      onCheckedChange,
      onChange,
      className = "",
      ...restProps
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const variantClasses = getCheckboxVariantClasses(variant, baseColor);
    const sizeStyle = getCheckboxSizeStyle(size);

    const checkboxElement = (
      <span className="relative inline-flex items-center has-[:disabled]:cursor-not-allowed">
        <input
          ref={ref}
          type={inputType}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={handleChange}
          {...restProps}
        />
        <span
          className={cn(
            variantClasses,
            "peer-checked:[&_path]:scale-100 peer-disabled:cursor-not-allowed peer-disabled:border-dashed peer-disabled:border-fg-default peer-disabled:peer-checked:border-fg-default peer-focus-visible:ring-2 peer-focus-visible:ring-fg-default peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-surface",
            className,
          )}
          style={sizeStyle}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12l5 5L20 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="origin-center scale-0 transition-transform duration-200 ease-out"
            />
          </svg>
        </span>
      </span>
    );

    if (label) {
      return (
        <label
          className={cn(getLabelClasses(), "has-[:disabled]:cursor-not-allowed")}
        >
          {checkboxElement}
          <span className="text-base text-fg-default">
            {label}
          </span>
        </label>
      );
    }

    return checkboxElement;
  },
);

CheckboxInternal.displayName = "CheckboxInternal";

/**
 * Checkbox.Circle 컴포넌트 — 원형 아이콘을 사용하는 체크박스
 */
export const CheckboxCircle = forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => <CheckboxInternal ref={ref} variant="circle" {...props} />,
);

CheckboxCircle.displayName = "Checkbox.Circle";

/**
 * Checkbox.Line 컴포넌트 — 라인 스타일의 체크박스
 */
export const CheckboxLine = forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => <CheckboxInternal ref={ref} variant="line" {...props} />,
);

CheckboxLine.displayName = "Checkbox.Line";

/**
 * Checkbox.LineTransparent 컴포넌트 — 투명한 라인 스타일의 체크박스
 */
export const CheckboxLineTransparent = forwardRef<
  HTMLInputElement,
  CheckboxProps
>((props, ref) => (
  <CheckboxInternal ref={ref} variant="lineTransparent" {...props} />
));

CheckboxLineTransparent.displayName = "Checkbox.LineTransparent";

/**
 * Checkbox 컴포넌트
 *
 * 세 가지 변형을 제공합니다.
 * - Circle: 원형 스타일
 * - Line: 라인 스타일
 * - LineTransparent: 투명 라인 스타일
 *
 * @example
 * ```tsx
 * <Checkbox.Circle size={24} checked={isChecked} />
 * <Checkbox.Line size={24} checked={isAgreed} />
 * <Checkbox.LineTransparent size={24} checked={isSelected} />
 * ```
 */
export const Checkbox = {
  Circle: CheckboxCircle,
  Line: CheckboxLine,
  LineTransparent: CheckboxLineTransparent,
};
