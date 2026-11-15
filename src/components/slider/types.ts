import type { ComponentPropsWithoutRef } from "react";

export interface SliderProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"
> {
  /** 범위의 시작. 기본 0. */
  min?: number;
  /** 범위의 끝. min 이상이어야 한다. 기본 100. */
  max?: number;
  /** 양수 간격. 기본 1. */
  step?: number;
  /** 범위 밖 값은 화면에서만 보정하며 그 자체로 콜백을 호출하지 않는다. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** 현재 값을 스크린리더에 읽힐 단위 포함 텍스트로 변환한다. */
  formatValue?: (value: number) => string;
}
