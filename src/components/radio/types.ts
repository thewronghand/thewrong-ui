import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export type RadioContentAlignment = "start" | "center";

export interface RadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 그룹 안 라벨의 자연 너비를 측정해 가장 긴 라벨과 동일한 슬롯 너비를 사용합니다.
   * `contentAlignment="center"`인 Item과 조합하면 문구 길이가 달라도 콘텐츠 묶음의
   * 시작점과 시각적 중심을 함께 유지할 수 있습니다.
   * @default false
   */
  equalizeLabelWidth?: boolean;
}

export interface RadioItemProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "className" | "type"
> {
  /** 행의 주 라벨. 전체 행을 클릭하면 이 radio가 선택됩니다. */
  children: ReactNode;

  /** 라벨 앞에 표시할 선택적 아이콘. */
  leadingIcon?: ReactNode;

  /**
   * 선택 indicator를 왼쪽에 유지한 채 아이콘과 라벨 묶음의 정렬을 결정합니다.
   * @default "start"
   */
  contentAlignment?: RadioContentAlignment;

  /** 행 컨테이너에 추가할 클래스. */
  className?: string;
}
