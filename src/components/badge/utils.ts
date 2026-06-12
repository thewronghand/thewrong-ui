import type { BadgeColor, BadgeVariant, BadgeSize } from "./types";

/**
 * Badge 색상에 따른 Tailwind 클래스 매핑
 */
export const getBadgeColorClasses = (
  color: BadgeColor = "neutral",
  variant: BadgeVariant = "fill",
): string => {
  const colorMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
    primary: {
      fill: "bg-primary-500 text-white",
      weak: "bg-primary-50 text-primary-600 border border-primary-300",
    },
    secondary: {
      fill: "bg-secondary-500 text-white",
      weak: "bg-secondary-50 text-secondary-600 border border-secondary-300",
    },
    success: {
      fill: "bg-success-500 text-white",
      weak: "bg-success-50 text-success-600 border border-success-300",
    },
    error: {
      fill: "bg-error-500 text-white",
      weak: "bg-error-50 text-error-600 border border-error-300",
    },
    warning: {
      fill: "bg-warning-500 text-white",
      weak: "bg-warning-50 text-warning-600 border border-warning-300",
    },
    info: {
      fill: "bg-info-500 text-white",
      weak: "bg-info-50 text-info-600 border border-info-300",
    },
    neutral: {
      fill: "bg-neutral-500 text-white",
      weak: "bg-neutral-50 text-neutral-600 border border-neutral-300",
    },
  };

  return colorMap[color][variant];
};

/**
 * Badge 크기에 따른 Tailwind 클래스 매핑
 */
export const getBadgeSizeClasses = (size: BadgeSize = "medium"): string => {
  const sizeMap: Record<BadgeSize, string> = {
    xsmall: "px-1.5 py-0.5 text-xs", // 6px 2px, 12px
    small: "px-2 py-1 text-xs", // 8px 4px, 12px
    medium: "px-2.5 py-1 text-sm", // 10px 4px, 14px
    large: "px-3 py-1.5 text-base", // 12px 6px, 16px
  };

  return sizeMap[size];
};

/**
 * Badge의 기본 클래스 (공통 스타일)
 */
export const getBadgeBaseClasses = (): string =>
  "inline-flex items-center justify-center font-medium rounded-md whitespace-nowrap";
