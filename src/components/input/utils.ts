import { CONTROL_TEXT_CLASS } from "@/components/_shared/form-size-tokens";

import type { InputSize, InputVariant } from "./types";

// size 토큰은 Button/Select/Textarea와 정렬: 같은 size에서 동일 height/rounded/horizontal padding.
// height는 명시(h-*) — padding 기반은 line-height에 따라 흔들려 Button과 정렬이 깨진다.
const BOX_BASE_BY_SIZE: Record<InputSize, string> = {
  large:
    "h-control-large rounded-control-large border-control px-control-pad-large transition-colors focus-within:outline-hidden",
  medium:
    "h-control-medium rounded-control-medium border-control px-control-pad-medium transition-colors focus-within:outline-hidden",
  small:
    "h-control-small rounded-control-small border-control px-control-pad-small transition-colors focus-within:outline-hidden",
  mini: "h-control-mini rounded-control-mini border-control px-control-pad-mini transition-colors focus-within:outline-hidden",
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
    const base = BOX_BASE_BY_SIZE[size];
    if (disabled) {
      return [
        base,
        "bg-bg-disabled border-border-subtle",
      ].join(" ");
    }
    if (hasError) {
      return [base, "bg-bg-surface border-border-danger"].join(" ");
    }
    return [
      base,
      "bg-bg-surface border-border-subtle focus-within:border-border-primary",
    ].join(" ");
  }

  // 레거시 variant — 기존 로직 유지
  const variantMap: Record<InputVariant, string> = {
    box: "",
    line: "border-b-2 border-border-subtle px-0 py-2 focus:border-primary focus:ring-0",
    big: "border-2 border-border-subtle rounded px-5 py-4 text-lg focus:border-primary focus:ring-control focus:ring-primary focus:ring-offset-0 h-[52px]",
    hero: "border-2 border-border-subtle rounded px-6 py-5 text-xl font-semibold focus:border-primary focus:ring-control focus:ring-primary focus:ring-offset-0 h-[64px]",
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
  const fontSize = CONTROL_TEXT_CLASS[size];
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed`;

  if (variant !== "box") {
    return [
      "w-full bg-bg-surface text-sm text-fg-default placeholder:text-fg-subtle transition-all duration-200 ease-out focus:outline-hidden disabled:bg-bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed disabled:border-border-subtle",
    ].join(" ");
  }

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

/**
 * Trailing 영역(아이콘/clear/라벨) 색상 — 상태에 따라.
 */
export const getInputTrailingIconColor = (
  hasError: boolean,
  disabled: boolean,
  filledOrFocused: boolean,
): string => {
  if (disabled) return "text-fg-disabled";
  if (hasError) return "text-fg-danger";
  if (filledOrFocused) return "text-fg-muted";
  return "text-fg-subtle";
};

export const getInputContainerClasses = (): string => "w-full";

export const getInputLabelClasses = (
  _variant: InputVariant,
  hasError: boolean,
): string => {
  return [
    "block text-xs font-medium mb-2",
    hasError ? "text-fg-danger" : "text-fg-muted",
  ].join(" ");
};

export const getInputHelpClasses = (hasError: boolean): string => {
  return [
    "mt-2 text-sm",
    hasError ? "text-fg-danger" : "text-fg-muted",
  ].join(" ");
};
