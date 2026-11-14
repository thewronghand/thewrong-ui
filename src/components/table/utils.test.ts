import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

import {
  getHoverableRowClasses,
  getSelectedRowClasses,
  getStripedRowClasses,
  getTableCellClasses,
  getTableHeaderCellClasses,
} from "./utils";

describe("테이블 토큰 클래스 합성", () => {
  it("선택 행은 줄무늬와 클릭 가능한 행의 호버보다 우선한다", () => {
    for (const index of [0, 1]) {
      const classes = cn(
        getStripedRowClasses(index),
        getSelectedRowClasses(),
        getHoverableRowClasses(),
      );
      expect(classes).toContain("bg-bg-table-row-selected");
      expect(classes).toContain("hover:bg-bg-table-row-selected-hover");
      expect(classes).toContain("shadow-[inset_4px_0_0_0_var(--color-primary)]");
      expect(classes).not.toContain("bg-bg-table-row-odd");
      expect(classes).not.toContain("bg-bg-table-row-even");
      expect(classes).not.toContain("hover:bg-bg-table-row-hover");
    }
  });

  it("고정 헤더와 셀의 보더 색 및 위치가 함께 남는다", () => {
    const header = cn(
      getTableHeaderCellClasses(),
      "relative",
      "sticky left-0 z-20 bg-bg-table-header",
    );
    const cell = cn(
      getTableCellClasses(),
      "border-r-0",
      "sticky left-0 z-10 bg-inherit",
    );
    expect(header).toContain("border-border-table-header");
    expect(header).toContain("sticky");
    expect(header).not.toContain("relative");
    expect(cell).toContain("border-border-table-cell");
    expect(cell).toContain("border-r-0");
    expect(cell).toContain("bg-inherit");
  });
});
