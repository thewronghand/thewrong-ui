import type { InputHTMLAttributes } from "react";

/**
 * Checkbox 컴포넌트의 공통 Props
 */
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * input 태그의 `type` 속성을 결정해요.
   * @default 'checkbox'
   */
  inputType?: "checkbox" | "radio";

  /**
   * Checkbox 컴포넌트의 크기를 결정해요.
   * @default 24
   */
  size?: number;

  /**
   * Checkbox 컴포넌트의 선택 상태가 바뀔 때 실행되는 함수예요.
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * Label 텍스트
   */
  label?: string;

  /**
   * Checkbox의 기본 색상
   * @default 'primary'
   */
  baseColor?: "primary" | "secondary" | "neutral";
}

/**
 * Checkbox 변형 타입
 */
export type CheckboxVariant = "circle" | "line" | "lineTransparent";
