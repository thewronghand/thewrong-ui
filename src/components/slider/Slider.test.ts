import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./Slider";

describe("Slider 컴포넌트", () => {
  it("정규화한 값을 formatValue에 전달하고 접근성 값으로 사용한다", () => {
    const formatValue = vi.fn((value: number) => `${value} 데시벨`);
    const markup = renderToStaticMarkup(createElement(Slider, {
      "aria-label": "음량", min: -30, max: 6, step: 0.5,
      value: -29.24, formatValue, "aria-valuetext": "대체 값",
    }));
    expect(formatValue).toHaveBeenCalledWith(-29);
    expect(markup).toContain('value="-29"');
    expect(markup).toContain('aria-valuetext="-29 데시벨"');
    expect(markup).not.toContain("대체 값");
  });

  it("formatValue가 없으면 명시한 접근성 값을 유지한다", () => {
    const markup = renderToStaticMarkup(createElement(Slider, {
      "aria-label": "음량", "aria-valuetext": "보통",
    }));
    expect(markup).toContain('aria-valuetext="보통"');
  });
});
