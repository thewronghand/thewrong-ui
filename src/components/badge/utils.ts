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
      fill: "bg-primary text-fg-inverse",
      weak: "bg-primary-subtle text-primary-fg border border-primary-border",
    },
    secondary: {
      fill: "bg-neutral-fill text-fg-inverse",
      weak: "bg-neutral-subtle text-neutral-fg border border-neutral-border",
    },
    success: {
      fill: "bg-success text-fg-inverse",
      weak: "bg-success-subtle text-success-fg border border-success-border",
    },
    error: {
      fill: "bg-error text-fg-inverse",
      weak: "bg-error-subtle text-error-fg border border-error-border",
    },
    warning: {
      fill: "bg-warning text-fg-inverse",
      weak: "bg-warning-subtle text-warning-fg border border-warning-border",
    },
    info: {
      fill: "bg-info text-fg-inverse",
      weak: "bg-info-subtle text-info-fg border border-info-border",
    },
    neutral: {
      fill: "bg-neutral-fill text-fg-inverse",
      weak: "bg-neutral-subtle text-neutral-fg border border-neutral-border",
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
  "inline-flex items-center justify-center font-medium rounded-badge whitespace-nowrap";
