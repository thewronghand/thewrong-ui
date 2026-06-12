import type { InputSize, InputVariant } from "./types";

// size 토큰은 Button/Select/Textarea와 정렬: 같은 size에서 동일 height/rounded/horizontal padding.
// height는 명시(h-*) — padding 기반은 line-height에 따라 흔들려 Button과 정렬이 깨진다.
const BOX_BASE_BY_SIZE: Record<InputSize, string> = {
  large:
    "h-12 rounded-xl border px-5 transition-colors focus-within:outline-hidden",
  medium:
    "h-11 rounded-xl border px-3.5 transition-colors focus-within:outline-hidden",
  small:
    "h-9 rounded-lg border px-3 transition-colors focus-within:outline-hidden",
  mini: "h-7 rounded-md border px-2 transition-colors focus-within:outline-hidden",
};

/**
 * Input Variant에 따른 컨테이너(input wrapper) 클래스 매핑.
 * box variant는 새 디자인 적용. line/big/hero는 레거시.
 */
export const getInputVariantClasses = (
  variant: InputVariant,
  hasError: boolean,
  disabled: boolean,
  size: InputSize = "medium",
): string => {
  if (variant === "box") {
    // 다크모드: border-tertiary가 모달 배경과 거의 동일색이라
    // 외곽선이 사라져 보인다. dark:border-secondary로 한 단계 밝게 override.
    const base = BOX_BASE_BY_SIZE[size];
    if (disabled) {
      return [
        base,
        "bg-bg-disabled border-border-tertiary dark:border-border-secondary",
      ].join(" ");
    }
    if (hasError) {
      return [base, "bg-bg-white border-border-danger"].join(" ");
    }
    return [
      base,
      "bg-bg-white border-border-tertiary dark:border-border-secondary focus-within:border-border-primary",
    ].join(" ");
  }

  // 레거시 variant — 기존 로직 유지
  const variantMap: Record<InputVariant, string> = {
    box: "",
    line: "border-b-2 border-neutral-300 dark:border-neutral-600 px-0 py-2 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-0",
    big: "border-2 border-neutral-300 dark:border-neutral-600 rounded px-5 py-4 text-lg focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-0 h-[52px]",
    hero: "border-2 border-neutral-300 dark:border-neutral-600 rounded px-6 py-5 text-xl font-semibold focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-0 h-[64px]",
  };
  return variantMap[variant];
};

/**
 * input 엘리먼트 자체의 텍스트/배경 클래스.
 */
export const getInputClasses = (
  variant: InputVariant,
  hasError: boolean,
  disabled: boolean,
  filled: boolean,
  size: InputSize = "medium",
): string => {
  const fontSize =
    size === "mini" ? "text-xs" : size === "large" ? "text-base" : "text-sm";
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed`;

  if (variant !== "box") {
    return [
      "w-full bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all duration-200 ease-out focus:outline-hidden disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200",
    ].join(" ");
  }

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

/**
 * Trailing 영역(아이콘/clear/라벨) 색상 — 상태에 따라.
 */
export const getInputTrailingIconColor = (
  hasError: boolean,
  disabled: boolean,
  filledOrFocused: boolean,
): string => {
  if (disabled) return "text-icon-disabled";
  if (hasError) return "text-icon-danger";
  if (filledOrFocused) return "text-icon-secondary";
  return "text-icon-tertiary";
};

export const getInputContainerClasses = (): string => "w-full";

export const getInputLabelClasses = (
  _variant: InputVariant,
  hasError: boolean,
): string => {
  return [
    "block text-xs font-medium mb-2",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");
};

export const getInputHelpClasses = (hasError: boolean): string => {
  return [
    "mt-2 text-sm",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");
};
