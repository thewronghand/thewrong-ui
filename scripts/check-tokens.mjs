#!/usr/bin/env node
/**
 * 토큰 사용 검사 (래칫 방식).
 * src/components · src/hooks · src/lib의 ts/tsx에서 스토리와 테스트를 제외한다.
 * Tailwind의 스캐너가 보는 후보를 파일별 출현 횟수로 집계한다. 주석도 스캔된다.
 * dark·palette·legacy는 파일별 기준선보다 증가할 수 없고, primitive·undefined는 0이어야 한다.
 * 기준선 갱신 시 파일별 증가가 하나라도 있으면 --force가 필요하다 (파일명 변경 포함).
 * 동적으로 조합한 클래스와 역할 이름 자체의 오타는 스캐너가 찾지 못할 수 있다.
 * 3단계에서 옛 이름과 새 의미가 겹치는 LEGACY_SEMANTIC 항목을 정리해야 한다.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Scanner } from "@tailwindcss/oxide";
import { __unstable__loadDesignSystem, compile } from "@tailwindcss/node";
import postcss from "postcss";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["src/components", "src/hooks", "src/lib"];
const BASELINE_PATH = join(ROOT, "scripts/token-baseline.json");
const RATCHET = ["dark", "palette", "legacy"];
const ZERO = ["primitive", "undefined"];

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

const tokenCssSources = listFiles(join(ROOT, "src/styles"), (n) => n.endsWith(".css"))
  .map((f) => readFileSync(f, "utf8"));
const defaultCss = readFileSync(join(ROOT, "node_modules/tailwindcss/theme.css"), "utf8");
const cssSources = [...tokenCssSources, defaultCss];

export function cssCustomProperties(css) {
  const names = [];
  postcss.parse(css).walkDecls((decl) => {
    if (decl.prop.startsWith("--")) names.push(decl.prop);
  });
  return names;
}

const definedTokenVars = new Set(tokenCssSources.flatMap(cssCustomProperties));
const defaultVars = new Set(cssCustomProperties(defaultCss));
const definedVars = new Set(cssSources.flatMap(cssCustomProperties));

const PALETTE = [
  ...new Set(
    [...definedVars]
      .map((v) => /^--color-([a-z]+)-\d+$/.exec(v)?.[1])
      .filter(
        (f) =>
          f &&
          defaultCss.includes(`--color-${f}-500`),
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
  "(?:ring-offset|inset-ring|inset-shadow|bg|text|border(?:-[xytrblse])?|ring|fill|stroke|outline|divide|from|via|to|shadow|decoration|accent|caret|placeholder)";
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

const KEYWORDS = new Set([
  "transparent",
  "current",
  "inherit",
  "none",
  "auto",
  "initial",
  "white",
  "black",
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
const ROLE = /(?:^|-)(?:control|slot|button|toast|table|surface|overlay|floating|tooltip|badge|sheet|chip|checkbox|input|focus|radio|spinner|icon|body|display)(?:-|$)/;
const ROLE_UTIL = /^-?(?:h|w|size|min-h|min-w|max-h|max-w|p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|start|end|translate|translate-x|translate-y|font|leading|tracking)-(.+)$/;
const MOTION_UTIL = /^(duration|delay|ease|opacity|animate)-(.+)$/;

function isTokenCandidate(cls) {
  if (cls.includes("[") || cls.includes("(")) return false;
  let m;
  if ((m = /^z-(.+)$/.exec(cls))) {
    return !/^\d+$/.test(m[1]) && m[1] !== "auto";
  }
  if (
    (m =
      /^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/.exec(
        cls,
      ))
  ) {
    const v = m[1];
    return Boolean(v) && !KEYWORDS.has(v) && !defaultVars.has(`--radius-${v}`);
  }
  if ((m = /^shadow-(.+)$/.exec(cls))) {
    const v = m[1];
    return (
      !KEYWORDS.has(v) &&
      v !== "inner" &&
      !defaultVars.has(`--shadow-${v}`) &&
      !defaultVars.has(`--color-${v}`)
    );
  }
  if ((m = new RegExp(`^${COLOR_PREFIX}-(.+)$`).exec(cls))) {
    const v = m[1];
    if (
      (KEYWORDS.has(v) && !/^bg-[xy]$/.test(cls)) ||
      /^\d+(\.\d+)?$/.test(v) ||
      defaultVars.has(`--color-${v}`) ||
      defaultVars.has(`--text-${v}`) ||
      /^(offset|opacity|spacing|gradient|linear|radial|conic|clip|origin|blend|position|size)(-|$)/.test(
        v,
      )
    )
      return false;
    if (/^(x|y)-\d+$/.test(v) || /^(x|y)-reverse$/.test(v)) return false;
    // border-b·border-t-2 같은 방향 폭 유틸 (접두사 정규식이 방향 문자를 값으로 잡은 경우)
    if (/^border$/.test(cls.slice(0, 6)) && /^[xytrblse](-\d+)?$/.test(v))
      return false;
    return true;
  }
  if ((m = ROLE_UTIL.exec(cls))) return ROLE.test(m[1]);
  if ((m = MOTION_UTIL.exec(cls))) {
    const [, prefix, value] = m;
    return (
      !/^\d+(?:\.\d+)?$/.test(value) &&
      !KEYWORDS.has(value) &&
      cls !== "ease-linear" &&
      !defaultVars.has(`--${prefix}-${value}`)
    );
  }
  return false;
}


// 이 값은 실제 클래스가 아닌 문자열이다 (tailwind-merge 그룹 키·모달 표시 방식·CSS 설명).
const NOT_CLASS = new Set(["border-w", "ring-w", "bottom-sheet", "z-index"]);
// 원본 프로젝트에만 정의된 유틸은 컴포넌트 치환(3단계)에서 처리한다.
const KNOWN_UNDEFINED = new Set([
  "src/components/table/components/ColumnPresetSelector.tsx bg-brand-blue-secondary",
]);

// Tailwind 파서가 인식하지 못하는 variant도 검사할 수 있도록 바깥쪽 콜론만 나눈다.
// 소스 코드의 문자열·배열 경계는 스캐너가 이미 처리한다.
function splitCandidate(raw) {
  const parts = [];
  const stack = [];
  let quote = null;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (stack.length && (c === "'" || c === '"' || c === "`")) {
      quote = c;
    } else if (c === "[" || c === "(") {
      stack.push(c === "[" ? "]" : ")");
    } else if (c === stack.at(-1)) {
      stack.pop();
    } else if (c === ":" && stack.length === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return { variants: parts.slice(0, -1), utility: parts.at(-1) };
}

function variantHasDark(variant) {
  if (variant.kind === "static" && variant.root === "dark") return true;
  if (variant.kind === "arbitrary")
    return /\.dark(?![a-z0-9_-])/i.test(variant.selector);
  return variant.kind === "compound" && variantHasDark(variant.variant);
}

// CSS.escape의 식별자 직렬화. build()가 만든 이스케이프된 셀렉터를 찾는 데 쓴다.
function escapeIdentifier(value) {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c === 0) out += "\uFFFD";
    else if (
      (c >= 1 && c <= 31) || c === 127 ||
      (i === 0 && c >= 48 && c <= 57) ||
      (i === 1 && c >= 48 && c <= 57 && value.charCodeAt(0) === 45)
    ) out += `\\${c.toString(16)} `;
    else if (i === 0 && c === 45 && value.length === 1) out += "\\-";
    else if (c >= 128 || c === 45 || c === 95 || (c >= 48 && c <= 57) ||
      (c >= 65 && c <= 90) || (c >= 97 && c <= 122)) out += value[i];
    else out += `\\${value[i]}`;
  }
  return out;
}

function customPropertyRefs(utility, parsed) {
  // 괄호 축약형은 Tailwind 파서가 var(--…)로 변환한다.
  const values = [utility];
  if (parsed?.kind === "functional" && parsed.value?.kind === "arbitrary")
    values.push(parsed.value.value);
  if (parsed?.kind === "arbitrary") values.push(parsed.value);
  if (parsed?.modifier?.kind === "arbitrary") values.push(parsed.modifier.value);
  return [...new Set(values.flatMap((value) =>
    [...value.matchAll(/var\(\s*(--[a-z0-9_-]+)/gi)].map((m) => m[1]),
  ))];
}

// 테스트와 CLI가 같은 스캐너·분류·컴파일 경로를 사용한다.
export async function analyzeContents(contents) {
  const cssPath = join(ROOT, "src/styles/index.css");
  const css = readFileSync(cssPath, "utf8");
  const options = { base: dirname(cssPath), onDependency: () => {} };
  const [design, compiler] = await Promise.all([
    __unstable__loadDesignSystem(css, { base: options.base }),
    compile(css, options),
  ]);
  const scanner = new Scanner({ sources: [] });
  const cache = new Map();
  const result = { dark: {}, primitive: {}, palette: {}, legacy: {}, undefined: {} };
  const details = { dark: [], primitive: [], palette: [], legacy: [], undefined: [] };
  const toCompile = [];
  const record = (key, rel, token, position, reason = token) => {
    result[key][rel] = (result[key][rel] ?? 0) + 1;
    details[key].push({ rel, token, position, reason });
  };

  for (const { rel, content, extension = "tsx" } of contents) {
    for (const { candidate: token, position } of scanner.getCandidatesWithPositions({ content, extension })) {
      let info = cache.get(token);
      if (!info) {
        const parsed = design.parseCandidate(token)[0];
        const split = parsed ? null : splitCandidate(token);
        const utilityParsed = parsed ?? design.parseCandidate(split.utility)[0];
        const utility = utilityParsed
          ? design.printCandidate({ ...utilityParsed, variants: [], important: false })
          : split.utility.replace(/^!|!$/g, "");
        const unmodified = utilityParsed?.kind === "functional"
          ? design.printCandidate({ ...utilityParsed, variants: [], important: false, modifier: null })
          : utility.replace(/\/(?:\d+(?:\.\d+)?|\[[^\]]+\])$/, "");
        const dark = parsed
          ? parsed.variants.some(variantHasDark)
          : split.variants.some((v) => v === "dark" || (v.startsWith("[") && /\.dark(?![a-z0-9_-])/i.test(v)));
        info = { utility, unmodified, dark, refs: customPropertyRefs(utility, utilityParsed) };
        cache.set(token, info);
      }
      const { utility, unmodified, dark, refs } = info;
      if (dark) record("dark", rel, token, position);
      for (const key of ["primitive", "palette", "legacy"]) {
        for (const match of utility.matchAll(RE[key])) record(key, rel, token, position, match[0]);
      }
      const missing = refs.filter((name) => !definedTokenVars.has(name));
      if (missing.length) {
        record("undefined", rel, token, position, `정의되지 않은 변수: ${missing.join(", ")}`);
      } else if (
        !NOT_CLASS.has(unmodified) &&
        (isTokenCandidate(unmodified) || refs.length > 0) &&
        !KNOWN_UNDEFINED.has(`${rel} ${token}`)
      ) {
        toCompile.push({ rel, token, position, utility });
      }
    }
  }

  const compiledCss = compiler.build([...new Set(toCompile.map(({ utility }) => utility))]);
  for (const { rel, token, position, utility } of toCompile) {
    if (!compiledCss.includes(`.${escapeIdentifier(utility)} {`))
      record("undefined", rel, token, position, "Tailwind CSS 미생성");
  }
  return { counts: result, details };
}

export function baselineIncreases(previous, current) {
  return RATCHET.flatMap((key) => Object.entries(current[key] ?? {})
    .filter(([file, count]) => count > (previous[key]?.[file] ?? 0))
    .map(([file, count]) => ({ key, file, before: previous[key]?.[file] ?? 0, after: count })));
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
async function main() {
  const files = SCAN_DIRS.flatMap((d) => listFiles(join(ROOT, d), (n) =>
    /\.(ts|tsx)$/.test(n) && !/\.stories\.tsx$/.test(n) && !/\.test\.tsx?$/.test(n),
  )).sort();
  const contents = files.map((file) => ({
    rel: relative(ROOT, file), content: readFileSync(file, "utf8"),
    extension: file.endsWith(".tsx") ? "tsx" : "ts",
  }));
  const { counts: result, details } = await analyzeContents(contents);
  const updateBaseline = process.argv.includes("--update-baseline");

  console.log("[check:tokens] 집계 (스토리·테스트 제외)");
  for (const key of [...RATCHET, ...ZERO]) console.log(`  ${key.padEnd(10)} ${sum(result[key])}`);
  let failed = false;
  for (const key of ZERO) {
    if (sum(result[key]) > 0) {
      failed = true;
      console.log(`\n✗ ${key}: 0이어야 한다`);
      for (const { rel, token, reason } of details[key].slice(0, 50))
        console.log(`    ${rel}: ${token} (${reason})`);
    }
  }
  const baselineExists = existsSync(BASELINE_PATH);
  const previous = baselineExists ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")).counts : {};
  const increases = baselineIncreases(previous, result);
  if (updateBaseline) {
    if (baselineExists && !process.argv.includes("--force")) {
      for (const { key, file, before, after } of increases) {
        failed = true;
        console.log(`\n✗ ${key} 파일별 증가: ${file} ${before} → ${after} (갱신하려면 --force)`);
      }
    }
    if (failed) {
      console.log("\n[check:tokens] 실패 — 기준선을 갱신하지 않았다");
      process.exitCode = 1;
      return;
    }
    const baseline = {
      note: "check-tokens.mjs 래칫 기준선 — 파일별 카운트. 파일별 증가에는 --force가 필요하다.",
      counts: Object.fromEntries(RATCHET.map((key) => [key, result[key]])),
    };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`\n기준선 갱신: ${relative(ROOT, BASELINE_PATH)}`);
  } else {
    if (!baselineExists) {
      console.log(`\n✗ 기준선 파일이 없다: ${relative(ROOT, BASELINE_PATH)} (--update-baseline으로 생성)`);
      process.exitCode = 1;
      return;
    }
    for (const { key, file, before, after } of increases) {
      failed = true;
      console.log(`\n✗ ${key} 증가: ${file} ${before} → ${after}`);
    }
    const shrunk = RATCHET.some((key) => Object.entries(previous[key] ?? {})
      .some(([file, allowed]) => (result[key][file] ?? 0) < allowed));
    if (!failed && shrunk)
      console.log("\n기준선보다 줄었다. 기준선을 갱신하라: npm run check:tokens -- --update-baseline");
  }
  if (failed) {
    console.log("\n[check:tokens] 실패");
    process.exitCode = 1;
    return;
  }
  console.log("\n[check:tokens] 통과");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
