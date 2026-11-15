import { CONTROL_TEXT_CLASS } from "@/components/_shared/form-size-tokens";

import type { SelectSize, SelectVariant } from "./types";

// size 토큰은 Button/Input/Textarea와 정렬: 같은 size에서 동일 height/rounded/horizontal padding.
const BOX_BASE_BY_SIZE: Record<SelectSize, string> = {
  large:
    "h-control-large rounded-control-large border-control px-control-pad-large transition-colors focus-within:outline-hidden",
  medium:
    "h-control-medium rounded-control-medium border-control px-control-pad-medium transition-colors focus-within:outline-hidden",
  small:
    "h-control-small rounded-control-small border-control px-control-pad-small transition-colors focus-within:outline-hidden",
  mini:
    "h-control-mini rounded-control-mini border-control px-control-pad-mini transition-colors focus-within:outline-hidden",
};

/**
 * Select Variant에 따른 컨테이너 클래스. 2026 리디자인 box variant는 Button/Input과 동일 토큰.
 * line/big/hero는 레거시 — Input과 동일하게 추후 정리.
 */
export const getSelectVariantClasses = (
  variant: SelectVariant,
  hasError: boolean = false,
  disabled: boolean = false,
  size: SelectSize = "medium",
): string => {
  if (variant === "box") {
    const BOX_BASE = BOX_BASE_BY_SIZE[size];
    if (disabled) {
      return [
        BOX_BASE,
        "bg-bg-disabled border-border-subtle",
      ].join(" ");
    }
    if (hasError) {
      return [BOX_BASE, "bg-bg-surface border-border-danger"].join(" ");
    }
    return [
      BOX_BASE,
      "bg-bg-surface border-border-subtle focus-within:border-border-primary",
    ].join(" ");
  }

  // 레거시 variant — 기존 로직 유지
  const variantMap: Record<SelectVariant, string> = {
    box: "",
    line: "border-b-2 border-border-subtle px-0 py-2 pr-0 focus:border-primary focus:ring-0",
    big: "border-2 border-border-subtle rounded pl-5 pr-5 py-0 text-lg focus:border-primary focus:ring-control focus:ring-primary focus:ring-offset-0 h-[52px] leading-[52px]",
    hero: "border-2 border-border-subtle rounded pl-6 pr-6 py-0 text-xl font-semibold focus:border-primary focus:ring-control focus:ring-primary focus:ring-offset-0 h-[64px] leading-[64px]",
  };
  return variantMap[variant];
};

/**
 * Select의 텍스트 토큰 — Input과 동일한 색 위계.
 * disabled / error / filled / placeholder 4단계.
 */
export const getSelectBaseClasses = (
  variant: SelectVariant = "box",
  hasError: boolean = false,
  disabled: boolean = false,
  filled: boolean = false,
  size: SelectSize = "medium",
): string => {
  // 폰트 사이즈는 size 토큰을 따라간다 — Button/Input/Textarea와 동일 위계.
  const fontSize = CONTROL_TEXT_CLASS[size];
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed appearance-none`;

  if (variant !== "box") {
    return [
      "w-full bg-bg-surface text-sm text-fg-default transition-all duration-200 ease-out focus:outline-hidden disabled:bg-bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed disabled:border-border-subtle appearance-none",
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

/** trailing chevron 색 — Input의 trailing icon과 동일 위계. */
export const getSelectTrailingIconColor = (
  hasError: boolean,
  disabled: boolean,
  filledOrFocused: boolean,
): string => {
  if (disabled) return "text-fg-disabled";
  if (hasError) return "text-fg-danger";
  if (filledOrFocused) return "text-fg-muted";
  return "text-fg-subtle";
};

export const getSelectContainerClasses = (): string => "w-full";

export const getSelectLabelClasses = (
  _variant: SelectVariant,
  hasError: boolean,
): string => {
  return [
    "block text-xs font-medium mb-2",
    hasError ? "text-fg-danger" : "text-fg-muted",
  ].join(" ");
};

export const getSelectHelpClasses = (hasError: boolean): string => {
  return [
    "mt-2 text-sm",
    hasError ? "text-fg-danger" : "text-fg-muted",
  ].join(" ");
};
