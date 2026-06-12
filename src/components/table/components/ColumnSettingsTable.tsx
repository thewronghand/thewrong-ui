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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { TableCheckbox } from "@/components/table-checkbox";

import { buildColumnSlots, type ColumnSlot } from "../column-group-utils";
import type { TableColumn, TableColumnGroupMeta } from "../types";

/** ColumnSettingsTable의 max-height. ColumnPresetSelector의 dropdown 위치 계산에 공유돼요. */
export const COLUMN_SETTINGS_DROPDOWN_MAX_HEIGHT = 500;

interface ColumnSettingsTableProps<T> {
  columns: TableColumn<T>[];
  columnGroups?: TableColumnGroupMeta[];
  columnOrder: string[];
  hiddenColumns: string[];
  /** 컬럼 키 → 픽셀 너비. 프리셋에 저장된 값. */
  columnWidths: Record<string, number>;
  num: string;
  onOrderChange: (newOrder: string[]) => void;
  onHiddenChange: (key: string, hidden: boolean) => void;
  /** 단일 컬럼 너비 갱신. 0이면 기본값 복원. */
  onSetColumnWidth?: (key: string, width: number) => void;
  onSave: () => void;
  onReset: () => void;
}

interface SortableRowProps<T> {
  slot: ColumnSlot<T>;
  index: number;
  isHidden: boolean;
  /** 저장된 너비(px). undefined면 자동 계산값/기본값. 그룹이면 무시. */
  width: number | undefined;
  onHiddenChange: (key: string, hidden: boolean) => void;
  onSetColumnWidth?: (key: string, width: number) => void;
}

function SortableRow<T>({
  slot,
  index,
  isHidden,
  width,
  onHiddenChange,
  onSetColumnWidth,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const headerLabel =
    typeof slot.header === "string" ? slot.header : slot.key;
  const isGroup = slot.kind === "group";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        border-b border-neutral-200 dark:border-neutral-700 transition-colors
        ${
          isHidden
            ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            : "bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
        }
      `}
    >
      <td
        className="w-10 px-2 py-2 text-center cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical
          size={16}
          className="text-neutral-400 dark:text-neutral-500 mx-auto"
        />
      </td>
      <td className="px-2 py-2 text-sm whitespace-nowrap">
        {headerLabel}
        {isGroup && (
          <span className="ml-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            (그룹 · {slot.leafColumns.length}개)
          </span>
        )}
      </td>
      <td className="w-14 px-2 py-2 text-center text-sm">{index + 1}</td>
      <td className="w-20 px-2 py-2 text-center text-sm tabular-nums">
        {isGroup ? (
          <span className="text-neutral-400 dark:text-neutral-500">—</span>
        ) : onSetColumnWidth ? (
          <ColumnWidthInput
            columnKey={slot.key}
            width={width}
            onSetColumnWidth={onSetColumnWidth}
          />
        ) : (
          <span className="text-neutral-500 dark:text-neutral-400">
            {width ? `${width}px` : "—"}
          </span>
        )}
      </td>
      <td className="w-14 px-2 py-2 text-center">
        {/* "숨김" 컬럼이지만 의미상 "표시" 토글 — checked=isHidden은 헛갈리니 표시 여부로 invert. */}
        <div className="flex justify-center">
          <TableCheckbox
            checked={isHidden}
            onChange={(checked) => onHiddenChange(slot.key, !checked)}
            ariaLabel={`${headerLabel} 숨김`}
          />
        </div>
      </td>
    </tr>
  );
}

interface ColumnWidthInputProps {
  columnKey: string;
  width: number | undefined;
  onSetColumnWidth: (key: string, width: number) => void;
}

/**
 * 컬럼 너비 input. 저장된 값이 없으면 placeholder만 보이고, blur/Enter 시점에 commit.
 * 빈값 또는 0이면 기본값 복원(키 제거).
 */
function ColumnWidthInput({
  columnKey,
  width,
  onSetColumnWidth,
}: ColumnWidthInputProps) {
  const [draft, setDraft] = useState<string>(width ? String(width) : "");

  // 외부에서 width가 바뀌면 draft 동기화 (헤더 드래그 직후 등)
  useEffect(() => {
    setDraft(width ? String(width) : "");
  }, [width]);

  const commit = () => {
    if (draft === "") {
      onSetColumnWidth(columnKey, 0);
      return;
    }
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0) {
      onSetColumnWidth(columnKey, 0);
      setDraft("");
      return;
    }
    onSetColumnWidth(columnKey, Math.max(20, Math.floor(n)));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      placeholder="auto"
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setDraft(width ? String(width) : "");
          (e.target as HTMLInputElement).blur();
        }
      }}
      aria-label={`${columnKey} 컬럼 너비 (px)`}
      className="w-16 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-center text-xs tabular-nums text-neutral-700 transition-colors hover:border-primary-300 focus:border-primary-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
    />
  );
}

/**
 * 컬럼 설정 드롭다운 내부의 DnD 테이블
 *
 * dnd-kit 기반의 컬럼 순서 변경 + 숨김 토글 UI예요.
 */
export function ColumnSettingsTable<T>({
  columns,
  columnGroups,
  columnOrder,
  hiddenColumns,
  columnWidths,
  num,
  onOrderChange,
  onHiddenChange,
  onSetColumnWidth,
  onSave,
  onReset,
}: ColumnSettingsTableProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 슬롯 단위 표현 — columnOrder의 키는 그룹키 또는 단일 컬럼키.
  const allSlots = buildColumnSlots(columns, columnGroups);
  const slotMap = new Map(allSlots.map((s) => [s.key, s]));

  const orderedSlots = columnOrder
    .map((key) => slotMap.get(key))
    .filter((s): s is ColumnSlot<T> => Boolean(s));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const fromIndex = columnOrder.indexOf(String(active.id));
    const toIndex = columnOrder.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    onOrderChange(arrayMove(columnOrder, fromIndex, toIndex));
  };

  return (
    <div
      className="w-full overflow-y-auto bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
      style={{ maxHeight: COLUMN_SETTINGS_DROPDOWN_MAX_HEIGHT }}
    >
      <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 font-semibold z-10 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-base">컬럼 설정</span>
        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
          프리셋 {num}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-12 z-10">
            <tr className="border-y border-neutral-200 dark:border-neutral-700 font-bold">
              <th className="w-10 px-2 py-2"></th>
              <th className="px-2 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                컬럼명
              </th>
              <th className="w-14 px-2 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-200">
                순서
              </th>
              <th className="w-20 px-2 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-200">
                너비
              </th>
              <th className="w-14 px-2 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-200">
                숨김
              </th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={columnOrder}
              strategy={verticalListSortingStrategy}
            >
              {orderedSlots.map((slot, index) => (
                <SortableRow
                  key={slot.key}
                  slot={slot as ColumnSlot<unknown>}
                  index={index}
                  isHidden={hiddenColumns.includes(slot.key)}
                  width={columnWidths[slot.key]}
                  onHiddenChange={onHiddenChange}
                  onSetColumnWidth={onSetColumnWidth}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 flex justify-end gap-2 z-10">
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 rounded text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"
        >
          <RotateCcw size={12} />
          <span className="text-xs">초기화</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-3 py-1 bg-primary-500 text-white rounded transition-colors flex items-center gap-1 hover:bg-primary-600"
        >
          <Save size={12} />
          <span className="text-xs">저장</span>
        </button>
      </div>
    </div>
  );
}
