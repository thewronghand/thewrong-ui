import { beforeAll, describe, expect, it } from "vitest";
import { analyzeContents, baselineIncreases, cssCustomProperties } from "./check-tokens.mjs";

const invalid = [
  "bg-bg-surfce",
  "text-fg-defalt",
  "h-control-medum",
  "data-[state=open]:bg-bg-surfce3",
  "aria-[selected=true]:text-fg-typo",
  "[&>svg]:text-icon-primry",
  "[&_[data-x='a']]:bg-bg-surfce",
  "group-data-[open=true]:rounded-control-mediun",
  "ring-offset-bg-surfce8",
  "@md:bg-bg-surfce",
  "@min-[640px]/name:bg-bg-surfce",
  "bg-bg-surfce/[0.5]",
  "bg-x/[0.5]",
  "bg-(--color-bg-surfce)",
  "bg-[var(--color-bg-surfce)]",
  "unknown-variant:bg-(--color-bg-surfce)",
  "w-(--spacing-control-mediun)",
];
const valid = [
  "bg-bg-surface",
  "data-[state=open]:bg-bg-surface",
  "[&>svg]:text-fg-default",
  "ring-offset-bg-surface",
  "@md:h-control-medium",
  "bg-(--color-bg-surface)",
  "bg-bg-surface/[0.5]",
  "w-[200px]",
  "bottom-sheet",
];
const fixture = `
const a = [base, "bg-bg-surfce"].join(" ");
const b = [...rest, "text-fg-defalt"];
const c = [cond && "h-control-medum"];
const variants = ${JSON.stringify(invalid.slice(3))};
const valid = ${JSON.stringify(valid)};
const dark = "dark:bg-white [.dark_&]:bg-white [:where(.dark)_&]:bg-white";
const primitive = "bg-(--p-color-violet-600) w-[var(--p-color-violet-600)]";
`;

let analysis;
beforeAll(async () => {
  analysis = await analyzeContents([{ rel: "fixture.tsx", content: fixture }]);
});

describe("Tailwind 후보에서 토큰 검사", () => {
  it("CSS 주석을 변수 정의로 세지 않는다", () => {
    expect(cssCustomProperties("/* --color-fake: red; */ :root { --color-real: red; }")).toEqual([
      "--color-real",
    ]);
  });
  it.each(invalid)("정의되지 않은 후보 %s", (token) => {
    expect(analysis.details.undefined.map((item) => item.token)).toContain(token);
  });

  it("픽스처의 정의 없는 후보만 보고한다", () => {
    expect(analysis.details.undefined.map((item) => item.token).sort()).toEqual([...invalid].sort());
  });

  it.each(valid)("유효한 유틸과 일반 문자열 %s", (token) => {
    expect(analysis.details.undefined.map((item) => item.token)).not.toContain(token);
  });

  it("dark variant와 .dark를 참조하는 임의 variant를 센다", () => {
    expect(analysis.details.dark.map((item) => item.token)).toEqual([
      "dark:bg-white",
      "[.dark_&]:bg-white",
      "[:where(.dark)_&]:bg-white",
    ]);
    expect(analysis.counts.palette["fixture.tsx"]).toBe(3);
  });

  it("괄호와 var()로 프리미티브를 참조하면 센다", () => {
    expect(analysis.details.primitive.map((item) => item.token)).toEqual([
      "bg-(--p-color-violet-600)",
      "w-[var(--p-color-violet-600)]",
    ]);
  });

  it("같은 클래스가 반복되면 파일별 출현 횟수를 센다", async () => {
    const result = await analyzeContents([
      { rel: "a.ts", content: '"dark:bg-white dark:bg-white"' },
      { rel: "b.ts", content: '"dark:bg-white"' },
    ]);
    expect(result.counts.dark).toEqual({ "a.ts": 2, "b.ts": 1 });
  });
});

describe("기준선 파일별 증가", () => {
  it("합계가 그대로여도 다른 파일의 증가를 보고한다", () => {
    const previous = { dark: { "a.ts": 2, "b.ts": 1 }, palette: {}, legacy: {} };
    const current = { dark: { "a.ts": 1, "b.ts": 2 }, palette: {}, legacy: {} };
    expect(baselineIncreases(previous, current)).toEqual([
      { key: "dark", file: "b.ts", before: 1, after: 2 },
    ]);
  });

  it("파일 이름이 바뀌어도 자동으로 허용하지 않는다", () => {
    expect(baselineIncreases({ legacy: { "old.ts": 1 } }, { legacy: { "new.ts": 1 } })).toEqual([
      { key: "legacy", file: "new.ts", before: 0, after: 1 },
    ]);
  });
});
