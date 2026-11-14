import { describe, expect, it } from "vitest";
import {
  compareMonths,
  completeMonthRange,
  selectMonth,
  shiftMonth,
} from "./month-range-utils";

describe("월 범위 계산", () => {
  it("연도 경계를 넘는 월 이동과 순서를 계산한다", () => {
    expect(shiftMonth({ year: 2025, month: 12 }, 1)).toEqual({
      year: 2026,
      month: 1,
    });
    expect(shiftMonth({ year: 2025, month: 1 }, -13)).toEqual({
      year: 2023,
      month: 12,
    });
    expect(shiftMonth({ year: 2, month: 1 }, -1)).toEqual({
      year: 1,
      month: 12,
    });
    expect(
      compareMonths({ year: 2026, month: 1 }, { year: 2025, month: 12 }),
    ).toBeGreaterThan(0);
  });
  it("시작보다 이전 월을 고르거나 완성된 범위를 다시 고르면 시작을 바꾼다", () => {
    const from = { year: 2025, month: 6 };
    const earlier = { year: 2025, month: 3 };
    const later = { year: 2026, month: 2 };
    expect(selectMonth({ from, to: null }, earlier)).toEqual({
      from: earlier,
      to: null,
    });
    expect(selectMonth({ from, to: null }, later)).toEqual({ from, to: later });
    expect(selectMonth({ from, to: later }, earlier)).toEqual({
      from: earlier,
      to: null,
    });
    expect(completeMonthRange({ from, to: null })).toEqual({ from, to: from });
    expect(completeMonthRange({ from: null, to: null })).toBeNull();
  });
});
