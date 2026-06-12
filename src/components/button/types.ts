import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonAppearance = "filled" | "outlined" | "transparent";
export type ButtonSize = "mini" | "small" | "medium" | "large";
export type ButtonDisplay = "inline" | "block";

export interface ButtonCommonProps {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  display?: ButtonDisplay;
  loading?: boolean;
  /** 클릭 후 N ms 동안 추가 클릭 무시 — 더블클릭 방지 */
  clickThrottleMs?: number;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export interface ButtonBaseProps
  extends Omit<ComponentPropsWithoutRef<"button">, "color">,
    ButtonCommonProps {}

export interface ButtonLinkProps
  extends Omit<ComponentPropsWithoutRef<"a">, "color">,
    ButtonCommonProps {
  as: "a";
}

export type ButtonProps = ButtonBaseProps | ButtonLinkProps;
