import type { SelectOption } from "@/components/select";

/** 검색 필드 정의 — discriminated union. 새 타입은 여기에 추가. */
export type SearchField =
  | SearchFieldText
  | SearchFieldSelect
  | SearchFieldMultiSelect
  | SearchFieldDateRange
  | SearchFieldDateSingle
  | SearchFieldMonth;

/**
 * 검색 값 형태. key → 값(빈 문자열 = 미입력).
 * - text/select: "값"
 * - multiSelect: "값1,값2" (CSV 직렬화. URL/zod schema와의 호환을 위해 string 일관성 유지)
 * - dateRange: "from~to" (둘 다 yyyy-MM-dd, 한쪽만 있어도 OK. 예: "2026-05-01~2026-05-06")
 * - dateSingle: "yyyy-MM-dd" 단일 값
 * - month: "yyyy-MM" 단일 값
 */
export type SearchValues = Record<string, string>;

interface SearchFieldCommon {
  /** 결과 객체의 키. */
  key: string;
  /** 라벨 — 칩에서 prefix로 사용 가능. */
  label: string;
  /** 폼 영역에서의 폭. 미지정 시 자동(grid) 분배. 단위는 tailwind w-* 또는 임의 className. */
  className?: string;
  /** true면 입력 UI/칩/parse/state 모든 곳에서 제외 — 권한 기반 가시성 분기에 사용. */
  hidden?: boolean;
}

export interface SearchFieldText extends SearchFieldCommon {
  type: "text";
  /** placeholder. 미지정 시 label. */
  placeholder?: string;
  inputMode?: "text" | "numeric";
}

export interface SearchFieldSelect extends SearchFieldCommon {
  type: "select";
  options: SelectOption[];
  /** placeholder(첫 옵션 자동 생성용). 미지정 시 "{label} 전체". */
  placeholder?: string;
}

export interface SearchFieldMultiSelect extends SearchFieldCommon {
  type: "multiSelect";
  options: SelectOption[];
  /** placeholder. 미지정 시 "{label} 선택". */
  placeholder?: string;
}

/** 날짜 범위 프리셋. label은 버튼 표기, range()는 호출 시점의 from/to(yyyy-MM-dd) 반환. */
export interface DateRangePreset {
  label: string;
  range: () => { from: string; to: string };
}

export interface SearchFieldDateRange extends SearchFieldCommon {
  type: "dateRange";
  /** 단일 key에 "from~to" CSV로 직렬화. parseSearchValues가 { from, to }로 풀어준다. */
  presets?: DateRangePreset[];
}

/** 단일 날짜 프리셋. label은 버튼 표기, date()는 호출 시점의 yyyy-MM-dd 반환. */
export interface DateSinglePreset {
  label: string;
  date: () => string;
}

export interface SearchFieldDateSingle extends SearchFieldCommon {
  type: "dateSingle";
  /** yyyy-MM-dd 단일 값. parseSearchValues가 그대로 string으로 반환. */
  presets?: DateSinglePreset[];
}

export interface SearchFieldMonth extends SearchFieldCommon {
  type: "month";
  /** yyyy-MM 단일 값. parseSearchValues가 그대로 string으로 반환. */
}
