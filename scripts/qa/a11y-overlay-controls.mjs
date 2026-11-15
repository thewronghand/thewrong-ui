/** 정적 Storybook: node scripts/qa/a11y-overlay-controls.mjs --port 6109 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
let port = 6109;
let measureOnly = false;
let removeIsolation = "";
let screenshotDir = "";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port") port = Number(args[++i]);
  else if (args[i] === "--measure-only") measureOnly = true;
  else if (args[i] === "--remove-isolation") removeIsolation = args[++i];
  else if (args[i] === "--screenshots") screenshotDir = args[++i];
  else throw new Error(`알 수 없는 인자: ${args[i]}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("포트는 1~65535여야 한다.");
const cases = [
  { name: "Checkbox", id: "components-checkbox--default", input: "input[type=checkbox]" },
  { name: "TableCheckbox", id: "components-table--체크박스-단독", input: "input[type=checkbox]" },
  { name: "Radio", id: "components-radio--states", input: "input[type=radio]" },
  { name: "SegmentedCodeInput", id: "components-segmentedcodeinput--one-time-code", input: "input" },
];
if (removeIsolation && !cases.some(({ name }) => name === removeIsolation)) throw new Error("알 수 없는 컨트롤 이름");

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

const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const go = async (id, mode = "light") => {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=colorMode:${mode}`);
    await page.waitForSelector("#storybook-root > *");
  };
  const failures = [];
  for (const item of cases) {
    for (const zIndex of [5, 10]) {
      await go(item.id);
      const point = await page.locator(item.input).first().evaluate((input, options) => {
        input.dataset.qaTarget = "true";
        const wrapper = input.parentElement;
        if (options.removeIsolation) wrapper.classList.remove("isolate");
        const box = document.createElement("div");
        box.style.cssText = "position:fixed;left:50px;top:40px;width:600px;height:160px;overflow:auto";
        const header = document.createElement("div");
        header.style.cssText = `position:sticky;top:0;height:48px;z-index:${options.zIndex};background:white`;
        const button = document.createElement("button");
        button.textContent = "헤더 버튼";
        button.style.cssText = "display:block;width:100%;height:48px";
        button.dataset.headerButton = "true";
        button.dataset.hits = "0";
        button.addEventListener("click", () => { button.dataset.hits = String(Number(button.dataset.hits) + 1); });
        header.append(button);
        box.append(header, wrapper);
        const spacer = document.createElement("div");
        spacer.style.height = "400px";
        box.append(spacer);
        document.body.append(box);
        box.scrollTop = 24;
        const inputRect = input.getBoundingClientRect();
        const headerRect = button.getBoundingClientRect();
        const x = inputRect.left + Math.min(inputRect.width, 16) / 2;
        const y = Math.max(inputRect.top, headerRect.top) + 4;
        const hit = document.elementFromPoint(x, y);
        return {
          x, y,
          overlap: inputRect.bottom > headerRect.top && inputRect.top < headerRect.bottom,
          hit: hit?.tagName.toLowerCase() + (hit instanceof HTMLInputElement ? `:${hit.type}` : ""),
          header: hit === button || button.contains(hit),
          before: input instanceof HTMLInputElement ? `${input.checked}:${input.value}` : "",
        };
      }, { zIndex, removeIsolation: removeIsolation === item.name });
      await page.mouse.click(point.x, point.y);
      const after = await page.locator("[data-qa-target]").evaluate((input) => ({
        value: `${input.checked}:${input.value}`,
        headerHits: Number(document.querySelector('[data-header-button]')?.dataset.hits),
      }));
      console.log(`${item.name} z=${zIndex}: elementFromPoint=${point.hit}, headerHits=${after.headerHits}, overlap=${point.overlap}, inputChanged=${point.before !== after.value}`);
      if (!point.overlap || !point.header || after.headerHits !== 1 || point.before !== after.value) failures.push(`${item.name} z=${zIndex}`);
    }
  }
  if (!measureOnly) assert.deepEqual(failures, [], `헤더 충돌: ${failures.join(", ")}`);
  if (!measureOnly) {
    const countChanges = async (input) => input.evaluate((element) => {
      element.dataset.changes = "0";
      element.addEventListener("change", () => { element.dataset.changes = String(Number(element.dataset.changes) + 1); });
    });
    const clickVisual = async (input) => {
      const rect = await input.locator("xpath=following-sibling::*[1]").boundingBox();
      assert.ok(rect);
      await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
    };
    for (const id of ["components-checkbox--all-variants", "components-checkbox--colors"]) {
      await go(id);
      const inputs = page.locator("#storybook-root input[type=checkbox]");
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        await countChanges(input);
        const before = await input.isChecked();
        await clickVisual(input);
        assert.equal(await input.isChecked(), !before);
        assert.equal(await input.getAttribute("data-changes"), "1");
        await input.setChecked(true);
        await input.uncheck();
        await input.check();
        assert.equal(await input.isChecked(), true);
      }
    }
    await go("components-table--체크박스-단독");
    const tableCheckbox = page.getByRole("checkbox", { name: "a" });
    await countChanges(tableCheckbox);
    const tableBefore = await tableCheckbox.isChecked();
    await clickVisual(tableCheckbox);
    assert.equal(await tableCheckbox.isChecked(), !tableBefore);
    assert.equal(await tableCheckbox.getAttribute("data-changes"), "1");
    await tableCheckbox.setChecked(true);
    await tableCheckbox.uncheck();
    await tableCheckbox.check();
    assert.equal(await tableCheckbox.isChecked(), true);

    await go("components-radio--states");
    const radio = page.getByRole("radio", { name: "알림", exact: true });
    await countChanges(radio);
    await clickVisual(radio);
    assert.equal(await radio.isChecked(), true);
    assert.equal(await radio.getAttribute("data-changes"), "1");
    const email = page.getByRole("radio", { name: "이메일", exact: true });
    await email.check();
    await radio.setChecked(true);
    assert.equal(await radio.isChecked(), true);
    await email.check();
    await assert.rejects(page.getByText("알림", { exact: true }).click({ timeout: 700 }), /intercepts pointer events/);
    await radio.check();
    assert.equal(await radio.isChecked(), true);

    await go("components-segmentedcodeinput--one-time-code");
    const code = page.getByRole("textbox", { name: "인증번호" });
    await code.fill("123456");
    assert.equal(await code.inputValue(), "123456");
    await go("components-segmentedcodeinput--masked-pin");
    await page.getByRole("button", { name: "인증번호 표시" }).click();
    assert.equal(await page.getByRole("textbox", { name: "PIN" }).inputValue(), "12");
    console.log("체크박스 박스 클릭과 Playwright 조작, 라디오와 코드 입력 확인");

    await go("components-modal--initial-focus-with-subview");
    await page.getByRole("button", { name: "서브뷰와 함께 열기" }).click();
    const modal = page.getByRole("dialog", { name: "부모 모달" });
    await modal.waitFor();
    await page.getByRole("button", { name: "뒤로 가기" }).waitFor();
    assert.equal(await modal.getAttribute("aria-describedby"), null);
    await page.getByRole("button", { name: "뒤로 가기" }).click();
    await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.getAttribute("aria-describedby") === "subview-parent-description");
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "닫기");
    assert.equal(await modal.getAttribute("aria-describedby"), "subview-parent-description");
    assert.equal(await page.getByRole("button", { name: "부모 실행" }).evaluate((element) => element === document.activeElement), false);

    await go("components-drawer--initial-focus");
    await page.getByRole("button", { name: "검색 드로어 열기" }).click();
    const drawer = page.getByRole("dialog", { name: "검색" });
    await drawer.waitFor();
    assert.equal(await drawer.getAttribute("aria-describedby"), "drawer-search-description");
    await page.getByRole("button", { name: "검색 도움말" }).click();
    await page.getByRole("button", { name: "뒤로 가기" }).waitFor();
    assert.equal(await drawer.getAttribute("aria-describedby"), null);
    await page.getByRole("button", { name: "뒤로 가기" }).click();
    await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.getAttribute("aria-describedby") === "drawer-search-description");
    assert.equal(await drawer.getAttribute("aria-describedby"), "drawer-search-description");
    console.log("Modal·Drawer 서브뷰의 설명 연결 해제와 복원, Modal 복귀 포커스 확인");

  }
  if (!measureOnly || screenshotDir) {
    for (const mode of ["light", "dark"]) {
      await go("components-table--행-선택", mode);
      const headerInput = page.locator("#storybook-root thead input[type=checkbox]").first();
      await page.keyboard.press("Tab");
      assert.equal(await headerInput.evaluate((element) => element === document.activeElement), true);
      const ring = await headerInput.locator("xpath=following-sibling::*[1]").evaluate((element) => {
        const style = getComputedStyle(element);
        const header = element.closest("th");
        return { offset: style.getPropertyValue("--tw-ring-offset-width").trim(), headerBackground: header ? getComputedStyle(header).backgroundColor : "" };
      });
      if (!measureOnly) assert.equal(ring.offset, "0px");
      if (screenshotDir) {
        mkdirSync(screenshotDir, { recursive: true });
        await page.screenshot({ path: join(screenshotDir, `table-header-focus-${mode}.png`) });
      }
      console.log(`TableCheckbox ${mode} 헤더 포커스: ringOffset=${ring.offset}, header=${ring.headerBackground}`);
    }
  }
} finally {
  await browser.close();
}
