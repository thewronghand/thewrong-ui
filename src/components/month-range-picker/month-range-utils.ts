import type { MonthValue } from "@/components/date-picker";

export interface MonthRange {
  from: MonthValue | null;
  to: MonthValue | null;
}

export function compareMonths(a: MonthValue, b: MonthValue): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function shiftMonth(value: MonthValue, amount: number): MonthValue {
  const total = value.year * 12 + value.month - 1 + amount;
  const year = Math.floor(total / 12);
  return { year, month: total - year * 12 + 1 };
}

export function selectMonth(range: MonthRange, next: MonthValue): MonthRange {
  if (!range.from || range.to || compareMonths(next, range.from) < 0) {
    return { from: next, to: null };
  }
  return { from: range.from, to: next };
}

export function completeMonthRange(range: MonthRange): MonthRange | null {
  return range.from ? { from: range.from, to: range.to ?? range.from } : null;
}
