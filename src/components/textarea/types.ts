import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Textarea 사이즈. Button/Input/Select와 정렬된 토큰 — 같은 size에서 동일 rounded/horizontal padding.
 * height는 가변이라 정렬 대상 아님(rows로 결정).
 * - mini: 모바일/매우 좁은 영역
 * - small: 다건 입력/표 형식 기본
 * - medium: 폼 단독 입력 기본
 * - large: 메인 페이지의 강조 입력
 */
export type TextareaSize = "mini" | "small" | "medium" | "large";

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "size"> {
  /**
   * 사이즈 — Button/Input/Select와 정렬.
   * @default 'medium'
   */
  textareaSize?: TextareaSize;
  /** 상단 라벨 */
  label?: string;
  /** 하단 도움말 */
  help?: ReactNode;
  /** 에러 상태 */
  hasError?: boolean;
  /**
   * 글자 수 카운터 표시 여부.
   * maxLength prop이 있어야 의미가 있음 (예: `12 / 200`).
   * @default false
   */
  showCount?: boolean;
  /**
   * 사용자가 크기 조절 가능 여부.
   * 기본은 false — 모달/드로어/고정 레이아웃 안에서 UI 깨짐 방지.
   * 자유 메모처럼 늘려쓸 필요가 있는 곳에서만 true.
   * @default false
   */
  resize?: boolean;
  /** 컨테이너 추가 클래스 */
  containerClassName?: string;
}
