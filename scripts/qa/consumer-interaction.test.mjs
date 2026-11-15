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
