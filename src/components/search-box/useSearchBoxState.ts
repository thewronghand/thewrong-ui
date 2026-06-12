import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { parseDateRangeValue } from "./parseDateRange";
import type { SearchField, SearchValues } from "./types";

interface UseSearchBoxStateArgs {
  fields: readonly SearchField[];
  /** 외부에서 적용된 값. 외부가 commit한 값이라 내부 draft와 별개. */
  values: SearchValues;
  /** 사용자가 [검색]/Enter로 commit할 때 호출. */
  onSearch: (next: SearchValues) => void;
  /** [초기화] 호출. 미지정 시 빈 객체로 onSearch 호출. */
  onClear?: () => void;
}

/**
 * SearchBox의 입력/적용 상태 관리.
 * - draft: 사용자가 입력 중인 값 (외부에 노출 X)
 * - values: 외부가 commit한 적용 값 (칩 표시·재적용 시 draft 동기화 기준)
 *
 * 핵심: **입력 즉시 onSearch 호출하지 않는다.** [검색] 버튼/Enter 시점에만 commit.
 */
export function useSearchBoxState({
  fields,
  values,
  onSearch,
  onClear,
}: UseSearchBoxStateArgs) {
  const [draft, setDraft] = useState<SearchValues>(() =>
    syncDraft(fields, values),
  );

  /**
   * 마지막으로 외부와 동기화된 values 스냅샷.
   * 외부 변경이 실제로 다른지 비교 + 사용자가 그 사이 수정한 필드는 보존하는 데 사용.
   */
  const lastSyncedValuesRef = useRef<SearchValues>(values);

  /**
   * 외부 values가 바뀌면 draft에 반영. 단:
   * - 외부 변경이 직전 동기화 시점과 같다면 (reference만 변경된 동일 값) skip — 사용자 입력 보호.
   * - 다르다면, 사용자가 직접 수정한 필드(draft가 마지막 sync와 다른 필드)는 그대로 두고 나머지만 갱신.
   *   (외부 URL 동기화/store 변경이 사용자 입력 중에 들어와도 입력 손실 안 함.)
   */
  useEffect(() => {
    const last = lastSyncedValuesRef.current;
    if (shallowEqual(values, last, fields)) return;

    setDraft((prev) => {
      const next: SearchValues = { ...prev };
      for (const f of fields) {
        const userEdited = (prev[f.key] ?? "") !== (last[f.key] ?? "");
        if (!userEdited) {
          next[f.key] = values[f.key] ?? "";
        }
      }
      return next;
    });
    lastSyncedValuesRef.current = values;
    // fields는 stable 정의 가정. values 변화에만 반응.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const setFieldValue = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (): boolean => {
    // dateRange 필드 검증 — 종료일이 시작일보다 빠르면 토스트 + 차단.
    for (const f of fields) {
      if (f.hidden || f.type !== "dateRange") continue;
      const { from, to } = parseDateRangeValue(draft[f.key] ?? "");
      if (from && to && from > to) {
        toast.error(`${f.label} 종료일이 시작일보다 빠를 수 없어요`);
        return false;
      }
    }
    // hidden 필드는 입력 UI가 없어 사용자가 건드릴 수 없지만, 외부 URL에 잔존할 수 있으므로
    // commit 시점에 빈 값으로 강제 — hidden 토글 시 잔존 파라미터가 호출에 섞이지 않게 한다.
    onSearch(stripHidden(fields, draft));
    return true;
  };

  const clear = () => {
    const empty = emptyValues(fields);
    setDraft(empty);
    if (onClear) onClear();
    else onSearch(empty);
  };

  /**
   * 적용된 값에서 select / multiSelect 필드만 추려 칩 데이터 생성.
   * - text 입력은 칩으로 만들지 않음(입력값 자체가 보이니 중복)
   * - select: "조건 | 옵션라벨"
   * - multiSelect: "조건 | 옵션1, 옵션2" — 길면 CSS truncate로 잘림
   */
  const chips = fields
    .map((f) => {
      if (f.hidden) return null;
      const value = values[f.key] ?? "";
      if (value === "") return null;

      if (f.type === "select") {
        const opt = f.options.find((o) => String(o.value) === value);
        return {
          key: f.key,
          label: f.label,
          valueLabel: opt?.label ?? value,
        };
      }

      if (f.type === "multiSelect") {
        const codes = value.split(",").filter(Boolean);
        if (codes.length === 0) return null;
        const optMap = new Map(f.options.map((o) => [String(o.value), o.label]));
        const labels = codes.map((c) => optMap.get(c) ?? c);
        return {
          key: f.key,
          label: f.label,
          valueLabel: labels.join(", "),
        };
      }

      // dateRange는 칩으로 표시하지 않음 — 인풋 자체에 값이 보여 중복.

      return null;
    })
    .filter((c): c is { key: string; label: string; valueLabel: string } => c !== null);

  /** 단일 칩 제거 — 해당 필드를 빈 값으로 만들어 즉시 commit. */
  const removeChip = (key: string) => {
    const next = { ...values, [key]: "" };
    setDraft(next);
    onSearch(next);
  };

  return {
    draft,
    setFieldValue,
    submit,
    clear,
    chips,
    removeChip,
  };
}

function syncDraft(
  fields: readonly SearchField[],
  values: SearchValues,
): SearchValues {
  const next: SearchValues = {};
  for (const f of fields) {
    next[f.key] = values[f.key] ?? "";
  }
  return next;
}

function emptyValues(fields: readonly SearchField[]): SearchValues {
  const next: SearchValues = {};
  for (const f of fields) {
    next[f.key] = "";
  }
  return next;
}

function stripHidden(
  fields: readonly SearchField[],
  values: SearchValues,
): SearchValues {
  const next: SearchValues = { ...values };
  for (const f of fields) {
    if (f.hidden) next[f.key] = "";
  }
  return next;
}

/** fields 키 기준으로 두 SearchValues가 동등한지(빈 문자열 == undefined). */
function shallowEqual(
  a: SearchValues,
  b: SearchValues,
  fields: readonly SearchField[],
): boolean {
  for (const f of fields) {
    if ((a[f.key] ?? "") !== (b[f.key] ?? "")) return false;
  }
  return true;
}
