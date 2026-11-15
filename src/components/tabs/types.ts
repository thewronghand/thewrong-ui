import type { ReactNode } from "react";

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<V extends string> {
  items: readonly TabItem<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** auto는 포커스 즉시 선택하고 manual은 Enter 또는 Space로 선택한다. 기본 auto. */
  activation?: "auto" | "manual";
  /** 가로 탭만 지원한다. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}
