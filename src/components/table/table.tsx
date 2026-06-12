import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { forwardRef, useMemo, useRef } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { TableCheckbox } from "@/components/table-checkbox";

import {
  applyColumnState,
  buildColumnSlots,
  flattenLeafColumns,
  hasGroupSlot,
} from "./column-group-utils";
import { SortableHeaderCell } from "./components/SortableHeaderCell";
import { useColumnResize } from "./hooks/useColumnResize";
import { useFillEmptyRows } from "./hooks/useFillEmptyRows";
import { useTableDragSelection } from "./hooks/useTableDragSelection";
import { useTableSort } from "./hooks/useTableSort";
import type { TableColumn, TableProps } from "./types";
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

/**
 * 헤더 리오더 드래그 제한 modifier.
 *
 * useSortable이 드래그 중인 <th>에 transform: translate를 거는데, 헤더를 가로 스크롤
 * 컨테이너 밖(특히 오른쪽 빈 영역)으로 끌면 transform된 셀이 테이블 scrollWidth를
 * 무한정 늘려 가로 스크롤이 끝없이 확장된다. 그래서 (1) 세로 이동 제거, (2) 가로
 * 이동을 드래그 시작 시점의 컨테이너 가시 영역 안으로 clamp 해서 셀이 컨테이너를
 * 벗어나지 못하게 막는다. @dnd-kit/modifiers 미설치라 직접 구현.
 */
const restrictHeaderDrag: Modifier = ({
  transform,
  draggingNodeRect,
  containerNodeRect,
}) => {
  // 세로 고정.
  const next = { ...transform, y: 0 };
  if (!draggingNodeRect || !containerNodeRect) return next;

  // 드래그 중인 셀이 컨테이너 좌/우 경계를 넘지 않도록 x를 clamp.
  const minX = containerNodeRect.left - draggingNodeRect.left;
  const maxX = containerNodeRect.right - draggingNodeRect.right;
  next.x = Math.min(Math.max(next.x, minX), maxX);
  return next;
};

/**
 * Table — 코어 테이블. 헤더(정렬/리사이즈/grip 드래그) + 본문(스트라이프/선택/sticky) + 컬럼 프리셋.
 *
 * 페이지네이션이 없는 조회 API 또는 페이지네이션 영역을 별도로 렌더하는 경우 사용.
 * PaginatedTable은 이 컴포넌트를 wrap해서 footer(Pagination/PageJump/PageSize)를 추가.
 */
// forwardRef가 제네릭 인자를 그대로 보존하지 못해서 `any`로 우회 후 아래에서 제네릭 시그니처로 cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Table = forwardRef<HTMLDivElement, TableProps<any>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: TableProps<any>, ref: React.ForwardedRef<HTMLDivElement>) => {
    const {
      data,
      columns,
      columnGroups,
      rowHeight,
      loading = false,
      isFetching = false,
      emptyMessage = "데이터가 없어요",
      onRowClick,
      selectedRows = [],
      onRowSelect,
      enableRowSelection = false,
      enableSelectAll = false,
      rowCompare,
      getRowId,
      enableSorting = false,
      serverSideSorting = false,
      onSortChange,
      initialSort,
      variant = "default",
      size = "medium",
      stickyHeader = true,
      height,
      maxHeight,
      storageKey,
      columnState,
      fillEmptyRows = true,
      totalElements,
      footerSlot,
      className = "",
      "data-testid": testId,
      ...restProps
    } = props;

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

    const columnStateEnabled = Boolean(columnState);

    const dragSensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    // 그룹 메타가 있으면 슬롯 단위 표현으로 묶고, 없으면 단일 컬럼 = 슬롯 1:1.
    // columnOrder/hiddenColumns가 다루는 키는 슬롯 키(그룹키 또는 컬럼키).
    const allSlots = useMemo(
      () => buildColumnSlots(columns, columnGroups),
      [columns, columnGroups],
    );

    const visibleSlots = useMemo(() => {
      if (!columnState) {
        return allSlots.filter(
          (s) => !(s.kind === "column" && s.leafColumns[0].hidden),
        );
      }
      const hidden = new Set(columnState.hiddenColumns);
      return applyColumnState(allSlots, columnState.columnOrder, hidden);
    }, [allSlots, columnState]);

    const visibleColumns = useMemo(
      () => flattenLeafColumns(visibleSlots),
      [visibleSlots],
    );

    const hasGroup = useMemo(() => hasGroupSlot(visibleSlots), [visibleSlots]);

    // 슬롯 키 → 슬롯 매핑 (DnD overColumn 검사에 사용).
    const slotMap = useMemo(
      () => new Map(allSlots.map((s) => [s.key, s])),
      [allSlots],
    );

    const handleHeaderDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!columnState || !over || active.id === over.id) {
        return;
      }
      // 시스템 컬럼은 드롭 타겟이 될 수 없다. (위치 고정 — 다른 컬럼이 자기 자리에 끼어들지 못함)
      // 그룹 슬롯은 항상 드롭 가능 (excludeFromPreset 개념 없음).
      const overSlot = slotMap.get(String(over.id));
      if (
        overSlot?.kind === "column" &&
        overSlot.leafColumns[0].excludeFromPreset
      ) {
        return;
      }
      const order = columnState.columnOrder;
      const fromIndex = order.indexOf(String(active.id));
      const toIndex = order.indexOf(String(over.id));
      if (fromIndex === -1 || toIndex === -1) {
        return;
      }
      columnState.onColumnOrderChange(arrayMove(order, fromIndex, toIndex));
    };

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
      // columnState 사용 페이지: 너비를 외부 store와 동기화. 미사용 페이지: 종전대로 storageKey에 단일 저장.
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

    // 테이블 총 너비 = 모든 컬럼 width(px) 합 (+ 선택 컬럼 48px).
    // table-layout:fixed에서 width:100%로 두면, col 합이 컨테이너를 넘을 때 테이블이
    // 자기 width(100%=컨테이너)와 충돌하며 가로 스크롤이 무한 확장된다(특히 width:100%
    // spacer col이 있으면 재귀적으로 폭주). 테이블 width를 컬럼 합 px로 못박으면
    // 테이블이 자기 col 합과 같아져 충돌이 사라진다. 합이 컨테이너보다 작을 땐
    // minWidth:100%가 컨테이너까지 늘려 우측 여백을 자동으로 채운다.
    const selectColWidth =
      enableRowSelection && enableSelectAll ? 48 : 0;
    const totalColumnsWidth = useMemo(() => {
      const sum = visibleColumns.reduce((acc, column) => {
        const w = getColumnWidth(column.key, column.width);
        const px = parseFloat(w);
        return acc + (Number.isFinite(px) ? px : 0);
      }, 0);
      return sum + selectColWidth;
    }, [visibleColumns, getColumnWidth, selectColWidth]);

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

    const { emptyRowCount, measuredRowHeight } = useFillEmptyRows({
      enabled: fillEmptyRows,
      containerRef: scrollContainerRef,
      theadRef,
      tbodyRef,
      excludeRowsSelector: "tr:not([data-empty-row])",
      remainingMode: "sum-real-rows",
      deps: [displayData, visibleColumns],
    });

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

    // 드래그 다중 선택은 안정 식별자(getRowId)가 있을 때만 활성 — 인덱스 기반은 데이터 변경에 취약.
    // getRowId가 없으면 클릭 단건 선택만 동작 (드래그 hook은 no-op, 체크박스는 자체 onChange로 폴백).
    const dragSelectionEnabled =
      enableRowSelection && !!onRowSelect && !!getRowId;
    const dragSelection = useTableDragSelection({
      rows: displayData,
      getRowId: getRowId ?? (() => -1),
      isSelected: (row) => isRowSelected(row),
      setSelected: (row, next) => onRowSelect?.(row, next),
      enabled: dragSelectionEnabled,
      scrollContainerRef,
    });

    const getRowClasses = (row: unknown, index: number) => {
      const classes: string[] = [getStripedRowClasses(index)];
      if (isRowSelected(row)) classes.push(getSelectedRowClasses());
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
        <div
          ref={measureRef}
          className="absolute invisible whitespace-nowrap"
          style={{ top: "-9999px", left: "-9999px" }}
        />

        <div className="flex flex-1 flex-col min-h-0 gap-4 md:gap-5 xl:gap-6">
          {/* overlay와 scroll-container를 한 relative wrapper로 묶어 overlay의 inset-0가 footer를 포함하지 않게 분리. */}
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
              className="scrollbar-table overflow-auto flex-1 bg-[#f9fafb] dark:bg-slate-900/50"
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
                modifiers={[restrictHeaderDrag]}
              >
              <table
                ref={tableRef}
                className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
                style={{
                  tableLayout: "fixed",
                  minWidth: "100%",
                  width: `${totalColumnsWidth}px`,
                }}
              >
                <colgroup>
                  {enableRowSelection && enableSelectAll && (
                    <col style={{ width: "48px" }} />
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
                </colgroup>
                <thead
                  ref={theadRef}
                  className={getTableHeaderClasses()}
                  style={{
                    position: stickyHeader ? "sticky" : "relative",
                    top: stickyHeader ? 0 : undefined,
                    zIndex: stickyHeader ? 10 : undefined,
                    // 배경은 getTableHeaderClasses()의 bg-bg-base-secondary 토큰을 그대로 쓴다.
                    // 과거 여기에 "white"를 하드코딩해, 다크모드에서 헤더 드래그로 셀이 자리를
                    // 비우면 흰 배경이 드러나는 버그가 있었다.
                  }}
                >
                  <tr>
                    {enableRowSelection && enableSelectAll && (
                      <th
                        rowSpan={hasGroup ? 2 : 1}
                        className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses("center")} w-12 px-0`}
                      >
                        <div className="flex items-center justify-center">
                          <TableCheckbox
                            checked={isAllSelected}
                            onChange={() => handleSelectAll()}
                            ariaLabel="전체 선택"
                          />
                        </div>
                      </th>
                    )}
                    <SortableContext
                      items={visibleSlots.map((s) => s.key)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {visibleSlots.map((slot) => {
                        // 그룹 슬롯 — 상단 row에 그룹 헤더(colSpan = 하위 컬럼 수).
                        // 그룹 자체는 항상 드래그 가능 (시스템 컬럼 개념 없음).
                        if (slot.kind === "group") {
                          return (
                            <SortableHeaderCell
                              key={slot.key}
                              id={slot.key}
                              disabled={!columnStateEnabled}
                              as="th"
                              colSpan={slot.leafColumns.length}
                              className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses("center")} group/header-cell ${slot.hideOnMobile ? "hidden md:table-cell" : ""} relative`}
                            >
                              {columnStateEnabled && (
                                <span
                                  className="absolute left-0.5 top-1/2 -translate-y-1/2 text-text-tertiary opacity-0 transition-opacity group-hover/header-cell:opacity-100"
                                  aria-hidden="true"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <div className="flex items-center justify-center w-full pr-1 pl-3 select-none">
                                <span>{slot.header}</span>
                              </div>
                            </SortableHeaderCell>
                          );
                        }
                        // 단일 컬럼 슬롯 — 기존 헤더 셀과 동일. hasGroup일 때만 rowSpan=2.
                        const column = slot.leafColumns[0];
                        const dragDisabled =
                          !columnStateEnabled ||
                          column.excludeFromPreset === true;
                        return (
                          <SortableHeaderCell
                            key={column.key}
                            id={column.key}
                            disabled={dragDisabled}
                            as="th"
                            rowSpan={hasGroup ? 2 : 1}
                            className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses("center")} group/header-cell ${
                              column.sticky
                                ? "sticky left-0 z-20 bg-bg-base-secondary"
                                : ""
                            } ${column.hideOnMobile ? "hidden md:table-cell" : ""} relative`}
                            style={{
                              width: getColumnWidth(column.key, column.width),
                              minWidth: column.minWidth || 50,
                            }}
                          >
                            {!dragDisabled && (
                              <span
                                className="absolute left-0.5 top-1/2 -translate-y-1/2 text-text-tertiary opacity-0 transition-opacity group-hover/header-cell:opacity-100"
                                aria-hidden="true"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <div className="flex items-center justify-center w-full pr-1 pl-3 select-none">
                              <span>{column.header}</span>
                            </div>
                            {/* 시스템 컬럼은 프리셋 셀렉터에 노출되지 않고 위치도 고정이라
                                너비만 조절 가능하면 일관성이 깨진다. 리사이즈 핸들 자체를 숨긴다. */}
                            {column.excludeFromPreset !== true && (
                              <div
                                className="group/resize absolute right-0 top-0 h-full w-3 cursor-col-resize z-50 flex items-center justify-center"
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
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-1/2 w-0.5 rounded-full bg-transparent transition-colors group-hover/header-cell:bg-text-tertiary group-hover/resize:!bg-primary-500 group-active/resize:!bg-primary-600"
                                />
                              </div>
                            )}
                          </SortableHeaderCell>
                        );
                      })}
                    </SortableContext>
                  </tr>
                  {hasGroup && (
                    <tr>
                      {visibleSlots
                        .filter((s) => s.kind === "group")
                        .flatMap((s) => s.leafColumns)
                        .map((column) => (
                          <th
                            key={column.key}
                            className={`${getTableHeaderCellClasses()} ${getColumnAlignClasses(column.align ?? "center")} ${
                              column.hideOnMobile ? "hidden md:table-cell" : ""
                            }`}
                            style={{
                              width: getColumnWidth(column.key, column.width),
                              minWidth: column.minWidth || 50,
                            }}
                          >
                            <div className="flex items-center justify-center w-full pr-1 pl-3 select-none">
                              <span>{column.header}</span>
                            </div>
                          </th>
                        ))}
                    </tr>
                  )}
                </thead>
                <tbody ref={tbodyRef}>
                  {displayData.map((row, index) => {
                    const isSelected = isRowSelected(row);
                    return (
                      <tr
                        key={index}
                        className={getRowClasses(row, index)}
                        onClick={() => onRowClick?.(row, index)}
                        style={rowHeight ? { height: `${rowHeight}px` } : undefined}
                      >
                        {enableRowSelection && enableSelectAll && (
                          <td
                            className={`${getTableCellClasses()} ${getColumnAlignClasses("center")} w-12 select-none`}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={
                              dragSelectionEnabled
                                ? (e) => {
                                    e.preventDefault();
                                    dragSelection.onRowMouseDown(index);
                                  }
                                : undefined
                            }
                            onMouseEnter={
                              dragSelectionEnabled
                                ? () => dragSelection.onRowMouseEnter(index)
                                : undefined
                            }
                          >
                            <div className="flex items-center justify-center">
                              <TableCheckbox
                                checked={isSelected}
                                onChange={(checked) =>
                                  onRowSelect?.(row, checked)
                                }
                                pointerEventsNone={dragSelectionEnabled}
                                ariaLabel="행 선택"
                              />
                            </div>
                          </td>
                        )}
                        {visibleColumns.map((column) => {
                          const cellContent = column.accessor
                            ? column.accessor(row)
                            : (row as Record<string, unknown>)[column.key];

                          return (
                            <td
                              key={column.key}
                              className={`${getTableCellClasses()} ${getColumnAlignClasses(column.align)} ${
                                column.sticky ? "sticky left-0 z-10 bg-inherit" : ""
                              } ${
                                column.hideOnMobile ? "hidden md:table-cell" : ""
                              }`}
                              style={{
                                width: getColumnWidth(column.key, column.width),
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
                      </tr>
                    );
                  })}
                  {fillEmptyRows &&
                    Array.from({ length: emptyRowCount }).map((_, i) => {
                      const stripeIndex = displayData.length + i;
                      const fillerHeight = rowHeight ?? measuredRowHeight ?? undefined;
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
                              className={`${getTableCellClasses()} w-12`}
                              style={
                                fillerHeight ? { height: `${fillerHeight}px` } : undefined
                              }
                            />
                          )}
                          {visibleColumns.map((column) => {
                            return (
                              <td
                                key={column.key}
                                className={`${getTableCellClasses()} ${column.hideOnMobile ? "hidden md:table-cell" : ""}`}
                                style={{
                                  width: getColumnWidth(column.key, column.width),
                                  minWidth: column.minWidth || 50,
                                  ...(fillerHeight ? { height: `${fillerHeight}px` } : {}),
                                }}
                              />
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              </DndContext>
            )}
            </div>
          </div>

          {footerSlot ??
            (totalElements !== undefined ? (
              <div className="flex justify-end shrink-0 text-sm text-neutral-600 dark:text-neutral-300">
                <span>총 {totalElements.toLocaleString()}건</span>
              </div>
            ) : null)}
        </div>
      </div>
    );
  },
) as <T>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

(Table as unknown as { displayName: string }).displayName = "Table";
