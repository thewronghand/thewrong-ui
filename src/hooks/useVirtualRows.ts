import {
  useVirtualizer,
  type Virtualizer,
  type VirtualItem,
} from "@tanstack/react-virtual";
import type { RefObject } from "react";

// ── 옵션 ────────────────────────────────────────────────────────────────────

export interface UseVirtualRowsOptions {
  /**
   * 스크롤 컨테이너 ref.
   * null이면 스크롤 영역을 아직 측정할 수 없다.
   */
  scrollElementRef: RefObject<HTMLElement | null>;
  /** 기존 테이블의 직접 전달 요소. 없으면 scrollElementRef를 사용한다. */
  scrollElement?: HTMLElement | null;
  /**
   * 가상화할 행 수.
   */
  count: number;
  /**
   * 예상 행 높이(px). 실제 행 높이와 다르면 virtualizer가 동적 보정한다.
   * @default 48
   */
  estimateSize?: number;
  /**
   * 뷰포트 밖 미리 렌더할 행 수(위아래 각각).
   * 스크롤이 빠를수록 높은 값이 유리하나, 과하면 DOM 노드 수 증가.
   * @default 5
   */
  overscan?: number;
}

// ── 반환값 ──────────────────────────────────────────────────────────────────

export interface UseVirtualRowsReturn {
  /**
   * @tanstack/react-virtual 인스턴스.
   * measureElement(ref 콜백), scrollToIndex 등 고급 API 접근용.
   */
  virtualizer: Virtualizer<HTMLElement, Element>;
  /**
   * 현재 렌더해야 할 가상 행 목록.
   * 각 아이템의 `index`로 원본 데이터 배열에 접근한다.
   */
  virtualItems: VirtualItem[];
  /**
   * 전체 스크롤 영역 높이(px).
   * 스크롤 컨테이너 자식의 `height` 또는 `minHeight`에 적용한다.
   */
  totalSize: number;
  /**
   * 첫 번째 가상 행 위의 빈 공간 높이(px).
   * `<tr style={{ height: topSpacerHeight }} />` 또는 paddingTop에 사용.
   */
  topSpacerHeight: number;
  /**
   * 마지막 가상 행 아래의 빈 공간 높이(px).
   * `<tr style={{ height: bottomSpacerHeight }} />` 또는 paddingBottom에 사용.
   */
  bottomSpacerHeight: number;
}

// ── 훅 ──────────────────────────────────────────────────────────────────────

/** 행 수와 스크롤 요소로 가상 항목과 스페이서를 계산한다.
 * 스크롤 영역에 고정 높이와 overflow가 필요하다. 고급 측정은 반환된 virtualizer를 사용한다. */
export function useVirtualRows({
  scrollElementRef,
  scrollElement,
  count,
  estimateSize = 48,
  overscan = 5,
}: UseVirtualRowsOptions): UseVirtualRowsReturn {
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollElement ?? scrollElementRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // count가 0이면 계산 불필요 — DOM 마운트 전 빈 상태에서 안전
    enabled: count > 0,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // 스페이서 높이: 첫/마지막 가상 행의 start/end로 계산
  const topSpacerHeight =
    virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const bottomSpacerHeight =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return {
    virtualizer,
    virtualItems,
    totalSize,
    topSpacerHeight,
    bottomSpacerHeight,
  };
}
