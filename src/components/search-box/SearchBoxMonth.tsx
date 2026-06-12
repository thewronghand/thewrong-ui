import { Calendar } from "lucide-react";
import { useContext } from "react";

import { MonthPicker, type MonthValue } from "@/components/date-picker";

import { SearchBoxSheetContext } from "./SearchBoxSheetContext";

interface Props {
  /** "yyyy-MM" 또는 빈 문자열. */
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  size: "mini" | "small";
}

/** "yyyy-MM" → MonthValue. 빈 값/잘못된 값이면 undefined. */
function parseMonthValue(value: string): MonthValue | undefined {
  const [y, m] = value.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month) return undefined;
  return { year, month };
}

function formatMonthValue({ year, month }: MonthValue): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * 년월 선택 — MonthPicker 1개. 단일 SearchValues 키에 "yyyy-MM" 직접 저장.
 *
 * dateSingle의 년월 버전. 미선택(빈 값)이면 "년월 선택" placeholder.
 */
export function SearchBoxMonth({ value, onChange, ariaLabel, size }: Props) {
  const inSearchBoxSheet = useContext(SearchBoxSheetContext);
  const monthValue = parseMonthValue(value);
  const label = monthValue
    ? `${monthValue.year}년 ${monthValue.month}월`
    : "년월 선택";

  return (
    <MonthPicker
      value={monthValue}
      onChange={(next) => onChange(formatMonthValue(next))}
      disableMobileSheet={inSearchBoxSheet}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className={`inline-flex w-full items-center gap-2 rounded-lg border border-border-tertiary bg-bg-card px-3 text-sm text-text-primary transition-colors hover:bg-bg-base-primary dark:border-border-secondary ${
          size === "small" ? "h-10 py-2" : "h-9 py-1.5"
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-text-secondary" />
        <span className={monthValue ? "" : "text-text-tertiary"}>{label}</span>
      </button>
    </MonthPicker>
  );
}
