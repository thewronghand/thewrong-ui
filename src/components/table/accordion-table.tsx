import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ChevronRight } from "lucide-react";
import {
  Fragment,
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Checkbox } from "@/components/checkbox";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Select } from "@/components/select";

import { KeyboardNavButton } from "./components/KeyboardNavButton";
import { PageJumpInput } from "./components/PageJumpInput";
import { Pagination } from "./components/Pagination";
import { SortableHeaderCell } from "./components/SortableHeaderCell";
import { useColumnResize } from "./hooks/useColumnResize";
import { useFillEmptyRows } from "./hooks/useFillEmptyRows";
import { useTableSort } from "./hooks/useTableSort";
import type { PaginatedTableProps, TableColumn } from "./types";
import {
  getColumnAlignClasses,
  getHoverableRowClasses,
  getSelectedRowClasses,
  getStripedRowClasses,
  getTableBaseClasses,
  getTableCellClasses,
  getTableHeaderCellClasses,
  getTableHeaderClasses,
  getTableSizeClasses,
  getTableVariantClasses,
} from "./utils";

const DEFAULT_PAGE_SIZES: number[] = [30, 50, 100];
const TOGGLE_COL_WIDTH = 36;

export type ExpandedRowId = string | number;

export interface AccordionExpandable<T> {
  /** 펼친 행 안에 그릴 콘텐츠 */
  renderRow: (row: T) => ReactNode;
  /** 현재 펼쳐진 행 id 집합 */
  expandedIds: Set<ExpandedRowId>;
  /**
   * 토글 콜백. single/multiple 동작은 호출부에서 결정 — 컴포넌트는 단순히 행 토글 의도만 전달한다.
   * - multiple: `setExpanded(prev => prev.has(id) ? new Set([...prev].filter(x => x !== id)) : new Set([...prev, id]))`
   * - single: `setExpanded(prev => prev.has(id) ? new Set() : new Set([id]))`
   */
  onToggle: (id: ExpandedRowId) => void;
  /** 행 → 안정 식별자 */
  getRowId: (row: T) => ExpandedRowId;
  /**
   * 펼침 콘텐츠가 가로스크롤에 따라 좌측에 sticky 하게 따라오게 할지 여부.
   * @default true
   */
  stickyDetail?: boolean;
}

export interface AccordionTableProps<T> extends PaginatedTableProps<T> {
  /**
   * 행 펼침 설정. 미지정 시 PaginatedTable과 동일하게 동작 (토글 컬럼/펼침 행 없음).
   */
  expandable?: AccordionExpandable<T>;
}

// PaginatedTable과 동일한 forwardRef + 제네릭 우회 패턴.
// React forwardRef는 제네릭 타입을 보존하지 못해 본문에서는 any로 받고 외부 export 시
// 제네릭 시그니처(파일 끝 `as <T>(...)` cast)로 다시 잡는다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AccordionTable = forwardRef<
  HTMLDivElement,
  AccordionTableProps<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>((props: AccordionTableProps<any>, ref: React.ForwardedRef<HTMLDivElement>) => {
  const {
    data,
    columns,
    rowHeight,
    loading = false,
    emptyMessage = "데이터가 없어요",
    onRowClick,
    selectedRows = [],
    onRowSelect,
    enableRowSelection = false,
    enableSelectAll = false,
    rowCompare,
    enableSorting = false,
    serverSideSorting = false,
    onSortChange,
    initialSort,
    variant = "default",
    size = "medium",
    stickyHeader = true,
    height,
    maxHeight,
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    pageSizeOptions = DEFAULT_PAGE_SIZES,
    onPageSizeChange,
    totalElements,
    storageKey,
    columnState,
    fillEmptyRows = true,
    enableKeyboardPagination = true,
    expandable,
    className = "",
    "data-testid": testId,
    ...restProps
  } = props;

  const expandableEnabled = Boolean(expandable);
  const stickyDetail = expandable?.stickyDetail ?? true;

  const { sort, sortedData } = useTableSort({
    initialSort,
    serverSide: serverSideSorting,
    onSort: onSortChange || undefined,
  });

  const displayData = useMemo(() => {
    if (!enableSorting || serverSideSorting) {
      return data;
    }
    return sortedData(data, (row, key) => {
      const column = columns.find((col) => col.key === key);
      if (column?.accessor) {
        const accessorResult = column.accessor(row);
        if (
          typeof accessorResult === "string" ||
          typeof accessorResult === "number"
        ) {
          return accessorResult;
        }
        return (row as Record<string, unknown>)[key];
      }
      return (row as Record<string, unknown>)[key];
    });
  }, [data, enableSorting, serverSideSorting, sort, sortedData, columns]);

  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollContainerWidth, setScrollContainerWidth] = useState(0);

  const columnStateEnabled = Boolean(columnState);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleHeaderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!columnState || !over || active.id === over.id) {
      return;
    }
    // 시스템 컬럼은 드롭 타겟이 될 수 없다.
    const overColumn = columns.find((col) => col.key === over.id);
    if (overColumn?.excludeFromPreset) return;
    const order = columnState.columnOrder;
    const fromIndex = order.indexOf(String(active.id));
    const toIndex = order.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    columnState.onColumnOrderChange(arrayMove(order, fromIndex, toIndex));
  };

  const visibleColumns = useMemo(() => {
    if (!columnState) {
      return columns.filter((col) => !col.hidden);
    }

    const columnMap = new Map(columns.map((col) => [col.key, col]));
    const hiddenSet = new Set(columnState.hiddenColumns);

    const ordered = columnState.columnOrder
      .map((key: string) => columnMap.get(key))
      .filter((col): col is TableColumn<unknown> => Boolean(col))
      .filter(
        (col: TableColumn<unknown>) => !col.hidden && !hiddenSet.has(col.key),
      );

    return ordered;
  }, [columns, columnState]);

  const {
    handleMouseDown: handleResizeMouseDown,
    handleDoubleClick: handleResizeDoubleClick,
    getColumnWidth,
    measureRef,
  } = useColumnResize({
    columns: visibleColumns,
    data: displayData,
    getCellContent: (row, key) => {
      const column = visibleColumns.find(
        (col: TableColumn<unknown>) => col.key === key,
      );
      return column?.accessor
        ? column.accessor(row)
        : ((row as Record<string, unknown>)[key] as React.ReactNode);
    },
    tableRef,
    ...(columnState
      ? {
          controlledWidths: columnState.columnWidths,
          onColumnWidthsChange: columnState.onColumnWidthsChange,
        }
      : { storageKey }),
  });

  const baseClasses = getTableBaseClasses();
  const variantClasses = getTableVariantClasses(variant);
  const sizeClasses = getTableSizeClasses(size);

  const containerStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (height) {
      style.height = typeof height === "number" ? `${height}px` : height;
    }
    if (maxHeight) {
      style.maxHeight =
        typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
    }
    return style;
  }, [height, maxHeight]);

  // 펼친 행은 측정에서 제외해 평균 행 높이가 흔들리지 않게 한다.
  // 잔여 공간은 tbody 전체 높이를 빼서 펼친 행도 반영한다.
  // 펼침 토글로 인한 tbody 높이 변화는 observeTbody=true의 ResizeObserver가 잡아주므로
  // expandedIds는 effect deps에 넣지 않는다 (재구독 중복 회피).
  const { emptyRowCount, measuredRowHeight } = useFillEmptyRows({
    enabled: fillEmptyRows,
    containerRef: scrollContainerRef,
    theadRef,
    tbodyRef,
    excludeRowsSelector: "tr:not([data-empty-row]):not([data-expanded-row])",
    remainingMode: "tbody-height",
    observeTbody: true,
    deps: [displayData, visibleColumns],
  });

  // sticky 디테일 패널은 컨테이너 클라이언트 폭 기준으로 그려야 가로스크롤 시 viewport에 고정된다.
  useLayoutEffect(() => {
    if (!stickyDetail || !expandableEnabled) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const measure = () => {
      setScrollContainerWidth((prev) =>
        prev === container.clientWidth ? prev : container.clientWidth,
      );
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [stickyDetail, expandableEnabled]);

  const handlePaginationKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.key === "ArrowLeft" && currentPage > 1) {
      e.preventDefault();
      onPageChange(currentPage - 1);
    } else if (e.key === "ArrowRight" && currentPage < totalPages) {
      e.preventDefault();
      onPageChange(currentPage + 1);
    }
  };

  const isRowSelected = (row: unknown) => {
    if (!enableRowSelection || selectedRows.length === 0) {
      return false;
    }
    if (rowCompare) {
      return selectedRows.some((selectedRow) => rowCompare(selectedRow, row));
    }
    return selectedRows.some((selectedRow) => selectedRow === row);
  };

  const isAllSelected = useMemo(() => {
    if (!enableRowSelection || !enableSelectAll || displayData.length === 0) {
      return false;
    }
    return displayData.every((row) => isRowSelected(row));
  }, [enableRowSelection, enableSelectAll, displayData, isRowSelected]);

  const handleSelectAll = () => {
    if (!enableRowSelection || !onRowSelect) return;
    if (isAllSelected) {
      displayData.forEach((row) => {
        if (isRowSelected(row)) {
          onRowSelect(row, false);
        }
      });
    } else {
      displayData.forEach((row) => {
        if (!isRowSelected(row)) {
          onRowSelect(row, true);
        }
      });
    }
  };

  const getRowClasses = (row: unknown, index: number) => {
    const classes: string[] = [getStripedRowClasses(index)];
    if (isRowSelected(row)) classes.push(getSelectedRowClasses());
    if (onRowClick || expandableEnabled) classes.push(getHoverableRowClasses());
    return classes.join(" ");
  };

  const showFooter =
    Boolean(onPageSizeChange) ||
    totalElements !== undefined ||
    (typeof totalPages === "number" && totalPages > 0);

  const handleRowToggle = (row: unknown) => {
    if (!expandable) return;
    expandable.onToggle(expandable.getRowId(row));
  };

  const handleRowKeyDown = (
    e: KeyboardEvent<HTMLTableRowElement>,
    row: unknown,
  ) => {
    if (!expandableEnabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleRowToggle(row);
    }
  };

  const expandedColSpan =
    (enableRowSelection && enableSelectAll ? 1 : 0) +
    (expandableEnabled ? 1 : 0) +
    visibleColumns.length +
    1; // 우측 더미 col

  if (loading) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center p-8 flex-1 ${className}`}
        style={containerStyle}
        data-testid={testId}
        {...restProps}
      >
        <LoadingSpinner
          message="데이터를 불러오는 중이에요..."
          className="min-h-0"
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative flex flex-col min-h-0 ${className}`}
      style={containerStyle}
      data-testid={testId}
      {...restProps}
    >
      <div
        ref={measureRef}
        className="absolute invisible whitespace-nowrap"
        style={{ top: "-9999px", left: "-9999px" }}
      />

      <div className="flex flex-1 flex-col min-h-0">
        <div
          ref={scrollContainerRef}
          className="overflow-auto flex-1 bg-[#f9fafb] dark:bg-slate-900/50"
        >
          {displayData.length === 0 ? (
            <div className="flex items-center justify-center p-8 h-full">
              <p className="text-neutral-600 dark:text-neutral-400">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleHeaderDragEnd}
            >
              <table
                ref={tableRef}
                className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
                style={{ tableLayout: "fixed", minWidth: "100%", width: "100%" }}
              >
                <colgroup>
                  {enableRowSelection && enableSelectAll && (
                    <col style={{ width: "48px" }} />
                  )}
                  {expandableEnabled && (
                    <col style={{ width: `${TOGGLE_COL_WIDTH}px` }} />
                  )}
                  {visibleColumns.map((column) => (
                    <col
                      key={column.key}
                      data-col-key={column.key}
                      style={{
                        width: getColumnWidth(column.key, column.width),
                      }}
                    />
                  ))}
                  <col style={{ width: "100%" }} />
                </colgroup>
                <thead
                  ref={theadRef}
                  className={getTableHeaderClasses()}
                  style={{
                    position: stickyHeader ? "sticky" : "relative",
                    top: stickyHeader ? 0 : undefined,
                    zIndex: stickyHeader ? 10 : undefined,
                    backgroundColor: stickyHeader ? "white" : undefined,
                  }}
                >
                  <tr>
                    {enableRowSelection && enableSelectAll && (
                      <th
                        className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses("center")} border-r-0 w-12`}
                      >
                        <Checkbox.Circle
                          id="accordion-table-select-all"
                          size={20}
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                    )}
                    {expandableEnabled && (
                      <th
                        aria-hidden="true"
                        className={`${getTableHeaderCellClasses()} border-r-0`}
                        style={{ width: `${TOGGLE_COL_WIDTH}px` }}
                      />
                    )}
                    <SortableContext
                      items={visibleColumns.map((c) => c.key)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {visibleColumns.map((column) => {
                        const dragDisabled =
                          !columnStateEnabled || column.excludeFromPreset === true;
                        return (
                          <SortableHeaderCell
                            key={column.key}
                            id={column.key}
                            disabled={dragDisabled}
                            as="th"
                            className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses("center")} bg-white ${
                              column.sticky
                                ? "sticky left-0 z-20 bg-white dark:bg-neutral-800"
                                : ""
                            } ${column.hideOnMobile ? "hidden md:table-cell" : ""} relative`}
                            style={{
                              width: getColumnWidth(column.key, column.width),
                              minWidth: column.minWidth || 50,
                            }}
                          >
                            <div className="flex items-center justify-center w-full pr-1 select-none">
                              <span>{column.header}</span>
                            </div>
                            {/* 시스템 컬럼은 위치 고정 + 프리셋 셀렉터 비노출 — 리사이즈도 막아 일관성 유지. */}
                            {column.excludeFromPreset !== true && (
                              <div
                                className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary-500/30 active:bg-primary-500/50 z-50"
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleResizeMouseDown(column.key, e);
                                }}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleResizeDoubleClick(column.key, e);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                style={{ touchAction: "none" }}
                                title="드래그하여 너비 조절, 더블 클릭하여 자동 조절"
                              />
                            )}
                          </SortableHeaderCell>
                        );
                      })}
                    </SortableContext>
                    <th
                      aria-hidden="true"
                      className="bg-white border-b border-l border-[#f2f3f5] dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </tr>
                </thead>
                <tbody ref={tbodyRef}>
                  {displayData.map((row, index) => {
                    const isSelected = isRowSelected(row);
                    const rowId = expandable
                      ? expandable.getRowId(row)
                      : undefined;
                    const isExpanded = expandable
                      ? expandable.expandedIds.has(rowId as ExpandedRowId)
                      : false;

                    return (
                      <Fragment key={index}>
                        <tr
                          className={getRowClasses(row, index)}
                          onClick={(e) => {
                            // 셀 안의 인터랙티브 자식(button/a/input/select/textarea/label) 클릭은
                            // 자기 핸들러만 발화하고 행 토글은 유발하지 않게 가드. 컬럼별 stopPropagation
                            // 누락에 대비한 컴포넌트 레벨 안전망.
                            // 단, currentTarget(tr 자기 자신)에 `role="button"`이 있어 그 자체가
                            // 인터랙티브로 잡히는 경우는 제외. 자식 안에서만 검사.
                            const target = e.target as HTMLElement;
                            if (target !== e.currentTarget) {
                              const interactive = target.closest(
                                "button, a, input, select, textarea, label",
                              );
                              if (interactive && e.currentTarget.contains(interactive)) {
                                return;
                              }
                            }
                            onRowClick?.(row, index);
                            if (expandableEnabled) handleRowToggle(row);
                          }}
                          onKeyDown={(e) => handleRowKeyDown(e, row)}
                          tabIndex={expandableEnabled ? 0 : undefined}
                          role={expandableEnabled ? "button" : undefined}
                          aria-expanded={
                            expandableEnabled ? isExpanded : undefined
                          }
                          style={
                            rowHeight ? { height: `${rowHeight}px` } : undefined
                          }
                        >
                          {enableRowSelection && enableSelectAll && (
                            <td
                              className={`${getTableCellClasses()} ${getColumnAlignClasses("center")} border-r-0 w-12`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox.Circle
                                size={20}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  onRowSelect?.(row, checked)
                                }
                              />
                            </td>
                          )}
                          {expandableEnabled && (
                            <td
                              className={`${getTableCellClasses()} ${getColumnAlignClasses("center")} border-r-0`}
                              style={{ width: `${TOGGLE_COL_WIDTH}px` }}
                            >
                              <ChevronRight
                                aria-hidden="true"
                                className={`mx-auto h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </td>
                          )}
                          {visibleColumns.map((column, colIndex) => {
                            const cellContent = column.accessor
                              ? column.accessor(row)
                              : (row as Record<string, unknown>)[column.key];
                            const isLastColumn =
                              colIndex === visibleColumns.length - 1 &&
                              !enableRowSelection;

                            return (
                              <td
                                key={column.key}
                                className={`${getTableCellClasses()} ${getColumnAlignClasses(column.align)} ${
                                  isLastColumn ? "border-r-0" : ""
                                } ${column.sticky ? "sticky left-0 z-10 bg-inherit" : ""} ${
                                  column.hideOnMobile
                                    ? "hidden md:table-cell"
                                    : ""
                                }`}
                                style={{
                                  width: getColumnWidth(
                                    column.key,
                                    column.width,
                                  ),
                                  minWidth: column.minWidth || 50,
                                  ...(rowHeight
                                    ? {
                                        height: `${rowHeight}px`,
                                        maxHeight: `${rowHeight}px`,
                                        overflow: "hidden",
                                      }
                                    : {}),
                                }}
                              >
                                {cellContent as React.ReactNode}
                              </td>
                            );
                          })}
                          <td
                            aria-hidden="true"
                            className="border-b border-l border-[#f2f3f5] dark:border-neutral-700 bg-transparent"
                          />
                        </tr>
                        {expandableEnabled && (
                          <tr
                            data-expanded-row
                            className="bg-[#f9fafb] dark:bg-slate-900/50"
                          >
                            {/*
                              펼침 패널이 가로스크롤에 따라오려면 sticky가 overflow:hidden 안에
                              갇히면 안 된다. td 안에 width를 viewport(= scrollContainer.clientWidth)
                              로 고정한 sticky 래퍼를 두고, 그 안에서 grid 0fr↔1fr 트릭으로 펼침을
                              표현. Collapsible 컴포넌트는 inner overflow:hidden 때문에 sticky가
                              먹지 않아 우회.
                            */}
                            <td
                              colSpan={expandedColSpan}
                              className="p-0 border-b border-[#f2f3f5] dark:border-neutral-700"
                            >
                              <div
                                className={
                                  stickyDetail ? "sticky left-0" : undefined
                                }
                                style={
                                  stickyDetail && scrollContainerWidth > 0
                                    ? { width: `${scrollContainerWidth}px` }
                                    : undefined
                                }
                              >
                                <div
                                  className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
                                  style={{
                                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                                    opacity: isExpanded ? 1 : 0,
                                  }}
                                  aria-hidden={!isExpanded}
                                >
                                  <div className="overflow-hidden">
                                    {expandable!.renderRow(row)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {fillEmptyRows &&
                    Array.from({ length: emptyRowCount }).map((_, i) => {
                      const stripeIndex = displayData.length + i;
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
                          {enableRowSelection && enableSelectAll && (
                            <td
                              className={`${getTableCellClasses()} border-r-0 w-12`}
                              style={
                                fillerHeight
                                  ? { height: `${fillerHeight}px` }
                                  : undefined
                              }
                            />
                          )}
                          {expandableEnabled && (
                            <td
                              className={`${getTableCellClasses()} border-r-0`}
                              style={{
                                width: `${TOGGLE_COL_WIDTH}px`,
                                ...(fillerHeight
                                  ? { height: `${fillerHeight}px` }
                                  : {}),
                              }}
                            />
                          )}
                          {visibleColumns.map((column, colIndex) => {
                            const isLastColumn =
                              colIndex === visibleColumns.length - 1 &&
                              !enableRowSelection;
                            return (
                              <td
                                key={column.key}
                                className={`${getTableCellClasses()} ${
                                  isLastColumn ? "border-r-0" : ""
                                } ${column.hideOnMobile ? "hidden md:table-cell" : ""}`}
                                style={{
                                  width: getColumnWidth(
                                    column.key,
                                    column.width,
                                  ),
                                  minWidth: column.minWidth || 50,
                                  ...(fillerHeight
                                    ? { height: `${fillerHeight}px` }
                                    : {}),
                                }}
                              />
                            );
                          })}
                          <td
                            aria-hidden="true"
                            className="border-b border-l border-[#f2f3f5] dark:border-neutral-700 bg-transparent"
                            style={
                              fillerHeight
                                ? { height: `${fillerHeight}px` }
                                : undefined
                            }
                          />
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </DndContext>
          )}
        </div>

        {showFooter && (
          <nav
            aria-label="페이지 네비게이션"
            className="@container/pagebar group/footer flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-neutral-200 px-4 py-2 shrink-0 dark:border-neutral-700"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              {totalElements !== undefined && (
                <span>총 {totalElements.toLocaleString()}건</span>
              )}
              {onPageSizeChange && pageSize !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">페이지당</span>
                  <div className="w-20">
                    <Select
                      variant="box"
                      selectSize="mini"
                      value={String(pageSize)}
                      onChange={(value) => onPageSizeChange(Number(value))}
                      options={pageSizeOptions.map((opt) => ({
                        value: String(opt),
                        label: String(opt),
                      }))}
                      data-testid={testId ? `${testId}-page-size` : undefined}
                    />
                  </div>
                </div>
              )}
              <div className="contents @min-[640px]/pagebar:hidden">
                {totalPages !== undefined &&
                  currentPage !== undefined &&
                  onPageChange &&
                  totalPages > 1 && (
                    <>
                      <PageJumpInput
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        data-testid={
                          testId ? `${testId}-page-jump` : undefined
                        }
                      />
                      {enableKeyboardPagination && (
                        <KeyboardNavButton onKeyDown={handlePaginationKeyDown} />
                      )}
                    </>
                  )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden @min-[640px]/pagebar:contents">
                {totalPages !== undefined &&
                  currentPage !== undefined &&
                  onPageChange &&
                  totalPages > 1 && (
                    <>
                      <PageJumpInput
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        data-testid={
                          testId ? `${testId}-page-jump` : undefined
                        }
                      />
                      {enableKeyboardPagination && (
                        <KeyboardNavButton onKeyDown={handlePaginationKeyDown} />
                      )}
                    </>
                  )}
              </div>
              {totalPages !== undefined &&
                currentPage !== undefined &&
                onPageChange && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    hasPreviousPage={currentPage > 1}
                    hasNextPage={currentPage < totalPages}
                    data-testid={testId ? `${testId}-pagination` : undefined}
                  />
                )}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}) as <T>(
  props: AccordionTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

(AccordionTable as unknown as { displayName: string }).displayName =
  "AccordionTable";
