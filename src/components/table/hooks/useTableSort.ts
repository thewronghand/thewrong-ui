import { useState, useCallback } from "react";

import type { ColumnSort } from "../types";

/**
 * 테이블 정렬 훅 옵션
 */
export interface UseTableSortOptions {
  /**
   * 초기 정렬 상태
   */
  initialSort?: ColumnSort;
  /**
   * 서버 사이드 정렬 사용 여부
   * @default false
   */
  serverSide?: boolean;
  /**
   * 서버 사이드 정렬 콜백
   */
  onSort?: (sort: ColumnSort) => void;
}

/**
 * 테이블 정렬 훅 반환값
 */
export interface UseTableSortReturn {
  /**
   * 현재 정렬 상태
   */
  sort: ColumnSort | null;
  /**
   * 정렬 핸들러
   */
  handleSort: (key: string) => void;
  /**
   * 정렬된 데이터 (클라이언트 사이드 정렬 시)
   */
  sortedData: <T>(data: T[], getValue: (row: T, key: string) => any) => T[];
}

/**
 * 테이블 정렬 훅
 *
 * @example
 * ```tsx
 * const { sort, handleSort, sortedData } = useTableSort({
 *   initialSort: { key: 'date', direction: 'desc' },
 * });
 * ```
 */
export function useTableSort({
  initialSort,
  serverSide = false,
  onSort,
}: UseTableSortOptions = {}): UseTableSortReturn {
  const [sort, setSort] = useState<ColumnSort | null>(initialSort || null);

  const handleSort = useCallback(
    (key: string) => {
      const newSort: ColumnSort = {
        key,
        direction:
          sort?.key === key
            ? sort.direction === "asc"
              ? "desc"
              : sort.direction === "desc"
                ? null
                : "asc"
            : "asc",
      };

      // null이면 정렬 해제
      const finalSort = newSort.direction === null ? null : newSort;

      setSort(finalSort);

      // 서버 사이드 정렬 콜백 호출
      if (serverSide && onSort && finalSort) {
        onSort(finalSort);
      }
    },
    [sort, serverSide, onSort]
  );

  const sortedData = useCallback(
    <T>(data: T[], getValue: (row: T, key: string) => any): T[] => {
      if (!sort || !sort.direction || serverSide) {
        return data;
      }

      const sorted = [...data].sort((a, b) => {
        const aValue = getValue(a, sort.key);
        const bValue = getValue(b, sort.key);

        // null/undefined 처리
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // 숫자 비교
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        // 문자열 비교
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr, "ko", { numeric: true });

        return sort.direction === "asc" ? comparison : -comparison;
      });

      return sorted;
    },
    [sort, serverSide]
  );

  return {
    sort,
    handleSort,
    sortedData,
  };
}
