import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonAppearance = "filled" | "outlined" | "transparent" | "link";
export type ButtonSize = "mini" | "small" | "medium" | "large";
export type ButtonDisplay = "inline" | "block";

export interface ButtonCommonProps {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  /** link에서만 부모 글자색을 상속한다. 부모는 배경 대비를 확보해야 하며, 필요하면 기본 variant 색을 사용한다. */
  color?: "inherit";
  /** link 모양에서는 크기 대신 부모의 글자 크기·줄높이·글꼴을 상속한다. 굵기는 기본 CSS의 폼 컨트롤 상속 규칙을 따른다. */
  size?: ButtonSize;
  /** link 모양에서는 block도 무시하고 문장 안에 배치한다. */
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
