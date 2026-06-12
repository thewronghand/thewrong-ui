import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { Settings } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";
import toast from "react-hot-toast";

import { useIsMobile } from "@/hooks";
import type { PresetNumber } from "@/lib/column-preset-storage";
import { Modal } from "@/components/modal";

import type { TableColumn, TableColumnGroupMeta } from "../types";
import { ColumnSettingsTable } from "./ColumnSettingsTable";

/** 데스크톱 dropdown 너비 (px) */
const DROPDOWN_DESKTOP_WIDTH = 500;
/** dropdown 좌우 viewport 마진 (px) */
const DROPDOWN_HORIZONTAL_MARGIN = 12;
/** dropdown 위/아래 띄울 때 셀렉터 버튼과의 간격 (px) */
const DROPDOWN_VERTICAL_OFFSET = 5;

const PRESET_NUMBERS: readonly PresetNumber[] = [1, 2, 3] as const;

interface ColumnPresetSelectorProps<T> {
  columns: TableColumn<T>[];
  columnGroups?: TableColumnGroupMeta[];
  activePreset: PresetNumber;
  columnOrder: string[];
  hiddenColumns: string[];
  columnWidths: Record<string, number>;
  isDirty: boolean;
  hasPreset: (num: PresetNumber) => boolean;
  onApplyPreset: (num: PresetNumber) => void;
  /** 현재 편집 중 상태를 활성 프리셋에 저장(commit). 저장 불가하면 false. */
  onSaveActivePreset: () => boolean;
  /** 활성 프리셋을 기본값으로 되돌리기. */
  onResetActivePreset: () => void;
  /** 편집 중 컬럼 순서 갱신. */
  onColumnOrderChange: (next: string[]) => void;
  /** 편집 중 숨김 컬럼 갱신. */
  onHiddenColumnsChange: (next: string[]) => void;
  /** 단일 컬럼 너비 갱신. 0 이하면 키 제거(기본값 복원). */
  onSetColumnWidth: (key: string, width: number) => void;
  className?: string;
}

/**
 * 컬럼 프리셋 셀렉터 + 설정 드롭다운
 *
 * pill 형태 세그먼트 컨트롤. 톱니(설정) + 세로 디바이더 + 프리셋 1·2·3.
 * 활성 프리셋은 흰 배경이 layoutId로 슬라이드되며 이동.
 * 위치 계산은 floating-ui 위임 — flip으로 공간 부족 시 위로 뒤집고, shift로 viewport 안에 클램프.
 *
 * 편집 중 변경은 외부(useColumnPresets)에 즉시 반영되고, 명시 저장 시에만 영구화.
 * isDirty가 true면 톱니 옆에 점을 표시한다.
 */
export function ColumnPresetSelector<T>({
  columns,
  columnGroups,
  activePreset,
  columnOrder,
  hiddenColumns,
  columnWidths,
  isDirty,
  hasPreset,
  onApplyPreset,
  onSaveActivePreset,
  onResetActivePreset,
  onColumnOrderChange,
  onHiddenColumnsChange,
  onSetColumnWidth,
  className = "",
}: ColumnPresetSelectorProps<T>) {
  const filteredColumns = columns.filter((col) => !col.excludeFromPreset);
  const excludedKeys = new Set(
    columns.filter((col) => col.excludeFromPreset).map((col) => col.key),
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isMobile = useIsMobile();
  // layoutId 충돌 방지 — 동일 페이지에 셀렉터가 여러 개 있어도 각자 슬라이드.
  const indicatorId = useId();

  // 데스크톱: floating-ui Popover. 모바일: Modal(자동 바텀시트 분기) — useFloating은
  // open 조건을 모바일에서 항상 false로 둬 비활성. 트리거 클릭은 isSettingsOpen 단순 토글.
  const { refs, floatingStyles, context } = useFloating({
    open: !isMobile && isSettingsOpen,
    onOpenChange: setIsSettingsOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(DROPDOWN_VERTICAL_OFFSET),
      flip(),
      shift({ padding: DROPDOWN_HORIZONTAL_MARGIN }),
      size({
        apply({ availableWidth, elements }) {
          // 데스크톱 500px 상한, viewport 좁으면 축소.
          const target = Math.min(DROPDOWN_DESKTOP_WIDTH, availableWidth);
          Object.assign(elements.floating.style, {
            width: `${target}px`,
            maxWidth: `${DROPDOWN_DESKTOP_WIDTH}px`,
          });
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handlePresetButtonClick = (num: PresetNumber) => {
    if (activePreset === num) return;
    onApplyPreset(num);
    setIsSettingsOpen(false);
    toast.success(`프리셋 ${num}을(를) 적용했어요.`);
  };

  // 드롭다운에서 편집 중 컬럼 순서 변경 — 시스템 컬럼(excludeFromPreset)은
  // **현재 columnOrder에서의 위치**를 그대로 유지하도록 끼워넣고 부모로 전파.
  // (columns 정의 인덱스 기준으로 복원하면 헤더 DnD로 옮긴 일반 컬럼 위치가 풀려버린다.)
  const handleEditingOrderChange = (next: string[]) => {
    const excludedInCurrent = columnOrder
      .map((key, index) => ({ key, index }))
      .filter(({ key }) => excludedKeys.has(key));

    const finalOrder = [...next];
    excludedInCurrent
      .sort((a, b) => a.index - b.index)
      .forEach(({ key, index }) => {
        const insertAt = Math.min(index, finalOrder.length);
        finalOrder.splice(insertAt, 0, key);
      });

    onColumnOrderChange(finalOrder);
  };

  const handleHiddenChange = (key: string, hidden: boolean) => {
    if (!hidden) {
      const currentVisibleCount =
        columnOrder.length -
        excludedKeys.size -
        hiddenColumns.filter((k) => !excludedKeys.has(k)).length;
      if (currentVisibleCount <= 1) {
        toast.error("최소 1개 이상의 컬럼은 표시되어야 해요.");
        return;
      }
      onHiddenColumnsChange([...hiddenColumns, key]);
    } else {
      onHiddenColumnsChange(hiddenColumns.filter((f) => f !== key));
    }
  };

  const handleSaveSettings = () => {
    const ok = onSaveActivePreset();
    if (!ok) {
      toast.error("저장할 수 없는 상태예요.");
      return;
    }
    setIsSettingsOpen(false);
    toast.success(`프리셋 ${activePreset}에 저장했어요.`);
  };

  const handleResetSettings = () => {
    onResetActivePreset();
    setIsSettingsOpen(false);
    toast.success(`프리셋 ${activePreset}을(를) 초기화했어요.`);
  };

  // 드롭다운에 표시할 순서/숨김 — 시스템 컬럼 제외해서 보여줌.
  const editingColumnOrder = columnOrder.filter(
    (key) => !excludedKeys.has(key),
  );
  const editingHiddenColumns = hiddenColumns.filter(
    (key) => !excludedKeys.has(key),
  );

  return (
    <div className={`inline-flex ${className}`}>
      <div
        className="inline-flex h-7.5 items-center gap-0 rounded-full bg-bg-base-secondary p-0.75 sm:h-8.5"
        role="group"
        aria-label="컬럼 프리셋 선택"
      >
        {/* 설정 톱니 — 데스크톱은 floating-ui interactions, 모바일은 단순 onClick으로 Modal 토글. */}
        <button
          ref={refs.setReference}
          {...(isMobile
            ? {
                type: "button" as const,
                onClick: () => setIsSettingsOpen((v) => !v),
                "aria-label": "테이블 프리셋 설정",
                title: isDirty
                  ? "저장하지 않은 변경이 있어요"
                  : "테이블 프리셋 설정",
                className:
                  "relative ml-1 flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary sm:h-7 sm:w-7",
              }
            : getReferenceProps({
                type: "button",
                "aria-label": "테이블 프리셋 설정",
                title: isDirty
                  ? "저장하지 않은 변경이 있어요"
                  : "테이블 프리셋 설정",
                className:
                  "relative ml-1 flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary sm:h-7 sm:w-7",
              }))}
        >
          <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {isDirty && (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-brand-blue-secondary"
            />
          )}
        </button>

        {/* 디바이더 */}
        <span
          aria-hidden="true"
          className="ml-0.5 mr-1.5 h-4 w-px bg-bg-base-tertiary sm:h-4.5"
        />

        {/* 프리셋 1·2·3 */}
        {PRESET_NUMBERS.map((num) => {
          const isActive = activePreset === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => handlePresetButtonClick(num)}
              aria-pressed={isActive}
              title={
                isActive
                  ? "현재 활성화된 프리셋이에요"
                  : hasPreset(num)
                    ? `프리셋 ${num} 적용`
                    : `프리셋 ${num} 기본값으로 초기화`
              }
              className={`relative inline-flex h-6 w-8 items-center justify-center rounded-full px-2.5 py-1 text-sm font-medium transition-colors sm:h-7 sm:w-20 ${
                isActive ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`preset-active-${indicatorId}`}
                  className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-bg-base-tertiary"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">
                <span className="hidden sm:inline">프리셋</span>
                {num}
              </span>
            </button>
          );
        })}
      </div>

      {/* 데스크톱: floating-ui Popover (트리거 아래 위치). */}
      {!isMobile && isSettingsOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 overflow-hidden rounded-lg border-2 border-neutral-200 shadow-lg dark:border-neutral-700"
          >
            <ColumnSettingsTable
              num={String(activePreset)}
              columns={filteredColumns}
              columnGroups={columnGroups}
              columnOrder={editingColumnOrder}
              hiddenColumns={editingHiddenColumns}
              columnWidths={columnWidths}
              onOrderChange={handleEditingOrderChange}
              onHiddenChange={handleHiddenChange}
              onSetColumnWidth={onSetColumnWidth}
              onSave={handleSaveSettings}
              onReset={handleResetSettings}
            />
          </div>
        </FloatingPortal>
      )}

      {/* 모바일: 자동 바텀시트 분기되는 Modal. */}
      {isMobile && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title={`프리셋 ${activePreset} 설정`}
        >
          <ColumnSettingsTable
            num={String(activePreset)}
            columns={filteredColumns}
            columnOrder={editingColumnOrder}
            hiddenColumns={editingHiddenColumns}
            columnWidths={columnWidths}
            onOrderChange={handleEditingOrderChange}
            onHiddenChange={handleHiddenChange}
            onSetColumnWidth={onSetColumnWidth}
            onSave={handleSaveSettings}
            onReset={handleResetSettings}
          />
        </Modal>
      )}
    </div>
  );
}
