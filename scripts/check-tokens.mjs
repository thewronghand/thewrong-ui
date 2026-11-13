#!/usr/bin/env node
/**
 * 토큰 사용 검사 (래칫 방식).
 *
 * 대상: src/components · src/hooks · src/lib 의 .ts/.tsx (스토리 `*.stories.tsx`·테스트 `*.test.ts(x)` 제외)
 *
 * 검사 항목
 *   1. dark        — `dark:` variant                                        (래칫)
 *   2. primitive   — 프리미티브 직접 참조 `--p-…`, `bg-p-…` 류                 (0이어야 통과)
 *   3. palette     — Tailwind 기본 팔레트(`bg-blue-500`)·white/black·hex 색 리터럴 (래칫)
 *   4. legacy      — 옛 토큰 클래스: 원시 스케일(`primary-500` 류), `neutral-N`,
 *                    옛 시맨틱(`text-text-*`, `bg-bg-card`, `border-border-primary` …) (래칫)
 *   5. undefined   — 색·radius·z·shadow 등 유틸이 가리키는 커스텀 프로퍼티가 CSS에 없음 (0이어야 통과)
 *
 * 래칫: 1·3·4는 scripts/token-baseline.json의 파일별 카운트보다 늘면 실패한다.
 *   줄면 통과하고 기준선 갱신을 안내한다(`npm run check:tokens -- --update-baseline`).
 *   기준선에 없는 새 파일의 기준은 0이다.
 *
 * 주석 제거: 문자열('…' "…" `…`) 밖의 `/* … *\/`와 `// …`를 공백으로 바꾼다(줄 수 유지).
 *   템플릿 리터럴의 `${}` 중첩은 따로 추적하지 않는다 — 클래스 문자열 검사에는 충분하다.
 *
 * 정규식 (variant 접두사 `hover:`·`md:` 등과 `!` 중요도 표기는 떼고 본다)
 *   유틸 토큰: 공백·따옴표·괄호·백틱으로 나뉜 조각 중 `[a-z-]+-…` 형태
 *   1. (?<![\w-])dark:
 *   2. --p-[a-z] 또는 <색 접두사>-p-[a-z]
 *   3. <색 접두사>-(<Tailwind 기본 팔레트 이름>)-<숫자>, <색 접두사>-(white|black),
 *      #[0-9a-f]{3|4|6|8} (단어 경계)
 *   4. <색 접두사>-(primary|secondary|error|warning|success|info)-<50~950>,
 *      <색 접두사>-neutral-<50~950>, 옛 시맨틱 22개 이름
 *   5. 색 접두사 유틸의 값 v에 대해 --color-v, rounded-*의 --radius-v, shadow-*의 --shadow-v,
 *      text-*의 --color-v/--text-v, z-*의 @utility 정의가 src/styles/*.css 또는
 *      tailwindcss/theme.css에 없으면 위반. 키워드(transparent·none·숫자 등)와 임의값([…])은 제외.
 *
 * 주의(3단계): 옛 시맨틱 중 border-primary·border-disabled·border-danger·bg-disabled·
 *   icon-primary/secondary/tertiary/disabled는 새 시맨틱과 이름이 같다(legacy.css 참조).
 *   치환 후 그 이름을 새 의미로 켜면 LEGACY_SEMANTIC에서 빼야 한다.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["src/components", "src/hooks", "src/lib"];
const BASELINE_PATH = join(ROOT, "scripts/token-baseline.json");
const RATCHET = ["dark", "palette", "legacy"];
const ZERO = ["primitive", "undefined"];

// ── 정의 수집 ────────────────────────────────────────────────────────────────
function listFiles(dir, filter) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, filter));
    else if (filter(name)) out.push(full);
  }
  return out;
}

const cssSources = [
  ...listFiles(join(ROOT, "src/styles"), (n) => n.endsWith(".css")),
  join(ROOT, "node_modules/tailwindcss/theme.css"),
].map((f) => readFileSync(f, "utf8"));
const definedVars = new Set();
const definedUtilities = new Set();
for (const css of cssSources) {
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) definedVars.add(m[1]);
  for (const m of css.matchAll(/@utility\s+([a-z0-9-]+)/gi))
    definedUtilities.add(m[1]);
}
const PALETTE = [
  ...new Set(
    [...definedVars]
      .map((v) => /^--color-([a-z]+)-\d+$/.exec(v)?.[1])
      .filter(
        (f) =>
          f &&
          readFileSync(
            join(ROOT, "node_modules/tailwindcss/theme.css"),
            "utf8",
          ).includes(`--color-${f}-500`),
      ),
  ),
].filter(
  (f) =>
    ![
      "primary",
      "secondary",
      "error",
      "warning",
      "success",
      "info",
      "neutral",
    ].includes(f),
);

// ── 패턴 ─────────────────────────────────────────────────────────────────────
const COLOR_PREFIX =
  "(?:bg|text|border(?:-[xytrblse])?|ring|ring-offset|fill|stroke|outline|divide|from|via|to|shadow|inset-shadow|decoration|accent|caret|placeholder)";
const SCALE = "(?:50|100|200|300|400|500|600|700|800|900|950)";
const LEGACY_SEMANTIC = [
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-disabled",
  "text-inverse",
  "text-danger",
  "border-primary",
  "border-secondary",
  "border-tertiary",
  "border-disabled",
  "border-danger",
  "bg-base-primary",
  "bg-base-secondary",
  "bg-base-tertiary",
  "bg-white",
  "bg-disabled",
  "bg-card",
  "icon-primary",
  "icon-secondary",
  "icon-tertiary",
  "icon-disabled",
  "icon-danger",
];

const RE = {
  dark: /(?<![\w-])dark:/g,
  primitive: new RegExp(`--p-[a-z]|(?<![\\w-])${COLOR_PREFIX}-p-[a-z]`, "g"),
  palette: new RegExp(
    `(?<![\\w-])${COLOR_PREFIX}-(?:(?:${PALETTE.join("|")})-${SCALE}|white|black)(?![\\w-])|#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\\b`,
    "g",
  ),
  legacy: new RegExp(
    `(?<![\\w-])${COLOR_PREFIX}-(?:(?:primary|secondary|error|warning|success|info|neutral)-${SCALE}|${LEGACY_SEMANTIC.join("|")})(?![\\w-])`,
    "g",
  ),
};

// ── 주석 제거 ────────────────────────────────────────────────────────────────
function stripComments(src) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += n ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    if (c === "/" && n === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      out += " ".repeat(stop - i);
      i = stop;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// ── 5. 정의 없는 토큰 유틸 ─────────────────────────────────────────────────
const KEYWORDS = new Set([
  "transparent",
  "current",
  "inherit",
  "none",
  "auto",
  "initial",
  // text
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
  "wrap",
  "nowrap",
  "balance",
  "pretty",
  "ellipsis",
  "clip",
  // border·outline·divide·decoration
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "collapse",
  "separate",
  "x",
  "y",
  "reverse",
  "wavy",
  "from-font",
  "clone",
  "slice",
  "inset",
  // bg
  "fixed",
  "local",
  "scroll",
  "cover",
  "contain",
  "bottom",
  "top",
  "repeat",
  "no-repeat",
  "repeat-x",
  "repeat-y",
  "repeat-round",
  "repeat-space",
  // radius
  "full",
]);
// 공백·따옴표·중괄호로 자른 조각. 임의값(`[…]`)이 든 조각은 통째로 건너뛰고(쉼표가 든
// `transition-[color,border-color]`를 쪼개지 않기 위해), 나머지는 괄호·쉼표로 한 번 더 자른다.
function classTokens(src) {
  const out = [];
  for (const piece of src.match(/[^\s"'`{}]+/g) ?? []) {
    if (piece.includes("[")) continue;
    for (const t of piece.split(/[(),;]+/)) {
      if (/^!?(?:[a-z0-9-]+:)*!?[a-z][a-z0-9-]*(?:\/[0-9]+)?$/.test(t))
        out.push(t);
    }
  }
  return out;
}
function isDefinedUtil(raw) {
  const cls = raw
    .replace(/^.*:/, "")
    .replace(/^!/, "")
    .replace(/\/[0-9]+$/, "");
  if (cls.includes("[") || cls.includes("(")) return true;
  let m;
  if ((m = /^z-(.+)$/.exec(cls))) {
    if (/^\d+$/.test(m[1]) || m[1] === "auto") return true;
    return definedUtilities.has(cls);
  }
  if (
    (m =
      /^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/.exec(
        cls,
      ))
  ) {
    const v = m[1];
    if (!v || KEYWORDS.has(v)) return true;
    return definedVars.has(`--radius-${v}`);
  }
  if ((m = /^shadow-(.+)$/.exec(cls))) {
    const v = m[1];
    if (KEYWORDS.has(v) || v === "inner") return true;
    return definedVars.has(`--shadow-${v}`) || definedVars.has(`--color-${v}`);
  }
  if ((m = new RegExp(`^${COLOR_PREFIX}-(.+)$`).exec(cls))) {
    const v = m[1];
    if (
      KEYWORDS.has(v) ||
      /^\d+(\.\d+)?$/.test(v) ||
      /^(offset|opacity|spacing|gradient|linear|radial|conic|clip|origin|blend|position|size)(-|$)/.test(
        v,
      )
    )
      return true;
    if (/^(x|y)-\d+$/.test(v) || /^(x|y)-reverse$/.test(v)) return true;
    // border-b·border-t-2 같은 방향 폭 유틸 (접두사 정규식이 방향 문자를 값으로 잡은 경우)
    if (/^border$/.test(cls.slice(0, 6)) && /^[xytrblse](-\d+)?$/.test(v))
      return true;
    // text-* 크기, border/ring/outline 폭 역할, decoration 두께
    if (
      definedVars.has(`--color-${v}`) ||
      definedVars.has(`--text-${v}`) ||
      definedVars.has(`--border-width-${v}`) ||
      definedVars.has(`--ring-width-${v}`) ||
      definedVars.has(`--shadow-${v}`) ||
      definedVars.has(`--inset-shadow-${v}`)
    )
      return true;
    // fill-*·stroke-* 숫자 두께, text-wrap 등은 위 키워드로 처리됨
    return false;
  }
  return true;
}

// 이미 알려진 정의 없는 유틸 — 컴포넌트 치환(3단계)에서 고친다. 새로 추가하지 않는다.
//   bg-brand-blue-secondary: 원본 프로젝트의 토큰 이름이 남은 것. 이 레포 CSS에 정의가 없어
//   배경이 칠해지지 않는다(프리셋 변경 표시 점).
const KNOWN_UNDEFINED = new Set([
  "src/components/table/components/ColumnPresetSelector.tsx bg-brand-blue-secondary",
]);
// 클래스가 아닌데 클래스처럼 생긴 문자열 — src/lib/utils.ts의 tailwind-merge 그룹 키.
const NOT_CLASS = new Set(["border-w", "ring-w"]);

// ── 실행 ─────────────────────────────────────────────────────────────────────
const files = SCAN_DIRS.flatMap((d) =>
  listFiles(
    join(ROOT, d),
    (n) =>
      /\.(ts|tsx)$/.test(n) &&
      !/\.stories\.tsx$/.test(n) &&
      !/\.test\.tsx?$/.test(n),
  ),
).sort();

const result = {
  dark: {},
  primitive: {},
  palette: {},
  legacy: {},
  undefined: {},
};
const examples = { primitive: [], undefined: [] };
for (const file of files) {
  const rel = relative(ROOT, file);
  const src = stripComments(readFileSync(file, "utf8"));
  for (const key of ["dark", "primitive", "palette", "legacy"]) {
    const hits = src.match(RE[key]) ?? [];
    if (hits.length) result[key][rel] = hits.length;
    if (key === "primitive")
      for (const h of hits) examples.primitive.push(`${rel}: ${h}`);
  }
  let undef = 0;
  for (const token of classTokens(src)) {
    if (NOT_CLASS.has(token)) continue;
    if (!isDefinedUtil(token) && !KNOWN_UNDEFINED.has(`${rel} ${token}`)) {
      undef++;
      examples.undefined.push(`${rel}: ${token}`);
    }
  }
  if (undef) result.undefined[rel] = undef;
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const updateBaseline = process.argv.includes("--update-baseline");

console.log("[check:tokens] 집계 (스토리·테스트 제외)");
for (const key of [...RATCHET, ...ZERO])
  console.log(`  ${key.padEnd(10)} ${sum(result[key])}`);

let failed = false;
for (const key of ZERO) {
  if (sum(result[key]) > 0) {
    failed = true;
    console.log(`\n✗ ${key}: 0이어야 한다`);
    for (const e of examples[key].slice(0, 50)) console.log(`    ${e}`);
  }
}

if (updateBaseline) {
  const baseline = {
    note: "check-tokens.mjs 래칫 기준선 — 파일별 카운트. 줄었을 때만 갱신한다.",
    counts: {},
  };
  for (const key of RATCHET) baseline.counts[key] = result[key];
  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`\n기준선 갱신: ${relative(ROOT, BASELINE_PATH)}`);
} else {
  if (!existsSync(BASELINE_PATH)) {
    console.log(
      `\n✗ 기준선 파일이 없다: ${relative(ROOT, BASELINE_PATH)} (--update-baseline으로 생성)`,
    );
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")).counts;
  let shrunk = false;
  for (const key of RATCHET) {
    const base = baseline[key] ?? {};
    for (const [file, count] of Object.entries(result[key])) {
      const allowed = base[file] ?? 0;
      if (count > allowed) {
        failed = true;
        console.log(`\n✗ ${key} 증가: ${file} ${allowed} → ${count}`);
      }
    }
    for (const [file, allowed] of Object.entries(base)) {
      if ((result[key][file] ?? 0) < allowed) shrunk = true;
    }
  }
  if (!failed && shrunk) {
    console.log(
      "\n기준선보다 줄었다. 기준선을 갱신하라: npm run check:tokens -- --update-baseline",
    );
  }
}

if (failed) {
  console.log("\n[check:tokens] 실패");
  process.exit(1);
}
console.log("\n[check:tokens] 통과");
