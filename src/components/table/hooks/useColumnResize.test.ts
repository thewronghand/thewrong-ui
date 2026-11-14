import { describe, expect, it } from "vitest";

import { getResizeStartWidth } from "./useColumnResize";

describe("리사이즈 시작 너비", () => {
  it("저장된 너비를 측정값보다 우선한다", () => {
    expect(getResizeStartWidth(180, 220, 150)).toBe(180);
  });

  it("저장된 너비가 없으면 실제 너비를 사용한다", () => {
    expect(getResizeStartWidth(undefined, 220, 150)).toBe(220);
  });

  it("측정할 수 없으면 기본 너비를 사용한다", () => {
    expect(getResizeStartWidth(undefined, undefined, 150)).toBe(150);
    expect(getResizeStartWidth(undefined, 0, 150)).toBe(150);
    expect(getResizeStartWidth(undefined, NaN, 150)).toBe(150);
  });
});
