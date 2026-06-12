import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ColumnPresetStorage,
  type ColumnPresetData,
  type PresetNumber,
} from "@/lib/column-preset-storage";

import {
  buildColumnSlots,
  getDefaultSlotOrder,
} from "../column-group-utils";
import type { TableColumn, TableColumnGroupMeta } from "../types";

export interface UseColumnPresetsOptions<T> {
  /** localStorage 페이지 키. 미지정 시 메모리만 사용. */
  pageKey?: string;
  columns: TableColumn<T>[];
  /**
   * 컬럼 그룹 메타. 정의 시 columnOrder/hiddenColumns가 다루는 단위가 슬롯(그룹키 또는 컬럼키)이 된다.
   * 옵션 2 정책 — 그룹은 묶음 고정.
   */
  columnGroups?: TableColumnGroupMeta[];
  /** 기존 단일 키로 저장된 width 데이터를 프리셋 시스템으로 1회 마이그레이션. */
  legacyStorageKey?: string;
}

export interface UseColumnPresetsReturn {
  activePreset: PresetNumber;

  /** 편집 중 상태(메모리). 헤더 DnD/리사이즈/드롭다운 편집은 여기에만 반영. */
  columnOrder: string[];
  hiddenColumns: string[];
  columnWidths: Record<string, number>;

  /** 저장본과 편집본이 다를 때 true. */
  isDirty: boolean;
  hasPreset: (num: PresetNumber) => boolean;

  /** 다른 프리셋 활성화. 편집 중 변경분은 버려짐. */
  applyPreset: (num: PresetNumber) => void;

  /** 현재 편집 중 상태를 저장본으로 commit. 빈 order 등으로 실패하면 false. */
  saveActivePreset: () => boolean;
  /** 지정 프리셋에 현재 편집 중 상태를 저장하고 그 프리셋을 활성화. 실패 시 false. */
  saveAsPreset: (num: PresetNumber) => boolean;

  /** 활성 프리셋을 기본값(빈 저장본)으로 되돌리고 편집본도 초기화. */
  resetActivePreset: () => void;

  /** 편집 중 상태 변경 (자동 persist 없음). */
  setColumnOrder: (next: string[]) => void;
  setHiddenColumns: (next: string[]) => void;
  setColumnWidths: (next: Record<string, number>) => void;
  /** 단일 키 너비 갱신. 0 이하면 키 제거(기본값 복원). */
  setColumnWidth: (key: string, width: number) => void;
}

interface PresetSnapshot {
  columnOrder: string[];
  hiddenColumns: string[];
  columnWidths: Record<string, number>;
}

function mergeColumnOrders(
  savedOrder: string[],
  currentOrder: string[],
): string[] {
  const currentFields = new Set(currentOrder);
  const savedFields = new Set(savedOrder);

  const validSavedOrder = savedOrder.filter((field) =>
    currentFields.has(field),
  );
  const newFields = currentOrder.filter((field) => !savedFields.has(field));

  const merged = [...validSavedOrder, ...newFields];
  // 결과가 savedOrder와 동일하면 새 배열을 만들지 않고 기존 참조를 반환한다.
  // (effect 안에서 functional setState로 호출될 때 참조가 매번 바뀌면 무한 렌더 위험.)
  if (merged.length === savedOrder.length) {
    let same = true;
    for (let i = 0; i < merged.length; i++) {
      if (merged[i] !== savedOrder[i]) {
        same = false;
        break;
      }
    }
    if (same) return savedOrder;
  }
  return merged;
}

function snapshotFromStorage(
  data: ColumnPresetData | null,
  defaultOrder: string[],
): PresetSnapshot {
  if (!data || data.columnOrder.length === 0) {
    return {
      columnOrder: defaultOrder,
      hiddenColumns: [],
      columnWidths: data?.columnWidths ?? {},
    };
  }
  return {
    columnOrder: mergeColumnOrders(data.columnOrder, defaultOrder),
    hiddenColumns: data.hiddenColumns ?? [],
    columnWidths: data.columnWidths ?? {},
  };
}

function areSnapshotsEqual(a: PresetSnapshot, b: PresetSnapshot): boolean {
  if (a.columnOrder.length !== b.columnOrder.length) return false;
  for (let i = 0; i < a.columnOrder.length; i++) {
    if (a.columnOrder[i] !== b.columnOrder[i]) return false;
  }
  if (a.hiddenColumns.length !== b.hiddenColumns.length) return false;
  const bHidden = new Set(b.hiddenColumns);
  for (const key of a.hiddenColumns) {
    if (!bHidden.has(key)) return false;
  }
  const aWidthKeys = Object.keys(a.columnWidths);
  const bWidthKeys = Object.keys(b.columnWidths);
  if (aWidthKeys.length !== bWidthKeys.length) return false;
  for (const key of aWidthKeys) {
    if (a.columnWidths[key] !== b.columnWidths[key]) return false;
  }
  return true;
}

/**
 * 컬럼 프리셋 관리 훅 (B-2 모델)
 *
 * - 활성 프리셋의 (순서/숨김/너비) 셋을 편집 중 상태로 메모리 보유
 * - 헤더 DnD, 리사이즈, 드롭다운 편집은 모두 편집 중 상태에만 반영 (자동 persist 없음)
 * - 명시 저장(`saveActivePreset` / `saveAsPreset`) 시에만 localStorage에 commit
 * - 새로고침 시 마지막 저장본으로 복귀
 * - 다른 프리셋으로 전환 시 편집 중 변경분은 그대로 버려짐
 */
export function useColumnPresets<T>({
  pageKey,
  columns,
  columnGroups,
  legacyStorageKey,
}: UseColumnPresetsOptions<T>): UseColumnPresetsReturn {
  // 슬롯 키(그룹키 또는 컬럼키)가 columnOrder의 기본값.
  // 그룹이 없으면 컬럼 키와 동일.
  const defaultColumnOrder = useMemo(
    () => getDefaultSlotOrder(buildColumnSlots(columns, columnGroups)),
    [columns, columnGroups],
  );

  const [activePreset, setActivePresetState] = useState<PresetNumber>(1);
  const [columnOrder, setColumnOrderState] =
    useState<string[]>(defaultColumnOrder);
  const [hiddenColumns, setHiddenColumnsState] = useState<string[]>([]);
  const [columnWidths, setColumnWidthsState] = useState<
    Record<string, number>
  >({});

  // 저장본 스냅샷 — dirty 판정 기준. activePreset/pageKey 변경 시 갱신.
  const [savedSnapshot, setSavedSnapshot] = useState<PresetSnapshot>({
    columnOrder: defaultColumnOrder,
    hiddenColumns: [],
    columnWidths: {},
  });

  // 편집 상태 + 저장 스냅샷을 한 묶음으로 갈아끼우는 헬퍼.
  // 두 setState를 따로 쓰면 prev 인자 시점이 어긋날 위험이 있어 한 곳에서 묶는다.
  const applySnapshot = useCallback((snapshot: PresetSnapshot) => {
    setSavedSnapshot(snapshot);
    setColumnOrderState(snapshot.columnOrder);
    setHiddenColumnsState(snapshot.hiddenColumns);
    setColumnWidthsState(snapshot.columnWidths);
  }, []);

  const lastPageKeyRef = useRef<string | undefined>(undefined);
  // legacyStorageKey는 effect 안에서만 1회 사용. deps에 두면 의미가 흐려져 ref로 고정.
  const legacyStorageKeyRef = useRef(legacyStorageKey);
  legacyStorageKeyRef.current = legacyStorageKey;

  useEffect(() => {
    if (!pageKey) {
      lastPageKeyRef.current = pageKey;
      setActivePresetState(1);
      applySnapshot({
        columnOrder: defaultColumnOrder,
        hiddenColumns: [],
        columnWidths: {},
      });
      return;
    }

    const isPageKeyChanged = lastPageKeyRef.current !== pageKey;
    lastPageKeyRef.current = pageKey;

    if (isPageKeyChanged) {
      const legacyKey = legacyStorageKeyRef.current;
      if (legacyKey) {
        ColumnPresetStorage.migrateFromLegacyStorage(pageKey, legacyKey);
      }

      const savedActive = ColumnPresetStorage.getActivePreset(pageKey);
      const snapshot = snapshotFromStorage(
        ColumnPresetStorage.getPresetColumns(pageKey, savedActive),
        defaultColumnOrder,
      );

      setActivePresetState(savedActive);
      applySnapshot(snapshot);
      return;
    }

    // columns만 바뀐 케이스: 새 컬럼만 끝에 합쳐 반영.
    // 편집본과 저장본 모두 같은 merge 결과로 동기 갱신 → isDirty 판정이 어긋나지 않음.
    // merge 결과가 prev와 동일하면 동일 참조를 반환해 React가 리렌더를 건너뛰게 한다.
    setColumnOrderState((prev) => mergeColumnOrders(prev, defaultColumnOrder));
    setSavedSnapshot((prev) => {
      const mergedOrder = mergeColumnOrders(prev.columnOrder, defaultColumnOrder);
      if (mergedOrder === prev.columnOrder) return prev;
      return { ...prev, columnOrder: mergedOrder };
    });
  }, [applySnapshot, defaultColumnOrder, pageKey]);

  const isDirty = useMemo(
    () =>
      !areSnapshotsEqual(
        { columnOrder, hiddenColumns, columnWidths },
        savedSnapshot,
      ),
    [columnOrder, hiddenColumns, columnWidths, savedSnapshot],
  );

  const hasPreset = useCallback(
    (num: PresetNumber): boolean => {
      if (!pageKey) return false;
      return ColumnPresetStorage.hasPreset(pageKey, num);
    },
    [pageKey],
  );

  const applyPreset = useCallback(
    (num: PresetNumber) => {
      // 편집 중 변경분은 그대로 버려진다 — 사용자에게 묻지 않음.
      setActivePresetState(num);
      if (!pageKey) {
        applySnapshot({
          columnOrder: defaultColumnOrder,
          hiddenColumns: [],
          columnWidths: {},
        });
        return;
      }
      ColumnPresetStorage.setActivePreset(pageKey, num);
      applySnapshot(
        snapshotFromStorage(
          ColumnPresetStorage.getPresetColumns(pageKey, num),
          defaultColumnOrder,
        ),
      );
    },
    [applySnapshot, defaultColumnOrder, pageKey],
  );

  const saveActivePreset = useCallback((): boolean => {
    if (!pageKey) return false;
    if (columnOrder.length === 0) return false;
    ColumnPresetStorage.savePreset(pageKey, activePreset, {
      columnOrder,
      hiddenColumns,
      columnWidths,
    });
    setSavedSnapshot({ columnOrder, hiddenColumns, columnWidths });
    return true;
  }, [activePreset, columnOrder, columnWidths, hiddenColumns, pageKey]);

  const saveAsPreset = useCallback(
    (num: PresetNumber): boolean => {
      if (!pageKey) {
        setActivePresetState(num);
        return false;
      }
      if (columnOrder.length === 0) return false;
      ColumnPresetStorage.savePreset(pageKey, num, {
        columnOrder,
        hiddenColumns,
        columnWidths,
      });
      ColumnPresetStorage.setActivePreset(pageKey, num);
      setActivePresetState(num);
      setSavedSnapshot({ columnOrder, hiddenColumns, columnWidths });
      return true;
    },
    [columnOrder, columnWidths, hiddenColumns, pageKey],
  );

  const resetActivePreset = useCallback(() => {
    if (pageKey) {
      ColumnPresetStorage.clearPreset(pageKey, activePreset);
    }
    applySnapshot({
      columnOrder: defaultColumnOrder,
      hiddenColumns: [],
      columnWidths: {},
    });
  }, [activePreset, applySnapshot, defaultColumnOrder, pageKey]);

  const setColumnOrder = useCallback((next: string[]) => {
    setColumnOrderState(next);
  }, []);

  const setHiddenColumns = useCallback((next: string[]) => {
    setHiddenColumnsState(next);
  }, []);

  const setColumnWidths = useCallback((next: Record<string, number>) => {
    setColumnWidthsState(next);
  }, []);

  const setColumnWidth = useCallback((key: string, width: number) => {
    setColumnWidthsState((prev) => {
      const next = { ...prev };
      if (width > 0) {
        next[key] = width;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  return {
    activePreset,
    columnOrder,
    hiddenColumns,
    columnWidths,
    isDirty,
    hasPreset,
    applyPreset,
    saveActivePreset,
    saveAsPreset,
    resetActivePreset,
    setColumnOrder,
    setHiddenColumns,
    setColumnWidths,
    setColumnWidth,
  };
}
