import { Calendar } from "lucide-react";
import { useContext } from "react";

import { MonthPicker, type MonthValue } from "@/components/date-picker";
import { cn } from "@/lib/utils";

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
        className={cn(
          "inline-flex w-full items-center gap-2 border border-border-subtle bg-bg-surface px-3 text-sm text-fg-default transition-colors hover:bg-bg-subtle",
          size === "mini" ? "h-8 rounded-control-mini py-1.5" : "h-10 rounded-control-small py-2",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-fg-muted" />
        <span className={monthValue ? "" : "text-fg-subtle"}>{label}</span>
      </button>
    </MonthPicker>
  );
}
