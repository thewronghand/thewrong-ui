import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

type SourceEntry = { path: string; source: string };

function runtimeSources(directory: string): SourceEntry[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return runtimeSources(path);
    if (!/\.(?:ts|tsx|css)$/.test(entry)) return [];
    if (/\.(?:test|spec|stories|config|gen)\.(?:ts|tsx|css)$/.test(entry)) return [];
    if (entry.endsWith(".d.ts")) return [];
    return [{ path: relative(process.cwd(), path), source: readFileSync(path, "utf8") }];
  });
}

function forbiddenFocusColors(entries: readonly SourceEntry[]): string[] {
  const utility =
    /(?:^|[\s"'`])([^\s"'`]+:ring-(?:primary-border(?:\/40)?|error-border)|ring-error-border)(?=$|[\s"'`])/g;
  const apply = /@apply\s+[^;{}]*\b(?:[\w-]+:)*ring-(?:primary-border(?:\/40)?|error-border)\b/g;
  const nativeFocus = /:(?:focus|focus-visible|focus-within)\b/;
  const forbidden =
    /var\(\s*--color-(?:primary-border|error-border)\s*\)|--color-(?:primary-border|error-border)\b/g;
  return entries.flatMap(({ path, source }) => {
    const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const violations = [...uncommented.matchAll(utility)]
      .map((match) => match[1]!)
      .filter((token) => token.includes("focus") || token.includes("ring-error-border"))
      .map((token) => `${path}: ${token}`);
    if (!path.endsWith(".css")) return violations;
    violations.push(...[...uncommented.matchAll(apply)].map(([match]) => `${path}: ${match.trim()}`));
    for (const [, selector, body] of uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!selector || !body || !nativeFocus.test(selector)) continue;
      for (const token of body.matchAll(forbidden)) {
        violations.push(`${path}: ${selector.trim()} uses ${token[0]}`);
      }
    }
    return violations;
  });
}

describe("포커스 링 소스 계약", () => {
  it("실행 코드의 포커스 링에 경계선 색을 사용하지 않는다", () => {
    const entries = runtimeSources(resolve(process.cwd(), "src"));
    expect(entries.map((entry) => entry.path)).toContain("src/styles/component-utils.css");
    expect(
      entries.find((entry) => entry.path === "src/components/button/utils.ts")
        ?.source,
    ).toContain("focus-visible:ring-focus-primary");
    expect(forbiddenFocusColors(entries)).toEqual([]);
  });

  it("유틸리티·CSS의 금지 패턴을 찾아낸다", () => {
    const violations = forbiddenFocusColors([
      { path: "example.tsx", source: '"focus-visible:ring-primary-border/40 focus:ring-error-border"' },
      {
        path: "example.css",
        source:
          ".control { @apply focus-visible:ring-error-border; } .control:focus-visible { color: var(--color-primary-border); }",
      },
    ]);
    expect(violations).toHaveLength(4);
    expect(violations.join("\n")).toContain("ring-primary-border/40");
    expect(violations.join("\n")).toContain("ring-error-border");
    expect(violations.join("\n")).toContain("--color-primary-border");
  });
});
