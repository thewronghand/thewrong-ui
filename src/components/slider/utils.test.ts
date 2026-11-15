import { describe, expect, it } from "vitest";
import { normalizeSliderValue, sliderPercent } from "./utils";

describe("Slider 범위 계산", () => {
  it("음수에서 양수까지의 범위를 시작점으로 채운다", () => {
    expect(sliderPercent(-30, -30, 6)).toBe(0);
    expect(sliderPercent(-12, -30, 6)).toBe(50);
    expect(sliderPercent(6, -30, 6)).toBe(100);
    expect(sliderPercent(100, -30, 6)).toBe(100);
    expect(sliderPercent(5, 5, 5)).toBe(0);
  });
  it("시작점 기준 step에 맞추고 소수 계산 오차를 제거한다", () => {
    expect(normalizeSliderValue(-29.24, -30, 6, 0.5)).toBe(-29);
    expect(normalizeSliderValue(-29.75, -30, 6, 0.5)).toBe(-29.5);
    expect(normalizeSliderValue(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(normalizeSliderValue(2, 0.1, 1, 0.3)).toBe(1);
    expect(normalizeSliderValue(-50, -30, 6, 0.5)).toBe(-30);
    expect(normalizeSliderValue(1, 0, 1, 0.3)).toBe(0.9);
  });
});
