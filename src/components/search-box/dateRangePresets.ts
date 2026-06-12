import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";

import { serializeDateRangeValue } from "./parseDateRange";
import type { DateRangePreset } from "./types";

const ISO = "yyyy-MM-dd";

/** 당일 from/to. 페이지 진입 시 기본 range로 사용. */
export function getTodayDateRange(): { from: string; to: string } {
  const s = format(new Date(), ISO);
  return { from: s, to: s };
}

/** "from~to" CSV 형태의 당일 SearchValues 값. */
export function getTodayDateRangeValue(): string {
  const { from, to } = getTodayDateRange();
  return serializeDateRangeValue(from, to);
}

/** 기본 4종 프리셋 — 전일 / 당일 / 당월 / 전월. 호출 시점의 날짜 기준으로 계산. */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: "전일",
    range: () => {
      const d = subDays(new Date(), 1);
      const s = format(d, ISO);
      return { from: s, to: s };
    },
  },
  {
    label: "당일",
    range: () => {
      const s = format(new Date(), ISO);
      return { from: s, to: s };
    },
  },
  {
    label: "당월",
    range: () => {
      const now = new Date();
      return {
        from: format(startOfMonth(now), ISO),
        to: format(endOfMonth(now), ISO),
      };
    },
  },
  {
    label: "전월",
    range: () => {
      const prev = subMonths(new Date(), 1);
      return {
        from: format(startOfMonth(prev), ISO),
        to: format(endOfMonth(prev), ISO),
      };
    },
  },
];
