import type { ReactNode } from "react";

export interface SegmentedControlOption<V extends string> {
  /** 이 칸이 나타내는 값. */
  value: V;
  /** 칸에 표시할 라벨. */
  label: ReactNode;
  /** 라벨 앞에 표시할 선택적 아이콘. */
  icon?: ReactNode;
  /** 이 칸만 개별적으로 비활성화합니다. */
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string> {
  /** 현재 선택된 값. */
  value: V;
  /** 값이 바뀌면 호출됩니다. */
  onChange: (next: V) => void;
  /** 표시할 옵션 목록. */
  options: readonly SegmentedControlOption<V>[];
  /**
   * 내부 네이티브 radio input들이 공유할 `name`.
   * @default useId()로 생성된 고유 값
   */
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** 전체 컨트롤을 비활성화합니다. */
  disabled?: boolean;
  /** 컨테이너에 추가할 클래스. */
  className?: string;
}
