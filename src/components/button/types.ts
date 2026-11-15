import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonAppearance = "filled" | "outlined" | "transparent" | "link";
export type ButtonSize = "mini" | "small" | "medium" | "large";
export type ButtonDisplay = "inline" | "block";

export interface ButtonCommonProps {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  /** link 모양에서는 크기 대신 부모의 글자 크기와 줄높이를 상속한다. */
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
