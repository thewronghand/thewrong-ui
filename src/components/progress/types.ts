import type { ComponentPropsWithoutRef } from "react";

/** Progress 컴포넌트의 크기 타입 — 트랙 높이만 바뀐다. */
export type ProgressSize = "small" | "medium";

export interface ProgressProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "role" | "aria-valuenow" | "aria-valuemin" | "aria-valuemax" | "children"
> {
  /**
   * 진행률. **0~100 스케일이다(0~1 아님)** — 소비처는 백분율 값을 그대로
   * 넘긴다. 생략하면 불확정 진행 상태를 표시한다.
   */
  value?: number;
  size?: ProgressSize;
  /** 접근성 이름. 시각적 라벨이 이미 화면에 있으면 소비처에서 함께 넘긴다. */
  "aria-label"?: string;
}
