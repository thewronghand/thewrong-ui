/**
 * dateRange 필드 직렬화 헬퍼.
 *
 * SearchValues는 평면 `Record<string, string>`이라 from/to 두 값을 단일 키에 묶어야 한다.
 * 형식: `"from~to"`. 한쪽만 있어도 OK (`"~2026-05-06"`, `"2026-05-01~"`).
 * 빈 문자열은 미입력.
 */

export interface DateRangeValue {
  from: string;
  to: string;
}

const SEPARATOR = "~";

/** SearchValues 문자열 → { from, to } */
export function parseDateRangeValue(raw: string | undefined): DateRangeValue {
  if (!raw) return { from: "", to: "" };
  const idx = raw.indexOf(SEPARATOR);
  if (idx === -1) return { from: raw, to: "" };
  return { from: raw.slice(0, idx), to: raw.slice(idx + SEPARATOR.length) };
}

/** 양쪽 모두 빈 값이면 빈 문자열 (URL에서 자동 제거되도록). */
export function serializeDateRangeValue(from: string, to: string): string {
  if (!from && !to) return "";
  return `${from}${SEPARATOR}${to}`;
}
