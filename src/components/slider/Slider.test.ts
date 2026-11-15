import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("네이티브 입력에 슬라이더 스타일을 연결한다", () => {
    const markup = renderToStaticMarkup(createElement(Slider, { "aria-label": "음량" }));
    expect(markup).toMatch(/class="[^"]*\bui-slider\b/);
  });

  for (const engine of ["webkit", "moz"] as const) {
    const css = readFileSync(resolve(process.cwd(), "src/styles/component-utils.css"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = (selector: string) => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const body = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
      expect(body, `${selector} 규칙`).toBeDefined();
      return body ?? "";
    };

    it(`${engine} 트랙은 primary-fg 채움과 icon-secondary 나머지를 사용한다`, () => {
      const selector = engine === "webkit"
        ? ".ui-slider::-webkit-slider-runnable-track"
        : ".ui-slider::-moz-range-track";
      expect(rule(selector)).toMatch(
        /background:\s*linear-gradient\(\s*to right,\s*var\(--color-primary-fg\)\s+var\(--slider-fill\),\s*var\(--color-icon-secondary\)\s+var\(--slider-fill\)\s*\)\s*;/,
      );
    });

    it(`${engine} thumb는 primary-fg 테두리와 surface 배경을 사용한다`, () => {
      const selector = engine === "webkit"
        ? ".ui-slider::-webkit-slider-thumb"
        : ".ui-slider::-moz-range-thumb";
      const thumb = rule(selector);
      expect(thumb).toMatch(/border:\s*2px\s+solid\s+var\(--color-primary-fg\)\s*;/);
      expect(thumb).toMatch(/background:\s*var\(--color-bg-surface\)\s*;/);
    });
  }
});
