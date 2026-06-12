import { parseDateRangeValue, type DateRangeValue } from "./parseDateRange";
import type { SearchField, SearchValues } from "./types";

/**
 * SearchValues를 type-aware하게 파싱한 결과.
 * - text/select 필드: `string` 그대로 (빈 값이면 `""`)
 * - multiSelect 필드: `string[]` 으로 split (CSV → array)
 * - dateRange 필드: `{ from, to }` 객체 (한쪽만 있어도 OK, 둘 다 비면 빈 문자열)
 *
 * 호출부가 SearchBox의 직렬화 형식을 알 필요 없이 바로 API 파라미터로 사용 가능.
 */
export type ParsedSearchValues<TFields extends readonly SearchField[]> = {
  [K in TFields[number] as K["key"]]: K["type"] extends "multiSelect"
    ? string[]
    : K["type"] extends "dateRange"
      ? DateRangeValue
      : // text / select / dateSingle / month 모두 단일 string.
        // dateSingle은 yyyy-MM-dd, month는 yyyy-MM 그대로 흐름.
        string;
};

/**
 * multiSelect의 CSV 값을 array로 변환. 빈 값이면 `[]`.
 *
 * SearchBox의 CSV 직렬화는 `Record<string, string>` 시그니처/URL 호환을 위한 내부 표현이고,
 * 호출부는 array가 필요. 이 헬퍼로 매번 split 보일러플레이트를 줄인다.
 */
export function parseMultiSelectValue(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

/**
 * SearchValues 전체를 fields 정의 기준으로 파싱.
 *
 * @example
 * ```ts
 * const SEARCH_FIELDS = [
 *   { type: "text", key: "name", label: "이름" },
 *   { type: "multiSelect", key: "type", label: "유형", options: [...] },
 * ] as const satisfies readonly SearchField[];
 *
 * const parsed = parseSearchValues(SEARCH_FIELDS, search);
 * //   ^? { name: string; type: string[] }
 *
 * // 그대로 axios에 전달 — split 보일러플레이트 없음.
 * useApiQuery({ params: { name: parsed.name || undefined, type: parsed.type } });
 * ```
 */
export function parseSearchValues<const TFields extends readonly SearchField[]>(
  fields: TFields,
  values: SearchValues,
): ParsedSearchValues<TFields> {
  const result: Record<string, string | string[] | DateRangeValue> = {};
  for (const field of fields) {
    // hidden 필드는 빈 값으로 고정 — 호출부에서 || undefined 패턴이 그대로 동작.
    const raw = field.hidden ? "" : (values[field.key] ?? "");
    if (field.type === "multiSelect") {
      result[field.key] = parseMultiSelectValue(raw);
    } else if (field.type === "dateRange") {
      result[field.key] = parseDateRangeValue(raw);
    } else {
      result[field.key] = raw;
    }
  }
  return result as ParsedSearchValues<TFields>;
}
