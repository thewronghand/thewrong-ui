import type { InputHTMLAttributes } from "react";

export type SwitchSize = "small" | "medium";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** 트랙·노브 사이즈. 기본 medium. */
  size?: SwitchSize;
  /** 우측 라벨. 지정하면 클릭 가능한 label로 감싸진다. */
  label?: string;
  /** 체크 상태 변경 콜백. onChange와 함께 호출된다. */
  onCheckedChange?: (checked: boolean) => void;
}
