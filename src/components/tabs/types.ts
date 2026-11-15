import type { ReactNode } from "react";

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<V extends string> {
  items: readonly TabItem<V>[];
  /** 활성 항목에 없으면 첫 활성 탭을 표시하며 콜백은 호출하지 않는다. 부모에서 값을 맞춘다. */
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** 비선택 패널도 숨긴 채 마운트를 유지한다. 숨긴 폼 필드는 제출·검증에 남으므로 제외하려면 비활성화하거나 기본 언마운트를 사용한다. 기본 false. */
  keepMounted?: boolean;
  /** auto는 화살표·Home·End 이동 시 선택하고 manual은 Enter 또는 Space로 선택한다. 기본 auto. */
  activation?: "auto" | "manual";
  /** 가로 탭만 지원한다. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}
