import { useState, useCallback } from "react";

import type { ColumnSort } from "@/components/table/types";

import { nextSort, type SortCycle } from "./sort-state";

/**
 * 테이블 정렬 훅 옵션
 */
export interface UseTableSortOptions {
  /**
   * 초기 정렬 상태
   */
  initialSort?: ColumnSort;
  /** null을 포함해 지정하면 외부 정렬 상태를 사용하고 변경은 onSort에 알린다. */
  sort?: ColumnSort | null;
  /**
   * 서버 사이드 정렬 사용 여부
   * @default false
   */
  serverSide?: boolean;
  /**
   * 서버 정렬 또는 controlled sort의 변경 콜백
   */
  onSort?: (sort: ColumnSort | null) => void;
  /** 정렬 순서. tri는 오름차순 → 내림차순 → 해제, toggle은 두 방향만 순환한다. */
  cycle?: SortCycle;
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
  sortedData: <T>(data: T[], getValue: (row: T, key: string) => unknown) => T[];
}

/**
 * 테이블 정렬 훅
 * sort를 전달하면 null을 포함해 외부 상태를 사용하며 onSort로 변경을 요청한다.
 * 생략하면 initialSort에서 시작한다. serverSide에서는 데이터 순서를 바꾸지 않는다.
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
  sort: controlledSort,
  serverSide = false,
  onSort,
  cycle = "tri",
}: UseTableSortOptions = {}): UseTableSortReturn {
  const [internalSort, setSort] = useState<ColumnSort | null>(initialSort || null);
  const controlled = controlledSort !== undefined;
  const sort = controlled ? controlledSort : internalSort;

  const handleSort = useCallback(
    (key: string) => {
      const finalSort = nextSort(sort, key, cycle);

      if (!controlled) setSort(finalSort);

      // 서버 사이드 정렬 콜백 호출
      if ((serverSide || controlled) && onSort) {
        onSort(finalSort);
      }
    },
    [sort, controlled, serverSide, onSort, cycle]
  );

  const sortedData = useCallback(
    <T>(data: T[], getValue: (row: T, key: string) => unknown): T[] => {
      if (!sort || !sort.direction || serverSide) {
        return data;
      }

      const sorted = [...data].sort((a, b) => {
        const aValue = getValue(a, sort.key);
        const bValue = getValue(b, sort.key);

        // 숫자와 날짜는 수치로 비교하고 NaN은 값이 없는 것으로 취급한다.
        const aNumber = aValue instanceof Date ? aValue.getTime() : aValue;
        const bNumber = bValue instanceof Date ? bValue.getTime() : bValue;
        const aMissing = aNumber == null || (typeof aNumber === "number" && Number.isNaN(aNumber));
        const bMissing = bNumber == null || (typeof bNumber === "number" && Number.isNaN(bNumber));
        if (aMissing && bMissing) return 0;
        if (aMissing) return 1;
        if (bMissing) return -1;

        if (typeof aNumber === "number" && typeof bNumber === "number") {
          const comparison = aNumber < bNumber ? -1 : aNumber > bNumber ? 1 : 0;
          return sort.direction === "asc" ? comparison : -comparison;
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
