import { describe, expect, it } from "vitest";
import { calculateFillEmptyRows } from "./useFillEmptyRows";

const base = {
  containerHeight: 200,
  headerHeight: 20,
  rowHeights: [20, 20, 20],
  remainingMode: "sum-real-rows" as const,
  tbodyHeight: 60,
  emptyRowsHeight: 0,
};

describe("빈 행 계산", () => {
  it("평균 행 높이와 남은 공간으로 채울 행 수를 계산한다", () => {
    expect(calculateFillEmptyRows(base)).toEqual({
      emptyRowCount: 6,
      measuredRowHeight: 20,
    });
    expect(
      calculateFillEmptyRows({
        ...base,
        rowHeights: [10, 30],
        tbodyHeight: 40,
      }),
    ).toEqual({ emptyRowCount: 7, measuredRowHeight: 20 });
  });
  it("펼친 행 높이는 포함하고 이미 렌더된 빈 행 높이는 제외한다", () => {
    const expanded = {
      ...base,
      remainingMode: "tbody-height" as const,
      tbodyHeight: 100,
    };
    expect(calculateFillEmptyRows(expanded)).toEqual({
      emptyRowCount: 4,
      measuredRowHeight: 20,
    });
    expect(
      calculateFillEmptyRows({
        ...expanded,
        tbodyHeight: 180,
        emptyRowsHeight: 80,
      }),
    ).toEqual({ emptyRowCount: 4, measuredRowHeight: 20 });
  });
  it("실제 행이 없거나 측정 높이가 0이면 적절히 반환한다", () => {
    expect(calculateFillEmptyRows({ ...base, rowHeights: [] })).toEqual({
      emptyRowCount: 0,
      measuredRowHeight: null,
    });
    expect(calculateFillEmptyRows({ ...base, rowHeights: [0] })).toBeNull();
    expect(calculateFillEmptyRows({ ...base, containerHeight: 50 })).toEqual({
      emptyRowCount: 0,
      measuredRowHeight: 20,
    });
  });
});
