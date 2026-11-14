#!/usr/bin/env node
/**
 * Storybook 스토리 전수 스크린샷.
 *
 * 실행 중인 Storybook(dev 서버)의 index.json에서 type=story 항목만 골라
 * iframe.html로 하나씩 열고 PNG로 저장한다. docs 항목은 찍지 않는다.
 *
 * 사용:
 *   node scripts/qa/snap-stories.mjs --port 6108 --out <dir> \
 *     [--mode light|dark|both] [--viewport desktop|mobile|both] [--filter <substr>] \
 *     [--emulate-scheme] [--concurrency 4] [--allow-failures] [--keep]
 *
 * 저장 위치: <out>/<mode>/<viewport>/<story-id>.png
 *   index.json 확인 후 선택된 출력 폴더의 기존 PNG를 지운다. --filter를 주면 해당 스토리만 지우고,
 *   --keep을 주면 보존한다.
 *   오버레이 계열(모달·드로어·토스트·셀렉트 패널 등)은 닫힌 상태만 찍히므로,
 *   스토리 루트의 첫 버튼/트리거를 한 번 클릭한 열린 상태를 <story-id>-open.png로 추가 저장한다.
 *
 * 다크: URL globals(colorMode:dark)로 `.dark` 클래스를 켠다.
 *   --emulate-scheme을 주면 prefers-color-scheme: dark도 함께 에뮬레이트한다
 *   (`dark:` 유틸이 OS 설정을 따르던 시절의 "의도된 다크" 기준 컷용).
 *
 * 안정화: prefers-reduced-motion: reduce 에뮬레이트, CSS transition·animation 정지,
 *   캐럿 숨김, 웹폰트 로드(document.fonts.ready) 대기 후 촬영.
 *
 * 실패한 스토리는 건너뛰고 <out>/failures-<mode>-<viewport>.json에 남긴 뒤 종료 코드 1을
 * 반환한다. 실패를 허용하려면 --allow-failures를 명시한다.
 *
 * 브라우저: 레포 playwright가 요구하는 빌드가 없으면
 *   ~/Library/Caches/ms-playwright/chromium_headless_shell-* 중 최신을 executablePath로 쓴다.
 *   새로 내려받지 않는다.
 */
import { chromium } from "playwright";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function parseArgs(argv) {
  const args = {
    port: 6108,
    out: null,
    mode: "both",
    viewport: "both",
    filter: null,
    emulateScheme: false,
    concurrency: 4,
    allowFailures: false,
    keep: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--port") args.port = Number(next());
    else if (a === "--out") args.out = next();
    else if (a === "--mode") args.mode = next();
    else if (a === "--viewport") args.viewport = next();
    else if (a === "--filter") args.filter = next();
    else if (a === "--emulate-scheme") args.emulateScheme = true;
    else if (a === "--concurrency") args.concurrency = Number(next());
    else if (a === "--allow-failures") args.allowFailures = true;
    else if (a === "--keep") args.keep = true;
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  if (!args.out) throw new Error("--out <dir> 필수");
  if (!["light", "dark", "both"].includes(args.mode))
    throw new Error("--mode light|dark|both");
  if (!["desktop", "mobile", "both"].includes(args.viewport))
    throw new Error("--viewport desktop|mobile|both");
  return args;
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

// 열린 상태 컷을 추가로 찍을 스토리(title 기준). 클릭해야 내용이 보이는 계열.
const OVERLAY_TITLE =
  /modal|drawer|toast|select|popover|tooltip|date-?picker|search-?box|collapsible/i;

const FREEZE_CSS = `
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  caret-color: transparent !important;
}`;

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (err) {
    const cache = join(homedir(), "Library/Caches/ms-playwright");
    const dirs = existsSync(cache)
      ? readdirSync(cache)
          .filter((d) => d.startsWith("chromium_headless_shell-"))
          .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
      : [];
    for (const d of dirs) {
      for (const sub of [
        "chrome-headless-shell-mac-arm64",
        "chrome-headless-shell-mac-x64",
        "chrome-mac",
      ]) {
        const exe = join(cache, d, sub, "chrome-headless-shell");
        if (existsSync(exe)) {
          console.error(`[snap] 기본 브라우저 실행 실패 → 폴백 ${exe}`);
          return chromium.launch({ executablePath: exe });
        }
      }
    }
    throw err;
  }
}

async function waitForStory(page) {
  await page.waitForFunction(
    () =>
      document.body.classList.contains("sb-show-main") ||
      document.body.classList.contains("sb-show-errordisplay") ||
      document.body.classList.contains("sb-show-nopreview"),
    null,
    { timeout: 20000 },
  );
  const failed = await page.evaluate(
    () =>
      document.body.classList.contains("sb-show-errordisplay") ||
      document.body.classList.contains("sb-show-nopreview"),
  );
  if (failed) {
    const msg = await page.evaluate(
      () => document.querySelector("#error-message")?.textContent ?? "",
    );
    throw new Error(`스토리 렌더 오류: ${msg.trim().slice(0, 200)}`);
  }
  // sb-show-main이 붙은 뒤에도 첫 방문(모듈 on-demand 컴파일)이면 로딩 스피너가 남아 있을 수 있다.
  // 준비 중 표시가 사라지고 루트에 내용이 생길 때까지 기다린다.
  await page.waitForFunction(
    () =>
      ![...document.body.classList].some((c) =>
        c.startsWith("sb-show-preparing"),
      ) &&
      (document.querySelector("#storybook-root")?.childElementCount ?? 0) > 0,
    null,
    { timeout: 20000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

async function snapOne(context, base, story, mode, outDir, isOverlay) {
  const page = await context.newPage();
  try {
    const url = `${base}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story&globals=colorMode:${mode}`;
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.addStyleTag({ content: FREEZE_CSS });
    await waitForStory(page);
    await page.screenshot({
      path: join(outDir, `${story.id}.png`),
      fullPage: true,
    });
    if (isOverlay) {
      const trigger = page
        .locator("#storybook-root")
        .locator(
          'button, [role="combobox"], [aria-haspopup], input[type="text"], input:not([type])',
        )
        .first();
      if ((await trigger.count()) > 0) {
        await trigger.click({ timeout: 5000 });
        await page.waitForTimeout(800);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: join(outDir, `${story.id}-open.png`),
          fullPage: true,
        });
      }
    }
  } finally {
    await page.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const modes = args.mode === "both" ? ["light", "dark"] : [args.mode];
  const viewports =
    args.viewport === "both" ? ["desktop", "mobile"] : [args.viewport];
  const base = `http://localhost:${args.port}`;
  const res = await fetch(`${base}/index.json`);
  if (!res.ok) throw new Error(`index.json 응답 ${res.status}`);
  const index = await res.json();
  let stories = Object.values(index.entries).filter((e) => e.type === "story");
  if (args.filter)
    stories = stories.filter(
      (s) => s.id.includes(args.filter) || s.title.includes(args.filter),
    );
  if (stories.length === 0) throw new Error("촬영할 스토리가 없다.");
  stories.sort((a, b) => a.id.localeCompare(b.id));

  const browser = await launchBrowser();
  let total = 0;
  let failedTotal = 0;
  try {
    const selectedPngs = new Set(
      stories.flatMap(({ id }) => [`${id}.png`, `${id}-open.png`]),
    );
    for (const mode of modes) {
      for (const vp of viewports) {
        const outDir = join(args.out, mode, vp);
        mkdirSync(outDir, { recursive: true });
        if (!args.keep) {
          for (const entry of readdirSync(outDir, { withFileTypes: true })) {
            if (
              entry.isFile() &&
              entry.name.endsWith(".png") &&
              (!args.filter || selectedPngs.has(entry.name))
            )
              unlinkSync(join(outDir, entry.name));
          }
        }
      }
    }
    console.log("[snap] 주의: 다른 모드·뷰포트의 이전 failures JSON은 남는다.");
    for (const mode of modes) {
      for (const vp of viewports) {
        const outDir = join(args.out, mode, vp);
        const context = await browser.newContext({
          viewport: VIEWPORTS[vp],
          deviceScaleFactor: 1,
          reducedMotion: "reduce",
          colorScheme: mode === "dark" && args.emulateScheme ? "dark" : "light",
        });
        const failures = [];
        let cursor = 0;
        const worker = async () => {
          while (cursor < stories.length) {
            const story = stories[cursor++];
            try {
              await snapOne(
                context,
                base,
                story,
                mode,
                outDir,
                OVERLAY_TITLE.test(story.title),
              );
              total++;
            } catch (err) {
              failures.push({
                id: story.id,
                error: String(err?.message ?? err).split("\n")[0],
              });
            }
          }
        };
        await Promise.all(
          Array.from({ length: Math.max(1, args.concurrency) }, worker),
        );
        await context.close();
        failures.sort((a, b) => a.id.localeCompare(b.id));
        writeFileSync(
          join(args.out, `failures-${mode}-${vp}.json`),
          JSON.stringify(failures, null, 2),
        );
        failedTotal += failures.length;
        console.log(
          `[snap] ${mode}/${vp}: 스토리 ${stories.length}개 중 실패 ${failures.length}`,
        );
        for (const f of failures) console.log(`  - 실패 ${f.id}: ${f.error}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(
    `[snap] 완료: 스토리 ${total}건 촬영, 실패 ${failedTotal}건 → ${args.out}`,
  );
  if (failedTotal > 0 && !args.allowFailures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
