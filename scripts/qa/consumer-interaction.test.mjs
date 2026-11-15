import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium } from "playwright";
import { createServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let server;
let browser;
let base;

function executablePath() {
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  // macOS에서는 Chromium 본체 없이 설치된 Playwright headless shell도 사용한다.
  // 둘 다 없으면 기본 경로로 실행해 README의 Chromium 설치 안내에 맞게 오류를 노출한다.
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  const dirs = existsSync(cache) ? readdirSync(cache)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1])) : [];
  for (const dir of dirs) {
    for (const arch of ["mac-arm64", "mac-x64"]) {
      const candidate = join(cache, dir, `chrome-headless-shell-${arch}`, "chrome-headless-shell");
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": resolve(process.cwd(), "src") }, dedupe: ["react", "react-dom"] },
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "silent",
  });
  await server.listen();
  base = server.resolvedUrls.local[0];
  browser = await chromium.launch({ executablePath: executablePath() });
}, 30000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function open() {
  const page = await browser.newPage();
  await page.goto(`${base}tests/fixtures/consumer-interaction.html`);
  await page.getByRole("tablist", { name: "유지 탭" }).waitFor();
  return page;
}

describe("실제 컴포넌트 상태 전이", () => {
  it("테이블 체크박스와 현재 단계의 포커스 띠는 실제 배경과 색이 맞는다", async () => {
    const page = await open();
    try {
      await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important }" });
      await page.keyboard.press("Shift");
      const section = page.getByRole("region", { name: "포커스 띠" });
      const table = section.getByRole("table").last();
      for (const mode of ["light", "dark"]) {
        await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), mode === "dark");
        for (const selector of ["thead input[type=checkbox]", "tbody tr:nth-child(1) input[type=checkbox]", "tbody tr:nth-child(2) input[type=checkbox]"]) {
          const input = table.locator(selector);
          for (const hover of [false, true]) {
            await page.mouse.move(0, 0);
            await input.focus();
            if (hover) await input.locator("..").hover();
            const colors = await input.evaluate((element) => {
              const marker = getComputedStyle(element.nextElementSibling);
              const row = getComputedStyle(element.closest("th, tr"));
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              const normalize = (color) => { context.fillStyle = color; return context.fillStyle; };
              return [normalize(marker.getPropertyValue("--tw-ring-offset-color")), normalize(row.backgroundColor), marker.boxShadow, element.matches(":focus-visible")];
            });
            expect(colors[0]).toBe(colors[1]);
            expect(colors[2]).toContain("4px");
            expect(colors[3]).toBe(true);
          }
        }
        for (const name of [/첫 단계/, /다음 단계/]) {
          const step = section.getByRole("button", { name });
          await step.focus();
          const ring = await step.evaluate((element) => {
            const marker = getComputedStyle(element.firstElementChild);
            return [marker.getPropertyValue("--tw-ring-color").trim(), marker.getPropertyValue("--color-focus-primary").trim(), marker.boxShadow];
          });
          expect(ring[0]).toBe(ring[1]);
          expect(ring[2]).toContain("4px");
        }
        await section.getByLabel("포커스 코드").focus();
        const slot = section.locator("[data-code-slot][data-active]");
        const codeRing = await slot.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.getPropertyValue("--tw-ring-offset-color").trim(), style.getPropertyValue("--color-bg-surface").trim(), style.boxShadow];
        });
        expect(codeRing[0]).toBe(codeRing[1]);
        expect(codeRing[2]).toContain("4px");
        for (const target of [section.getByLabel(/페이지 번호 입력/), section.getByRole("button", { name: "키보드로 페이지 이동 활성화" })]) {
          await target.focus();
          const outline = await target.evaluate((element) => {
            const style = getComputedStyle(element);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            context.fillStyle = style.getPropertyValue("--color-focus-primary").trim();
            const expected = context.fillStyle;
            context.fillStyle = style.outlineColor;
            return [context.fillStyle, expected, style.outlineWidth, style.outlineOffset];
          });
          expect(outline[0]).toBe(outline[1]);
          expect(outline[2]).toBe("2px");
          expect(outline[3]).toBe("2px");
        }
        const widthInput = section.getByRole("textbox", { name: "name 컬럼 너비 (px)" });
        await widthInput.focus();
        const widthRing = await widthInput.evaluate((element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          let clipped = false;
          for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
            const ancestor = getComputedStyle(parent);
            if (ancestor.overflowX === "visible" && ancestor.overflowY === "visible" && !ancestor.contain.includes("paint")) continue;
            const area = parent.getBoundingClientRect();
            const left = area.left + parent.clientLeft;
            const top = area.top + parent.clientTop;
            if (box.left - 4 < left - 0.5 || box.right + 4 > left + parent.clientWidth + 0.5 || box.top - 4 < top - 0.5 || box.bottom + 4 > top + parent.clientHeight + 0.5) clipped = true;
          }
          return [style.getPropertyValue("--tw-ring-offset-color").trim(), style.getPropertyValue("--color-bg-surface").trim(), style.boxShadow, clipped];
        });
        expect(widthRing[0]).toBe(widthRing[1]);
        expect(widthRing[2]).toContain("4px");
        expect(widthRing[3]).toBe(false);
      }
    } finally { await page.close(); }
  });

  it("primary 채움 버튼의 포커스 띠는 배경색에 맞게 바꿀 수 있다", async () => {
    const page = await open();
    try {
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      const section = page.getByRole("region", { name: "포커스 띠" });
      for (const [name, token] of [["기본 띠", "--color-bg-surface"], ["페이지색 띠", "--color-bg-page"]]) {
        const button = section.getByRole("button", { name });
        await page.keyboard.press("Shift");
        await button.focus();
        const colors = await button.evaluate((element, background) => {
          const style = getComputedStyle(element);
          return [style.getPropertyValue("--tw-ring-offset-color").trim(), style.getPropertyValue(background).trim()];
        }, token);
        expect(colors[0]).toBe(colors[1]);
      }
    } finally { await page.close(); }
  });

  it("스타일 계층에서 폭 유틸이 슬라이더와 선택 컨테이너에 적용된다", async () => {
    const page = await open();
    try {
      const width = (selector) => page.locator(selector).evaluate((element) => element.getBoundingClientRect().width);
      expect(await width('[aria-label="슬라이더"]')).toBe(128);
      for (const id of ["single-width", "multi-width"]) {
        expect(await width(`#${id}`)).toBe(160);
        expect(await width(`#${id} button`)).toBe(160);
      }
      expect(await width("#input-width")).toBe(160);
      expect(await page.locator("#input-width").getAttribute("class")).toBe("w-40 marker");
      expect(await page.locator("#input-default").getAttribute("class")).toBe("w-full marker");
    } finally { await page.close(); }
  });
  it("유지 탭은 입력을 보존하고 기본 탭은 전환 시 입력을 초기화한다", async () => {
    const page = await open();
    try {
      for (const [name, expected] of [["유지", "입력값"], ["기본", ""]]) {
        const section = page.getByRole("region", { name, exact: true });
        await section.getByLabel("첫 입력").fill("입력값");
        await section.getByRole("tab", { name: "둘째 탭" }).click();
        await section.getByRole("tab", { name: "첫 탭" }).click();
        expect(await section.getByLabel("첫 입력").inputValue()).toBe(expected);
      }
    } finally { await page.close(); }
  });

  it("제어 정렬은 부모 적용 전에는 변경되지 않고 재마운트 및 서버 정렬에도 일치한다", async () => {
    const page = await open();
    try {
      const section = page.getByRole("region", { name: "제어 정렬" });
      const header = section.getByRole("columnheader", { name: /날짜/ });
      const names = () => section.locator("tbody tr td:first-child").allTextContents();
      expect(await header.getAttribute("aria-sort")).toBe("ascending");
      expect(await names()).toEqual(["이름", "늦음", "없음"]);
      await header.getByRole("button").click();
      expect(await section.locator("output").textContent()).toBe("desc");
      expect(await header.getAttribute("aria-sort")).toBe("ascending");
      expect(await names()).toEqual(["이름", "늦음", "없음"]);
      await section.getByRole("button", { name: "적용" }).click();
      expect(await header.getAttribute("aria-sort")).toBe("descending");
      expect(await names()).toEqual(["늦음", "이름", "없음"]);
      await section.getByRole("button", { name: "다시 마운트" }).click();
      expect(await header.getAttribute("aria-sort")).toBe("descending");
      expect(await names()).toEqual(["늦음", "이름", "없음"]);
      const serverSection = page.getByRole("region", { name: "서버 정렬" });
      expect(await serverSection.getByRole("columnheader", { name: /날짜/ }).getAttribute("aria-sort")).toBe("descending");
      expect(await serverSection.locator("tbody tr td:first-child").allTextContents()).toEqual(["늦음", "없음", "이름"]);
    } finally { await page.close(); }
  });
});
