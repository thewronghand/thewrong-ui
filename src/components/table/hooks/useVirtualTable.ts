import { useVirtualizer } from "@tanstack/react-virtual";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

/**
 * 가상화 테이블 훅 옵션
 */
export interface UseVirtualTableOptions {
  /**
   * 데이터 개수
   */
  count: number;
  /**
   * 예상 행 높이 (px)
   * @default 50
   */
  estimateSize?: number;
  /**
   * 화면 밖 렌더링 범위 (overscan)
   * @default 5
   */
  overscan?: number;
  /**
   * 스크롤 컨테이너 ref
   */
  scrollElement?: HTMLElement | null;
}

/**
 * 가상화 테이블 훅 반환값
 */
export interface UseVirtualTableReturn {
  /**
   * 가상화 인스턴스
   */
  virtualizer: Virtualizer<HTMLElement, Element>;
  /**
   * 스크롤 컨테이너 ref
   */
  parentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 가상화 테이블 훅
 *
 * @example
 * ```tsx
 * const { virtualizer, parentRef } = useVirtualTable({
 *   count: data.length,
 *   estimateSize: 60,
 * });
 * ```
 */
export function useVirtualTable({
  count,
  estimateSize = 50,
  overscan = 5,
  scrollElement,
}: UseVirtualTableOptions): UseVirtualTableReturn {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollElement || parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled: count > 0, // count가 0보다 클 때만 활성화
  });

  return useMemo(
    () => ({
      virtualizer,
      parentRef,
    }),
    [virtualizer]
  );
}
