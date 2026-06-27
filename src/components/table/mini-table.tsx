import { forwardRef, useMemo, useRef } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";

import { useFillEmptyRows } from "./hooks/useFillEmptyRows";
import type { TableColumn } from "./types";
import {
  getColumnAlignClasses,
  getHoverableRowClasses,
  getStripedRowClasses,
  getTableBaseClasses,
  getTableCellClassesNoTruncate,
  getTableHeaderCellClasses,
  getTableHeaderClasses,
  getTableSizeClasses,
  getTableVariantClasses,
} from "./utils";

import type { TableSize, TableVariant } from "./types";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface MiniTableProps<T>
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  data: T[];
  /** 컬럼 정의 — `TableColumn`과 동일 타입이지만 sortable/sticky 등 일부 옵션은 무시한다. */
  columns: TableColumn<T>[];
  loading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  rowHeight?: number;
  height?: number | string;
  variant?: TableVariant;
  size?: TableSize;
  /** 행 부족 시 빈 행으로 채워 컨테이너 높이 유지. @default true */
  fillEmptyRows?: boolean;
  /** 행 클릭 핸들러 — 상세 드릴다운 등. */
  onRowClick?: (row: T, index: number) => void;
  /** footer 영역 (페이지네이션 등). */
  footerSlot?: ReactNode;
  /**
   * 행의 React key 추출. 데이터가 변경되는 페이지네이션 컨텍스트에서 stale 상태 재사용을 막는다.
   * 미지정 시 index를 사용(데이터가 정적인 경우만 안전).
   */
  getRowKey?: (row: T, index: number) => string | number;
  "data-testid"?: string;
}

/**
 * MiniTable — 통계 카드/요약 카드용 단순 표.
 *
 * Table과의 차이:
 * - 헤더 DnD / 리사이즈 / grip / 컬럼 프리셋 / 정렬 없음
 * - 행 선택 / 체크박스 / 드래그 멀티선택 없음
 * - sticky 헤더 / 가상화 없음
 * - 우측 더미 컬럼 없음 — 컬럼 너비 합이 부족하면 마지막 컬럼이 잔여폭 흡수
 * - 본문 컨테이너는 `overflow-x: auto; overflow-y: hidden` 고정 — 통계 카드에서 행 수가
 *   정확히 표시되고, 가로 스크롤바가 컨테이너 높이를 깎아 의도치 않은 세로 스크롤이 생기는 걸 방지
 *
 * **사용 시 주의**: `table-layout: auto`라 컬럼 width는 콘텐츠 우선. 짧은 라벨 + 고정 데이터
 * 패턴(투자 변동 이력 등)에 적합. 컬럼별 콘텐츠 길이 편차가 큰 페이지에 재사용할 때는
 * 미리 한 번 다양한 데이터 모양으로 시각 검증.
 */
export const MiniTable = forwardRef<
  HTMLDivElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MiniTableProps<any>
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: MiniTableProps<any>, ref: React.ForwardedRef<HTMLDivElement>) => {
    const {
      data,
      columns,
      loading = false,
      isFetching = false,
      emptyMessage = "데이터가 없어요",
      rowHeight,
      height,
      variant = "default",
      size = "medium",
      fillEmptyRows = true,
      onRowClick,
      footerSlot,
      getRowKey,
      className = "",
      "data-testid": testId,
      ...restProps
    } = props;

    const tableRef = useRef<HTMLTableElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const theadRef = useRef<HTMLTableSectionElement>(null);
    const tbodyRef = useRef<HTMLTableSectionElement>(null);

    const visibleColumns = useMemo(
      () => columns.filter((col) => !col.hidden),
      [columns],
    );

    const baseClasses = getTableBaseClasses();
    const variantClasses = getTableVariantClasses(variant);
    const sizeClasses = getTableSizeClasses(size);

    const containerStyle = useMemo(() => {
      const style: React.CSSProperties = {};
      if (height) {
        style.height = typeof height === "number" ? `${height}px` : height;
      }
      return style;
    }, [height]);

    const { emptyRowCount, measuredRowHeight } = useFillEmptyRows({
      enabled: fillEmptyRows,
      containerRef: scrollContainerRef,
      theadRef,
      tbodyRef,
      excludeRowsSelector: "tr:not([data-empty-row])",
      remainingMode: "sum-real-rows",
      deps: [data, visibleColumns],
    });

    const getRowClasses = (_row: unknown, index: number) => {
      const classes: string[] = [getStripedRowClasses(index)];
      if (onRowClick) classes.push(getHoverableRowClasses());
      return classes.join(" ");
    };

    if (loading) {
      return (
        <div
          ref={ref}
          className={`flex items-center justify-center p-8 flex-1 ${className}`}
          style={containerStyle}
          data-testid={testId}
          {...restProps}
        >
          <LoadingSpinner message="데이터를 불러오는 중이에요..." className="min-h-0" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`relative flex flex-col min-h-0 gap-4 md:gap-5 xl:gap-6 ${className}`}
        style={containerStyle}
        data-testid={testId}
        {...restProps}
      >
        <div className="flex flex-1 flex-col min-h-0 gap-4 md:gap-5 xl:gap-6">
          <div className="relative flex flex-1 flex-col min-h-0">
            <div
              className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-[2px] transition-opacity duration-150 dark:bg-neutral-900/50 ${
                isFetching ? "opacity-100" : "opacity-0"
              }`}
              {...(isFetching
                ? { role: "status", "aria-live": "polite" as const }
                : { "aria-hidden": true as const })}
            >
              <LoadingSpinner message="" className="min-h-0" />
            </div>
            <div
              ref={scrollContainerRef}
              className="scrollbar-table overflow-x-auto overflow-y-hidden flex-1 bg-bg-base-secondary"
            >
              {data.length === 0 ? (
                <div className="flex items-center justify-center p-8 h-full">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {emptyMessage}
                  </p>
                </div>
              ) : (
                <table
                  ref={tableRef}
                  // table-fixed는 base에 박혀있어 inline style만으론 못 이김 → 명시 클래스로 override.
                  className={`${baseClasses} ${variantClasses} ${sizeClasses} !table-auto`}
                  style={{ minWidth: "100%" }}
                >
                  <colgroup>
                    {visibleColumns.map((column, idx) => {
                      // 마지막 컬럼은 width 미지정 → 잔여폭 흡수 (table-layout: fixed 기준).
                      const isLast = idx === visibleColumns.length - 1;
                      return (
                        <col
                          key={column.key}
                          data-col-key={column.key}
                          style={
                            isLast
                              ? undefined
                              : column.width
                                ? {
                                    width:
                                      typeof column.width === "number"
                                        ? `${column.width}px`
                                        : column.width,
                                  }
                                : undefined
                          }
                        />
                      );
                    })}
                  </colgroup>
                  <thead ref={theadRef} className={getTableHeaderClasses()}>
                    <tr>
                      {visibleColumns.map((column) => (
                        <th
                          key={column.key}
                          className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses(column.align ?? "center")} ${
                            column.hideOnMobile ? "hidden md:table-cell" : ""
                          }`}
                          style={{
                            ...(column.minWidth
                              ? { minWidth: `${column.minWidth}px` }
                              : { minWidth: 50 }),
                          }}
                        >
                          <div className="flex items-center justify-center w-full px-1 select-none">
                            <span>{column.header}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody ref={tbodyRef}>
                    {data.map((row, index) => (
                      <tr
                        key={getRowKey ? getRowKey(row, index) : index}
                        className={getRowClasses(row, index)}
                        onClick={() => onRowClick?.(row, index)}
                        style={rowHeight ? { height: `${rowHeight}px` } : undefined}
                      >
                        {visibleColumns.map((column) => {
                          const cellContent = column.accessor
                            ? column.accessor(row)
                            : ((row as Record<string, unknown>)[column.key] as ReactNode);
                          return (
                            <td
                              key={column.key}
                              // 잘림 없이 가로 스크롤로 다 보여주는 게 통계 카드 의도.
                              className={`${getTableCellClassesNoTruncate()} ${getColumnAlignClasses(column.align ?? "left")} ${
                                column.hideOnMobile ? "hidden md:table-cell" : ""
                              }`}
                              style={
                                rowHeight
                                  ? {
                                      height: `${rowHeight}px`,
                                      maxHeight: `${rowHeight}px`,
                                    }
                                  : undefined
                              }
                            >
                              {cellContent as ReactNode}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {fillEmptyRows &&
                      Array.from({ length: emptyRowCount }).map((_, i) => {
                        const stripeIndex = data.length + i;
                        const fillerHeight =
                          rowHeight ?? measuredRowHeight ?? undefined;
                        return (
                          <tr
                            key={`empty-${i}`}
                            data-empty-row
                            aria-hidden="true"
                            className={getStripedRowClasses(stripeIndex)}
                            style={
                              fillerHeight
                                ? { height: `${fillerHeight}px` }
                                : undefined
                            }
                          >
                            {visibleColumns.map((column) => (
                              <td
                                key={column.key}
                                className={`${getTableCellClassesNoTruncate()} ${
                                  column.hideOnMobile
                                    ? "hidden md:table-cell"
                                    : ""
                                }`}
                                style={
                                  fillerHeight
                                    ? { height: `${fillerHeight}px` }
                                    : undefined
                                }
                              />
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {footerSlot}
        </div>
      </div>
    );
  },
) as <T>(
  props: MiniTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

(MiniTable as unknown as { displayName: string }).displayName = "MiniTable";
