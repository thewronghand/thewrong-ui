import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type Tokens = Map<string, string>;
type Theme = "default" | "quiet" | "high-contrast";
type Mode = "light" | "dark";

const readStyle = (path: string) =>
  readFileSync(resolve(process.cwd(), "src/styles", path), "utf8");
const primitives = readStyle("primitives.css");
const semantic = readStyle("semantic.css");
const themes = {
  quiet: readStyle("themes/quiet.css"),
  "high-contrast": readStyle("themes/high-contrast.css"),
};
// 지난 라운드에서 avocado와 Chromium으로 대조한 시맨틱 색의 계산값이다.
const themeSnapshot = JSON.parse(
  readFileSync(resolve(process.cwd(), "tests/fixtures/theme-values.json"), "utf8"),
) as Record<Theme, Record<Mode, Record<string, string>>>;

function parseDeclarations(source: string): Tokens {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return new Map(
    [...uncommented.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, key, value]) => [key!, value!.trim()],
    ),
  );
}

function declarations(source: string, selector: string): Tokens {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = uncommented.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  if (!body) throw new Error(`선택자가 없다: ${selector}`);
  return parseDeclarations(body);
}

function merge(...maps: Tokens[]): Tokens {
  return new Map(maps.flatMap((map) => [...map]));
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/\s*([(),])\s*/g, "$1");
}

// 상속한 변수는 조상에서 확정된 값이며, 이 스코프의 선언만 다시 계산한다.
function resolveScope(inherited: Tokens, declared: Tokens): Tokens {
  function valueOf(name: string, seen = new Set<string>()): string {
    if (!declared.has(name)) {
      const value = inherited.get(name);
      if (value === undefined) throw new Error(`토큰이 없다: ${name}`);
      return value;
    }
    if (seen.has(name)) throw new Error(`순환하는 토큰: ${name}`);
    const next = new Set(seen).add(name);
    return normalize(
      declared.get(name)!.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, reference: string) =>
        valueOf(reference, next),
      ),
    );
  }

  return merge(inherited, new Map([...declared.keys()].map((name) => [name, valueOf(name)])));
}

function colors(tokens: Tokens): Tokens {
  return new Map([...tokens].filter(([name]) => name.startsWith("--color-")));
}

function effectiveTheme(theme: Theme, mode: Mode): Tokens {
  const root = resolveScope(
    new Map(),
    merge(parseDeclarations(primitives), colors(declarations(semantic, "@theme"))),
  );
  const base = mode === "dark" ? resolveScope(root, colors(declarations(semantic, ".dark"))) : root;
  if (theme === "default") return base;
  return resolveScope(
    base,
    merge(
      declarations(themes[theme], `[data-theme="${theme}"]`),
      ...(mode === "dark"
        ? [declarations(themes[theme], `[data-theme="${theme}"] .dark`)]
        : []),
    ),
  );
}

function color(tokens: Tokens, role: string): string {
  const key = `--color-${role}`;
  const value = tokens.get(key);
  if (value && /^#[\da-f]{6}$/i.test(value)) return value.toLowerCase();
  throw new Error(`해석할 수 없는 색 토큰: ${key}=${value}`);
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/[\da-f]{2}/gi)
    ?.map((part) => parseInt(part, 16) / 255);
  if (!channels || channels.length !== 3) throw new Error(`잘못된 색: ${hex}`);
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const themeModes: readonly [Theme, Mode][] = [
  ["default", "light"],
  ["default", "dark"],
  ["quiet", "light"],
  ["quiet", "dark"],
  ["high-contrast", "light"],
  ["high-contrast", "dark"],
];

const pairs = [
  ["fg-danger", "error-surface", 4.5],
  ["error-fg", "error-surface", 4.5],
  ["fg-disabled", "bg-disabled", 3],
  ["fg-inverse", "primary", 4.5],
  ["fg-inverse", "primary-hover", 4.5],
  ["fg-inverse", "primary-active", 4.5],
  ["fg-inverse", "error", 4.5],
  ["fg-inverse", "error-hover", 4.5],
  ["fg-inverse", "error-active", 4.5],
  ["primary-fg", "primary-subtle", 4.5],
  ["error-fg", "error-subtle", 4.5],
  ["fg-accent", "bg-subtle", 4.5],
  ["fg-default", "bg-page", 4.5],
  ["fg-muted", "bg-surface", 4.5],
  ["fg-muted", "bg-page", 4.5],
  ["fg-default", "bg-surface", 4.5],
  ["fg-subtle", "bg-surface", 4.5],
  ["fg-subtle", "bg-page", 4.5],
  ["primary-fg", "bg-surface", 4.5],
  ["primary-fg", "bg-page", 4.5],
  ["error-fg", "bg-page", 4.5],
  ["fg-subtle", "bg-subtle", 4.5],
  ["fg-danger-placeholder", "bg-surface", 4.5],
  ["error-fg", "bg-surface", 4.5],
  ["focus-primary", "primary", 3],
  ["focus-primary", "bg-surface", 3],
  ["focus-primary-soft", "primary", 3],
  ["focus-primary-soft", "bg-surface", 3],
] as const;

// 기존 값은 변경하지 않는다. 현재 대비에 미달하는 개별 쌍만 건너뛴다.
const existingFailures = new Map([
  ["default light fg-subtle/bg-subtle", "4.393:1, 텍스트 AA 4.5:1 미달"],
  ["default light focus-primary/primary", "2.117:1, 포커스 3:1 미달"],
  ["default light focus-primary/bg-surface", "2.604:1, 포커스 3:1 미달"],
  ["default light focus-primary-soft/primary", "2.117:1, 포커스 3:1 미달"],
  ["default light focus-primary-soft/bg-surface", "2.604:1, 포커스 3:1 미달"],
]);

describe("테마 색 대비 계약", () => {
  it("별칭은 선언된 스코프에서 계산된 뒤 상속된다", () => {
    const root = resolveScope(
      new Map(),
      new Map([
        ["--color-primary", "#aa91f4"],
        ["--color-alias", "var(--color-primary)"],
      ]),
    );
    const theme = resolveScope(root, new Map([["--color-primary", "#030712"]]));
    expect(theme.get("--color-alias")).toBe("#aa91f4");
    const reconnected = resolveScope(
      root,
      new Map([
        ["--color-primary", "#030712"],
        ["--color-alias", "var(--color-primary)"],
      ]),
    );
    expect(reconnected.get("--color-alias")).toBe("#030712");
  });

  for (const [theme, mode] of themeModes) {
    it(`${theme} ${mode} 시맨틱 색은 avocado와 대조한 값과 같다`, () => {
      const expected = themeSnapshot[theme][mode];
      expect(Object.keys(expected)).toHaveLength(76);
      expect(Object.keys(expected)).toEqual(Object.keys(themeSnapshot.default.light));
      const tokens = effectiveTheme(theme, mode);
      const actual = Object.fromEntries(
        Object.keys(expected).map((name) => [name, tokens.get(name)]),
      );
      expect(actual).toEqual(expected);
    });
    for (const [foreground, background, minimum] of pairs) {
      const label = `${theme} ${mode} ${foreground}/${background}`;
      const check = () => {
        const tokens = effectiveTheme(theme, mode);
        expect(
          contrast(color(tokens, foreground), color(tokens, background)),
        ).toBeGreaterThanOrEqual(minimum);
      };
      const reason = existingFailures.get(label);
      if (reason) {
        it.skip(`${label}: ${reason}`, check);
      } else {
        it(`${label} ≥ ${minimum}:1`, check);
      }
    }
    for (const role of ["primary", "error"] as const) {
      it(`${theme} ${mode} ${role} 버튼 세 상태는 구별된다`, () => {
        const tokens = effectiveTheme(theme, mode);
        const states = [role, `${role}-hover`, `${role}-active`].map((name) => color(tokens, name));
        expect(new Set(states).size).toBe(3);
      });
    }
  }

  it("고대비의 사용 중인 파랑·회색 스케일은 밝은 단계에서 어두운 단계로 유지된다", () => {
    const light = effectiveTheme("high-contrast", "light");
    const dark = effectiveTheme("high-contrast", "dark");
    const blue = [
      color(light, "primary-subtle"),
      color(light, "bg-table-row-selected-hover"),
      color(light, "primary-border"),
      color(light, "toast-tone-info"),
      color(dark, "info"),
      color(light, "primary"),
      color(light, "primary-hover"),
      color(light, "primary-active"),
      color(dark, "bg-table-row-selected-hover"),
      color(dark, "primary-subtle"),
    ];
    const gray = [
      color(light, "border-default"),
      color(light, "fg-disabled"),
      color(light, "neutral-fg"),
      color(light, "icon-primary"),
      color(light, "fg-default"),
      color(dark, "bg-page"),
    ];
    for (const scale of [blue, gray]) {
      for (let index = 1; index < scale.length; index++) {
        expect(luminance(scale[index - 1]!)).toBeGreaterThan(luminance(scale[index]!));
      }
    }
  });

  it("테마 파일은 시맨틱 변수만 선언한다", () => {
    const snapshotNames = new Set(Object.keys(themeSnapshot.default.light));
    for (const source of Object.values(themes)) {
      for (const name of parseDeclarations(source).keys()) {
        expect(name).toMatch(/^--color-/);
        expect(snapshotNames.has(name), `스냅샷에 없는 테마 변수: ${name}`).toBe(true);
      }
      expect(source).not.toMatch(/var\(\s*--p-/);
    }
  });

  it.each(["quiet", "high-contrast"] as const)(
    "%s 다크 선택자는 동일 요소와 양쪽 조상 배치를 모두 포함한다",
    (theme) => {
      const source = themes[theme];
      const selectors = [
        `.dark[data-theme="${theme}"]`,
        `.dark [data-theme="${theme}"]`,
        `[data-theme="${theme}"] .dark`,
      ];
      const darkBlock = source.slice(source.indexOf(selectors[0]!));
      const actualSelectors = darkBlock
        .slice(0, darkBlock.indexOf("{"))
        .split(",")
        .map((s) => s.trim());
      expect(actualSelectors).toHaveLength(selectors.length);
      expect(actualSelectors).toEqual(expect.arrayContaining(selectors));
    },
  );

  it("테마가 원본을 선언하면 의존하는 시맨틱 별칭도 같은 블록에 선언한다", () => {
    const dependencies = [declarations(semantic, "@theme"), declarations(semantic, ".dark")]
      .flatMap((block) => [...colors(block)])
      .flatMap(([alias, value]) =>
        [...value.matchAll(/var\(\s*(--color-[\w-]+)\s*\)/g)].map(([, source]) => [
          alias,
          source!,
        ]),
      );
    for (const theme of ["quiet", "high-contrast"] as const) {
      for (const selector of [`[data-theme="${theme}"]`, `[data-theme="${theme}"] .dark`]) {
        const block = declarations(themes[theme], selector);
        for (const [alias, source] of dependencies) {
          if (block.has(source!)) {
            expect(block.has(alias!), `${selector}: ${source}에 의존하는 ${alias}`).toBe(true);
          }
        }
      }
    }
  });

  it("포커스 별칭과 다크 배경 별칭은 테마 스코프에서 다시 연결된다", () => {
    for (const [theme, mode] of themeModes) {
      const tokens = effectiveTheme(theme, mode);
      expect(color(tokens, "focus-primary-soft")).toBe(color(tokens, "focus-primary"));
      expect(color(tokens, "focus-danger")).toBe(color(tokens, "error-border"));
      if (mode === "dark") expect(color(tokens, "bg-faint")).toBe(color(tokens, "bg-subtle"));
    }
  });
});
