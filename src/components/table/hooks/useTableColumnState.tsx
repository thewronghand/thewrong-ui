import { useMemo, type ReactElement } from "react";

import { ColumnPresetSelector } from "../components/ColumnPresetSelector";
import type {
  TableColumn,
  TableColumnGroupMeta,
  TableColumnState,
} from "../types";
import { useColumnPresets } from "./useColumnPresets";

interface Options<T> {
  /** localStorage 페이지 키. 없으면 프리셋 비활성(컬럼 상태는 메모리만). */
  pageKey?: string;
  columns: TableColumn<T>[];
  /** 컬럼 그룹 메타 — 정의 시 슬롯 단위(그룹키 or 컬럼키)로 순서/숨김 관리. */
  columnGroups?: TableColumnGroupMeta[];
  /** 컬럼 프리셋 셀렉터 UI 노출 여부. 기본 true. */
  showSelector?: boolean;
  /** ColumnPresetSelector에 적용할 className. */
  selectorClassName?: string;
}

interface Result {
  /** Table에 넘길 controlled column-state 객체. */
  columnState: TableColumnState;
  /**
   * 렌더할 프리셋 셀렉터 element. `showSelector=false`이거나 `pageKey` 미지정 시 null.
   * 페이지에서 원하는 위치에 그대로 꽂으면 된다.
   */
  selector: ReactElement | null;
}

/**
 * Table의 controlled column-state + 프리셋 셀렉터 UI를 한 번에 묶어주는 헬퍼.
 *
 * 페이지/widget이 `useColumnPresets`를 직접 부르고 두 군데(셀렉터/Table)에 같은 객체를
 * 분배하는 보일러플레이트를 줄인다. 더 세밀한 제어가 필요하면 `useColumnPresets`를 직접 사용한다.
 */
export function useTableColumnState<T>({
  pageKey,
  columns,
  columnGroups,
  showSelector = true,
  selectorClassName,
}: Options<T>): Result {
  const presets = useColumnPresets({ pageKey, columns, columnGroups });

  const columnState = useMemo<TableColumnState>(
    () => ({
      columnOrder: presets.columnOrder,
      hiddenColumns: presets.hiddenColumns,
      columnWidths: presets.columnWidths,
      onColumnOrderChange: presets.setColumnOrder,
      onColumnWidthsChange: presets.setColumnWidths,
    }),
    [
      presets.columnOrder,
      presets.hiddenColumns,
      presets.columnWidths,
      presets.setColumnOrder,
      presets.setColumnWidths,
    ],
  );

  const selector =
    showSelector && pageKey ? (
      <ColumnPresetSelector
        columns={columns}
        columnGroups={columnGroups}
        activePreset={presets.activePreset}
        columnOrder={presets.columnOrder}
        hiddenColumns={presets.hiddenColumns}
        columnWidths={presets.columnWidths}
        isDirty={presets.isDirty}
        hasPreset={presets.hasPreset}
        onApplyPreset={presets.applyPreset}
        onSaveActivePreset={presets.saveActivePreset}
        onResetActivePreset={presets.resetActivePreset}
        onColumnOrderChange={presets.setColumnOrder}
        onHiddenColumnsChange={presets.setHiddenColumns}
        onSetColumnWidth={presets.setColumnWidth}
        className={selectorClassName}
      />
    ) : null;

  return { columnState, selector };
}
