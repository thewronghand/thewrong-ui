import { beforeAll, describe, expect, it } from "vitest";
import { relative } from "node:path";
import {
  analyzeContents,
  baselineIncreases,
  baselineLargeDecreases,
  cssCustomProperties,
  librarySourceFiles,
} from "./check-tokens.mjs";

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
  "text-text-primary",
  "bg-bg-card",
  "border-border-tertiary",
  "text-secondary-500",
  "bg-primary-500",
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
  "border-border-primary",
  "border-border-disabled",
  "border-border-danger",
  "bg-bg-disabled",
  "text-icon-primary",
  "text-icon-secondary",
  "text-icon-tertiary",
  "text-icon-disabled",
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

  it("Tailwind 기본 neutral 스케일은 팔레트 사용으로 잡는다", async () => {
    const result = await analyzeContents([{ rel: "palette.tsx", content: '"text-neutral-500"' }]);
    expect(result.details.palette.map(({ token }) => token)).toEqual(["text-neutral-500"]);
  });

  it("같은 클래스가 반복되면 파일별 출현 횟수를 센다", async () => {
    const result = await analyzeContents([
      { rel: "a.ts", content: '"dark:bg-white dark:bg-white"' },
      { rel: "b.ts", content: '"dark:bg-white"' },
    ]);
    expect(result.counts.dark).toEqual({ "a.ts": 2, "b.ts": 1 });
  });
});

describe("문자열 리터럴의 토큰 검사", () => {
  it("객체·JSX 속성·템플릿의 변수와 색을 검사하고 런타임 허용 목록을 적용한다", async () => {
    const content = [
      'const s = { background: "var(--color-bg-toastt)", color: "#FFFFFF" };',
      'const svg = <svg stroke="var(--p-color-violet-600)" />;',
      'const path = <path fill="var(--color-secondary-700)" />;',
      'const element = <div style={{ zIndex: "var(--z-floatng)" }} />;',
      'const template = `var(--p-color-gray-100) ${value} var(--z-floatng)`;',
      'const bare = "--p-color-gray-100";',
      'const valid = <div style={{ background: "var(--color-bg-surface)" }} />;',
      'const runtime = "var(--overlay-viewport-width)";',
      '// "var(--missing-comment)" "#f00" "--p-fake"',
    ].join("\n");
    const result = await analyzeContents([{ rel: "literals.tsx", content }], {
      allowedRuntimeVars: new Set(["--overlay-viewport-width"]),
    });
    expect(result.details.primitive.map(({ token }) => token)).toEqual([
      "--p-color-violet-600", "--p-color-gray-100", "--p-color-gray-100",
    ]);
    expect(result.details.palette.map(({ token }) => token)).toEqual(["#FFFFFF"]);
    expect(result.details.undefined.map(({ token }) => token)).toEqual([
      "--color-bg-toastt", "--color-secondary-700", "--z-floatng", "--z-floatng",
    ]);
    const denied = await analyzeContents([{ rel: "runtime.ts", content: 'const x = "var(--overlay-viewport-width)";' }]);
    expect(denied.details.undefined.map(({ token }) => token)).toEqual(["--overlay-viewport-width"]);
  });

  it("클래스 후보와 문자열 검사가 같은 위치를 중복 집계하지 않는다", async () => {
    const content = 'const x = "bg-(--p-color-gray-100) bg-[#fff] shadow-[inset_0_0_var(--color-primary-500)] bg-[var(--color-bg-surfce)]";';
    const result = await analyzeContents([{ rel: "overlap.tsx", content }]);
    expect(result.counts.primitive["overlap.tsx"]).toBe(1);
    expect(result.counts.palette["overlap.tsx"]).toBe(1);
    expect(result.counts.undefined["overlap.tsx"]).toBe(2);
  });
});

describe("라이브러리 소스 범위", () => {
  it("빌드의 source와 제외 목록을 사용한다", async () => {
    const files = (await librarySourceFiles()).map((file) => relative(process.cwd(), file));
    expect(files).toContain("src/components/toast/ToastProvider.tsx");
    expect(files).toContain("src/index.ts");
    expect(files).not.toContain("src/lib/utils.ts");
    expect(files).not.toContain("src/lib/utils.test.ts");
    expect(files.some((file) => file.endsWith(".stories.tsx"))).toBe(false);
  });
});

describe("기준선 파일별 증가", () => {
  it("합계가 그대로여도 다른 파일의 증가를 보고한다", () => {
    const previous = { dark: { "a.ts": 2, "b.ts": 1 }, palette: {} };
    const current = { dark: { "a.ts": 1, "b.ts": 2 }, palette: {} };
    expect(baselineIncreases(previous, current)).toEqual([
      { key: "dark", file: "b.ts", before: 1, after: 2 },
    ]);
  });

  it("파일 이름이 바뀌어도 자동으로 허용하지 않는다", () => {
    expect(baselineIncreases({ palette: { "old.ts": 1 } }, { palette: { "new.ts": 1 } })).toEqual([
      { key: "palette", file: "new.ts", before: 0, after: 1 },
    ]);
  });

  it("카테고리 전체가 50%를 초과해 감소한 경우만 보고한다", () => {
    expect(baselineLargeDecreases(
      { dark: { a: 10 }, palette: { a: 10 } },
      { dark: { a: 5 }, palette: { a: 4 } },
    )).toEqual([{ key: "palette", before: 10, after: 4 }]);
  });
});
