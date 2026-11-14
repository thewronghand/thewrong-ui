import type { CheckboxProps, CheckboxVariant } from "./types";

/**
 * Checkbox의 기본 스타일 클래스를 반환합니다.
 */
export function getCheckboxBaseClasses(): string {
  return "inline-flex items-center justify-center cursor-pointer transition-all duration-200 focus-within:outline-hidden focus-within:ring-2 focus-within:ring-offset-2";
}

/**
 * Checkbox input의 기본 스타일 클래스를 반환합니다.
 */
export function getCheckboxInputBaseClasses(): string {
  return "appearance-none cursor-pointer transition-all duration-200 focus:outline-hidden";
}

/**
 * Checkbox Circle 변형의 스타일 클래스를 반환합니다.
 */
export function getCheckboxCircleClasses(
  baseColor: CheckboxProps["baseColor"] = "primary",
): string {
  const colorClasses = {
    primary:
      "border-border-default peer-checked:bg-primary peer-checked:border-primary text-fg-inverse",
    secondary:
      "border-border-default peer-checked:bg-neutral-fill peer-checked:border-neutral-fill text-fg-inverse",
    neutral:
      "border-border-default peer-checked:bg-neutral-fill peer-checked:border-neutral-fill text-fg-inverse",
  };

  return `${getCheckboxInputBaseClasses()} rounded-full border-2 ${colorClasses[baseColor]} relative flex items-center justify-center transition-all duration-200`;
}

/**
 * Checkbox Line 변형의 스타일 클래스를 반환합니다.
 */
export function getCheckboxLineClasses(
  baseColor: CheckboxProps["baseColor"] = "primary",
): string {
  const colorClasses = {
    primary:
      "border-border-default peer-checked:bg-primary peer-checked:border-primary text-fg-inverse",
    secondary:
      "border-border-default peer-checked:bg-neutral-fill peer-checked:border-neutral-fill text-fg-inverse",
    neutral:
      "border-border-default peer-checked:bg-neutral-fill peer-checked:border-neutral-fill text-fg-inverse",
  };

  return `${getCheckboxInputBaseClasses()} rounded-checkbox border-2 ${colorClasses[baseColor]} relative flex items-center justify-center transition-all duration-200`;
}

/**
 * Checkbox LineTransparent 변형의 스타일 클래스를 반환합니다.
 */
export function getCheckboxLineTransparentClasses(
  baseColor: CheckboxProps["baseColor"] = "primary",
): string {
  const colorClasses = {
    primary:
      "border-border-subtle peer-checked:border-primary text-primary-fg",
    secondary:
      "border-border-subtle peer-checked:border-neutral-fill text-neutral-fg",
    neutral:
      "border-border-subtle peer-checked:border-neutral-fill text-neutral-fg",
  };

  return `${getCheckboxInputBaseClasses()} rounded-checkbox border-2 bg-transparent ${colorClasses[baseColor]} relative flex items-center justify-center transition-all duration-200`;
}

/**
 * variant에 따른 Checkbox 스타일 클래스를 반환합니다.
 */
export function getCheckboxVariantClasses(
  variant: CheckboxVariant,
  baseColor: CheckboxProps["baseColor"] = "primary",
): string {
  switch (variant) {
    case "circle":
      return getCheckboxCircleClasses(baseColor);
    case "line":
      return getCheckboxLineClasses(baseColor);
    case "lineTransparent":
      return getCheckboxLineTransparentClasses(baseColor);
    default:
      return getCheckboxLineClasses(baseColor);
  }
}

/**
 * Checkbox 크기에 따른 스타일을 반환합니다.
 */
export function getCheckboxSizeStyle(size: number = 24): React.CSSProperties {
  return {
    width: `${size}px`,
    height: `${size}px`,
  };
}

/**
 * Label 스타일 클래스를 반환합니다.
 */
export function getLabelClasses(): string {
  return "inline-flex items-center gap-2 cursor-pointer select-none";
}
