import type { SelectSize, SelectVariant } from "./types";

// size 토큰은 Button/Input/Textarea와 정렬: 같은 size에서 동일 height/rounded/horizontal padding.
const BOX_BASE_BY_SIZE: Record<SelectSize, string> = {
  large:
    "h-12 rounded-xl border px-5 transition-colors focus-within:outline-hidden",
  medium:
    "h-11 rounded-xl border px-3.5 transition-colors focus-within:outline-hidden",
  small:
    "h-9 rounded-lg border px-3 transition-colors focus-within:outline-hidden",
  mini:
    "h-7 rounded-md border px-2 transition-colors focus-within:outline-hidden",
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
    // 다크모드: border-tertiary(slate/800)가 모달 배경(neutral-800)과 거의 동일색이라
    // 외곽선이 사라져 보인다. dark:border-secondary로 한 단계 밝게 override.
    if (disabled) {
      return [
        BOX_BASE,
        "bg-bg-disabled border-border-tertiary dark:border-border-secondary",
      ].join(" ");
    }
    if (hasError) {
      return [BOX_BASE, "bg-bg-white border-border-danger"].join(" ");
    }
    return [
      BOX_BASE,
      "bg-bg-white border-border-tertiary dark:border-border-secondary focus-within:border-border-primary",
    ].join(" ");
  }

  // 레거시 variant — 기존 로직 유지
  const variantMap: Record<SelectVariant, string> = {
    box: "",
    line: "border-b-2 border-neutral-300 dark:border-neutral-600 px-0 py-2 pr-0 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-0",
    big: "border-2 border-neutral-300 dark:border-neutral-600 rounded pl-5 pr-5 py-0 text-lg focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-0 h-[52px] leading-[52px]",
    hero: "border-2 border-neutral-300 dark:border-neutral-600 rounded pl-6 pr-6 py-0 text-xl font-semibold focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-0 h-[64px] leading-[64px]",
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
  const fontSize =
    size === "mini" ? "text-xs" : size === "large" ? "text-base" : "text-sm";
  const base = `w-full bg-transparent ${fontSize} focus:outline-hidden disabled:cursor-not-allowed appearance-none`;

  if (variant !== "box") {
    return [
      "w-full bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white transition-all duration-200 ease-out focus:outline-hidden disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200 appearance-none",
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

/** trailing chevron 색 — Input의 trailing icon과 동일 위계. */
export const getSelectTrailingIconColor = (
  hasError: boolean,
  disabled: boolean,
  filledOrFocused: boolean,
): string => {
  if (disabled) return "text-icon-disabled";
  if (hasError) return "text-icon-danger";
  if (filledOrFocused) return "text-icon-secondary";
  return "text-icon-tertiary";
};

export const getSelectContainerClasses = (): string => "w-full";

export const getSelectLabelClasses = (
  _variant: SelectVariant,
  hasError: boolean,
): string => {
  return [
    "block text-xs font-medium mb-2",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");
};

export const getSelectHelpClasses = (hasError: boolean): string => {
  return [
    "mt-2 text-sm",
    hasError ? "text-text-danger" : "text-text-secondary",
  ].join(" ");
};
