import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Badge 컴포넌트의 크기 타입
 */
export type BadgeSize = "xsmall" | "small" | "medium" | "large";

/**
 * Badge 컴포넌트의 스타일 변형 타입
 */
export type BadgeVariant = "fill" | "weak";

/**
 * Badge 컴포넌트의 색상 타입
 */
export type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

/**
 * Badge 컴포넌트의 공통 Props
 */
export interface BadgeCommonProps {
  /**
   * Badge의 크기
   */
  size?: BadgeSize;
  /**
   * Badge의 스타일 (모양)
   */
  variant?: BadgeVariant;
  /**
   * Badge의 색상
   */
  color?: BadgeColor;
  /**
   * Badge의 내용
   */
  children: ReactNode;
}

/**
 * Badge 컴포넌트의 Props (span 태그용)
 */
export interface BadgeBaseProps
  extends Omit<ComponentPropsWithoutRef<"span">, "color" | "children">,
    BadgeCommonProps {
  /**
   * `as` prop이 없으면 span 태그로 렌더링돼요.
   */
  as?: never;
}

/**
 * Badge 컴포넌트의 Props (div 태그용)
 */
export interface BadgeDivProps
  extends Omit<ComponentPropsWithoutRef<"div">, "color" | "children">,
    BadgeCommonProps {
  /**
   * `as` prop을 통해 Badge의 태그를 변경할 수 있어요.
   */
  as: "div";
}

/**
 * Badge 컴포넌트의 Props
 */
export type BadgeProps = BadgeBaseProps | BadgeDivProps;
