import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Progress } from "./Progress";

describe("Progress 접근성", () => {
  it("결정형은 보정된 값과 범위를 전달한다", () => {
    const markup = renderToStaticMarkup(createElement(Progress, { value: 120, "aria-label": "전송" }));
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-label="전송"');
    expect(markup).toContain('aria-valuenow="100"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).toContain('width:100%');
  });

  it("불확정형은 값을 생략하고 움직임 감소 시 40%와 다른 전체 폭 줄무늬를 표시한다", () => {
    const markup = renderToStaticMarkup(createElement(Progress, { "aria-label": "전송 중" }));
    expect(markup).toContain('role="progressbar"');
    expect(markup).not.toMatch(/aria-value(?:now|min|max)/);
    expect(markup).toContain("progress-indeterminate");
    const css = readFileSync(resolve(process.cwd(), "src/styles/component-utils.css"), "utf8");
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.progress-indeterminate\s*\{([^}]*)\}/)?.[1];
    expect(reduced).toMatch(/animation:\s*none/);
    expect(reduced).toMatch(/width:\s*100%/);
    expect(reduced).toMatch(/repeating-linear-gradient\([^;]*var\(--color-primary\)[^;]*var\(--color-bg-subtle\)/);
  });
});
