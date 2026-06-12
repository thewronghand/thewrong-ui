import type { TableColumn, TableColumnGroupMeta } from "./types";

/**
 * 슬롯(그룹 또는 단일 컬럼) 단위 표현.
 *
 * 옵션 2 정책의 핵심 — columnOrder/hiddenColumns가 다루는 단위는 슬롯이지 평면 컬럼이 아니다.
 * - 그룹: 묶음 고정. 하위 컬럼 키들은 슬롯에 속하지만 columnOrder에는 들어가지 않는다.
 * - 단일 컬럼: 슬롯과 컬럼이 1:1.
 */
export interface ColumnSlot<T> {
  kind: "group" | "column";
  /** 슬롯 키. 그룹키 또는 컬럼키. */
  key: string;
  header: TableColumn<T>["header"];
  /** 그룹이면 하위 컬럼 배열, 단일 컬럼이면 자기 자신 한 개. */
  leafColumns: TableColumn<T>[];
  /** hideOnMobile: 그룹 메타의 옵션 또는 단일 컬럼의 hideOnMobile. */
  hideOnMobile?: boolean;
  /** 그룹 메타 원본 (그룹일 때만). */
  group?: TableColumnGroupMeta;
}

/**
 * 평면 컬럼 배열 + 그룹 메타를 받아 슬롯 단위로 묶는다.
 *
 * 그룹에 속한 컬럼들은 그룹 슬롯 1개로 합쳐지고, 속하지 않은 컬럼은 각자 슬롯이 된다.
 * 그룹 내부 컬럼 순서는 `group.columnKeys` 순서대로 강제 — `columns` 배열 내 등장 순서와 다를 수 있다.
 *
 * 그룹 메타에 정의된 columnKey가 columns에 없으면 무시(방어).
 */
export function buildColumnSlots<T>(
  columns: TableColumn<T>[],
  groups: TableColumnGroupMeta[] = [],
): ColumnSlot<T>[] {
  if (groups.length === 0) {
    return columns.map((col) => ({
      kind: "column" as const,
      key: col.key,
      header: col.header,
      leafColumns: [col],
      hideOnMobile: col.hideOnMobile,
    }));
  }

  // 그룹키와 컬럼키가 동일 네임스페이스에 들어가므로 충돌 시 슬롯 매핑이 깨진다.
  // 정의 시점에 dev 환경에서 경고 — 디버깅 어려운 무성 버그(컬럼이 사라짐) 회피.
  if (import.meta.env.DEV) {
    const columnKeys = new Set(columns.map((c) => c.key));
    const conflicts = groups.map((g) => g.key).filter((k) => columnKeys.has(k));
    if (conflicts.length > 0) {
       
      console.warn(
        `[buildColumnSlots] 그룹키가 컬럼키와 충돌: ${conflicts.join(", ")}. 그룹키를 다른 이름으로 변경하세요.`,
      );
    }
  }

  const columnMap = new Map(columns.map((c) => [c.key, c]));

  // 컬럼키 → 자신을 포함한 그룹키 (없으면 undefined).
  const columnToGroup = new Map<string, string>();
  for (const g of groups) {
    for (const ck of g.columnKeys) {
      columnToGroup.set(ck, g.key);
    }
  }

  const slots: ColumnSlot<T>[] = [];
  const consumedGroups = new Set<string>();

  for (const col of columns) {
    const groupKey = columnToGroup.get(col.key);
    if (groupKey) {
      if (consumedGroups.has(groupKey)) continue;
      consumedGroups.add(groupKey);
      const group = groups.find((g) => g.key === groupKey);
      if (!group) continue;
      const leafColumns = group.columnKeys
        .map((ck) => columnMap.get(ck))
        .filter((c): c is TableColumn<T> => Boolean(c));
      slots.push({
        kind: "group",
        key: group.key,
        header: group.header,
        leafColumns,
        hideOnMobile: group.hideOnMobile,
        group,
      });
    } else {
      slots.push({
        kind: "column",
        key: col.key,
        header: col.header,
        leafColumns: [col],
        hideOnMobile: col.hideOnMobile,
      });
    }
  }

  return slots;
}

/**
 * 슬롯 키 배열을 columnState.columnOrder의 기본값으로 변환. (그룹키 또는 컬럼키)
 */
export function getDefaultSlotOrder<T>(slots: ColumnSlot<T>[]): string[] {
  return slots.map((s) => s.key);
}

/**
 * columnOrder(슬롯 키 배열) + hiddenSlots를 적용해 가시 슬롯만 추려낸다.
 * 정의에 `hidden: true`로 박힌 단일 컬럼도 함께 제거.
 *
 * columnOrder에 없는 신규 슬롯(저장된 프리셋 이후 추가된 컬럼/그룹)은 끝에 자동 append —
 * useColumnPresets의 mergeColumnOrders가 effect로 합쳐주기 전 첫 렌더에서 빠지는 깜빡임을 막는다.
 */
export function applyColumnState<T>(
  slots: ColumnSlot<T>[],
  columnOrder: string[],
  hiddenSlotKeys: Set<string>,
): ColumnSlot<T>[] {
  const slotMap = new Map(slots.map((s) => [s.key, s]));
  const orderedSet = new Set(columnOrder);
  const fromOrder = columnOrder
    .map((key) => slotMap.get(key))
    .filter((s): s is ColumnSlot<T> => Boolean(s));
  // columnOrder에 없는 신규 슬롯은 정의 순서대로 뒤에 붙임.
  const newcomers = slots.filter((s) => !orderedSet.has(s.key));
  return [...fromOrder, ...newcomers].filter((s) => {
    if (hiddenSlotKeys.has(s.key)) return false;
    // 단일 컬럼이 정의 시점에 hidden:true면 제거.
    if (s.kind === "column" && s.leafColumns[0].hidden) return false;
    return true;
  });
}

/**
 * 가시 슬롯 → 평면 leaf 컬럼 시퀀스 (tbody td 매핑/colgroup/너비계산에 사용).
 */
export function flattenLeafColumns<T>(
  visibleSlots: ColumnSlot<T>[],
): TableColumn<T>[] {
  return visibleSlots.flatMap((s) => s.leafColumns);
}

/**
 * 가시 슬롯 중 하나라도 그룹이 있는지 — thead 2-row 분기 신호.
 */
export function hasGroupSlot<T>(visibleSlots: ColumnSlot<T>[]): boolean {
  return visibleSlots.some((s) => s.kind === "group");
}
