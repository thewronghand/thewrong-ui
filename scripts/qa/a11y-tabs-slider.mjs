/** Storybook을 띄운 뒤 node scripts/qa/a11y-tabs-slider.mjs [--port 6109]로 실행한다. */
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    const cache = join(homedir(), "Library/Caches/ms-playwright");
    const versions = existsSync(cache)
      ? readdirSync(cache).filter((name) => name.startsWith("chromium_headless_shell-"))
        .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
      : [];
    for (const version of versions) {
      for (const platform of ["chrome-headless-shell-mac-arm64", "chrome-headless-shell-mac-x64"]) {
        const executablePath = join(cache, version, platform, "chrome-headless-shell");
        if (existsSync(executablePath)) return chromium.launch({ executablePath });
      }
    }
    throw error;
  }
}

const args = process.argv.slice(2);
if (args.length !== 0 && (args.length !== 2 || args[0] !== "--port" || !/^\d+$/.test(args[1]) || Number(args[1]) < 1 || Number(args[1]) > 65535)) {
  throw new Error("사용: node scripts/qa/a11y-tabs-slider.mjs [--port 1~65535]");
}
const port = args.length ? Number(args[1]) : 6109;
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const go = async (id) => {
    await page.goto(`http://localhost:${port}/iframe.html?id=${id}&viewMode=story`);
    await page.waitForSelector("#storybook-root > *");
  };

  await go("components-table--accessible-sorting");
  for (const sectionName of ["세 단계 정렬", "그룹 정렬", "아코디언 정렬"]) {
    const section = page.locator(`section[aria-label="${sectionName}"]`);
    const button = section.getByRole("button", { name: "이름", exact: true });
    const th = button.locator("xpath=ancestor::th");
    assert.equal(await th.getAttribute("aria-sort"), null);
    assert.equal(await button.locator("svg[aria-hidden=true]").count(), 1);
    for (const state of ["ascending", "descending", null]) {
      await button.click();
      assert.equal(await th.getAttribute("aria-sort"), state);
    }
  }

  const group = page.locator('section[aria-label="그룹 정렬"]');
  const groupLeaf = group.getByRole("button", { name: "사용률", exact: true });
  const groupLeafHeader = groupLeaf.locator("xpath=ancestor::th");
  assert.equal(await groupLeafHeader.getAttribute("aria-sort"), null);
  await groupLeaf.click();
  assert.equal(await groupLeafHeader.getAttribute("aria-sort"), "ascending");

  const dragStory = () => go("components-table--drag-sorting");
  const headerOrder = () => page.locator("#storybook-root thead th").evaluateAll((cells) =>
    cells.map((cell) => cell.querySelector("button")?.textContent.trim() ?? cell.querySelector("div")?.textContent.trim()),
  );
  await dragStory();
  let button = page.getByRole("button", { name: "이름", exact: true });
  let th = button.locator("xpath=ancestor::th");
  assert.equal(await th.getAttribute("tabindex"), null);
  assert.equal(await th.getAttribute("aria-roledescription"), null);
  assert.equal(await button.getAttribute("aria-keyshortcuts"), "Shift+Space");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const tree = await cdp.send("Accessibility.getFullAXTree");
  const buttonNode = tree.nodes.find((node) => node.role?.value === "button" && node.name?.value === "이름");
  const headerNode = tree.nodes.find((node) => node.role?.value === "columnheader" && node.name?.value === "이름");
  assert.match(buttonNode?.description?.value ?? "", /SHIFT\+SPACE/i);
  assert.ok(headerNode);
  await cdp.detach();
  await button.click();
  assert.equal(await th.getAttribute("aria-sort"), "ascending");
  await button.focus();
  await page.keyboard.press("Enter");
  assert.equal(await th.getAttribute("aria-sort"), "descending");
  await page.keyboard.press("Space");
  assert.equal(await th.getAttribute("aria-sort"), null);

  await dragStory();
  button = page.getByRole("button", { name: "이름", exact: true });
  const rect = await button.boundingBox();
  assert.ok(rect);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 350, rect.y + rect.height / 2, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  assert.deepEqual(await headerOrder(), ["사용률", "이름", "상태"]);
  assert.equal(await page.getByRole("columnheader", { name: /이름/ }).getAttribute("aria-sort"), null);

  await dragStory();
  button = page.getByRole("button", { name: "이름", exact: true });
  await button.focus();
  await page.keyboard.press("Shift+Space");
  await page.waitForTimeout(250);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(350);
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  assert.deepEqual(await headerOrder(), ["사용률", "이름", "상태"]);
  assert.equal(await page.getByRole("columnheader", { name: /이름/ }).getAttribute("aria-sort"), null);

  await go("components-select--accessibility-name");
  assert.equal(await page.locator('#storybook-root [role="combobox"]').count(), 2);
  assert.equal(await page.getByRole("combobox", { name: "검색 국가" }).count(), 1);

  await go("components-tabs--manual");
  const overview = page.getByRole("tab", { name: "개요" });
  const activity = page.getByRole("tab", { name: "활동" });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await activity.evaluate((element) => element === document.activeElement), true);
  assert.equal(await overview.getAttribute("aria-selected"), "true");
  assert.equal(await overview.getAttribute("tabindex"), "-1");
  assert.equal(await activity.getAttribute("tabindex"), "0");
  await page.keyboard.press("Enter");
  assert.equal(await activity.getAttribute("aria-selected"), "true");
  const panelId = await activity.getAttribute("aria-controls");
  assert.equal(await page.locator(`[id="${panelId}"]`).getAttribute("aria-labelledby"), await activity.getAttribute("id"));

  await go("components-tabs--automatic");
  const autoOverview = page.getByRole("tab", { name: "개요" });
  const autoActivity = page.getByRole("tab", { name: "활동" });
  await autoOverview.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await autoActivity.evaluate((element) => element === document.activeElement), true);
  assert.equal(await autoActivity.getAttribute("aria-selected"), "true");
  assert.equal(await autoOverview.getAttribute("aria-selected"), "false");

  await go("components-slider--volume-with-decimal-input");
  assert.equal(await page.getByRole("slider", { name: /음량/ }).getAttribute("aria-valuetext"), "-12 데시벨");
  await go("components-slider--normalized-change");
  const slider = page.getByRole("slider", { name: "정규화 확인" });
  // 브라우저가 range 값을 먼저 보정하므로 부동소수 오차가 남은 값을 이벤트에서 재현한다.
  await slider.evaluate((element) => Object.defineProperty(element, "valueAsNumber", { configurable: true, get: () => 0.30000000000000004 }));
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByLabel("변경 값").textContent(), "0.3");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await go("components-progress--indeterminate");
  const progress = page.getByRole("progressbar", { name: "데이터 불러오는 중" });
  assert.equal(await progress.getAttribute("aria-valuenow"), null);
  const reduced = await progress.locator(":scope > div").evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    width: element.getBoundingClientRect().width / element.parentElement.getBoundingClientRect().width,
    background: getComputedStyle(element).backgroundImage,
  }));
  assert.equal(reduced.animation, "none");
  assert.equal(reduced.width, 1);
  assert.match(reduced.background, /^repeating-linear-gradient/);

  await go("components-button--inline-link");
  for (const name of ["자세한 안내", "삭제"]) {
    const link = page.getByRole("button", { name, exact: true });
    const color = await link.evaluate((element) => getComputedStyle(element).color);
    await link.hover();
    assert.equal(await link.evaluate((element) => getComputedStyle(element).color), color);
    assert.equal(await link.evaluate((element) => getComputedStyle(element).textDecorationThickness), "2px");
  }
  await go("components-button--link-details");
  const styled = page.getByRole("button", { name: "크고 굵은 안내" });
  assert.deepEqual(await styled.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.fontSize, style.lineHeight, style.fontWeight];
  }), ["18px", "22.5px", "700"]);
  const disabled = page.getByRole("button", { name: "자세한 안내", disabled: true });
  assert.equal(await disabled.evaluate((element) => getComputedStyle(element).textDecorationLine), "none");
  const inherited = page.getByRole("button", { name: "자세한 안내", disabled: false });
  assert.equal(await inherited.evaluate((element) => getComputedStyle(element).fontWeight),
    await inherited.evaluate((element) => getComputedStyle(element.parentElement).fontWeight));
  const wrapped = page.getByRole("link", { name: /여러 줄에 자연스럽게/ });
  const wrapping = await wrapped.evaluate((element) => {
    const lines = [...element.getClientRects()];
    return {
      lines: lines.length,
      iconsOnLines: [...element.querySelectorAll("svg")].every((icon) => {
        const box = icon.getBoundingClientRect();
        return lines.some((line) => box.top >= line.top - 2 && box.bottom <= line.bottom + 2);
      }),
    };
  });
  assert.ok(wrapping.lines > 1);
  assert.equal(wrapping.iconsOnLines, true);

  console.log("정렬·드래그·Select·Tabs·Slider·Progress·Button 브라우저 동작 확인");
} finally {
  await browser.close();
}
