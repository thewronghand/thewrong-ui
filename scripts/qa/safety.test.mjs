import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let temp;
beforeEach(() => { temp = mkdtempSync(join(tmpdir(), "ui-snap-test-")); });
afterEach(() => { rmSync(temp, { recursive: true, force: true }); });

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd() });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function serveIndex(entries, callback) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ entries }));
  });
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function snapshotArgs(port, out, extra = []) {
  return ["scripts/qa/snap-stories.mjs", "--port", String(port), "--out", out,
    "--mode", "light", "--viewport", "desktop", ...extra];
}

function sentinel() {
  const out = join(temp, "snaps");
  const dir = join(out, "light", "desktop");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "old.png");
  writeFileSync(file, "원본");
  return { out, file };
}

describe("스크린샷 보존", () => {
  it("스토리 0건과 필터 결과 0건은 삭제 전에 실패한다", async () => {
    const { out, file } = sentinel();
    for (const [entries, extra] of [
      [{}, []],
      [{ one: { type: "story", id: "one", title: "One" } }, ["--filter", "missing"]],
    ]) {
      const result = await serveIndex(entries, (port) => run(snapshotArgs(port, out, extra)));
      expect(result.code).toBe(1);
      expect(result.output).toContain("촬영할 스토리가 없다");
      expect(readFileSync(file, "utf8")).toBe("원본");
    }
  }, 30000);

  it("서버 연결 또는 브라우저 실행 실패 시 기존 PNG를 보존한다", async () => {
    const { out, file } = sentinel();
    const port = await serveIndex({}, (number) => number);
    const disconnected = await run(snapshotArgs(port, out));
    expect(disconnected.code).toBe(1);
    expect(readFileSync(file, "utf8")).toBe("원본");

    const patch = join(temp, "fail-browser.mjs");
    writeFileSync(patch, `import { chromium } from ${JSON.stringify(import.meta.resolve("playwright"))};\nchromium.launch = async () => { throw new Error("browser launch test"); };\n`);
    const entries = { one: { type: "story", id: "one", title: "One" } };
    const failed = await serveIndex(entries, (number) => run([
      "--import", patch, ...snapshotArgs(number, out),
    ]));
    expect(failed.code).toBe(1);
    expect(failed.output).toContain("browser launch test");
    expect(readFileSync(file, "utf8")).toBe("원본");
  }, 30000);
});

describe("스크린샷 비교 경로", () => {
  it("존재하지 않는 출력의 조상 심볼릭 링크가 입력을 가리키면 거부한다", async () => {
    const a = join(temp, "a");
    const b = join(temp, "b");
    const link = join(temp, "alias");
    mkdirSync(a);
    mkdirSync(b);
    symlinkSync(a, link);
    const file = join(a, "old.png");
    writeFileSync(file, "원본");
    const result = await run(["scripts/qa/diff-snaps.mjs", a, b, "--out", join(link, "new", "diff")]);
    expect(result.code).toBe(2);
    expect(result.output).toContain("겹칠 수 없다");
    expect(readFileSync(file, "utf8")).toBe("원본");
  });

  it("심볼릭 링크 뒤의 ..도 실제 경로를 기준으로 검사한다", async () => {
    const parent = join(temp, "parent");
    const a = join(parent, "a");
    const child = join(parent, "child");
    const b = join(temp, "b");
    const link = join(temp, "alias");
    mkdirSync(a, { recursive: true });
    mkdirSync(child);
    mkdirSync(b);
    symlinkSync(child, link);
    const result = await run(["scripts/qa/diff-snaps.mjs", a, b, "--out", `${link}/../a/new`]);
    expect(result.code).toBe(2);
    expect(result.output).toContain("겹칠 수 없다");
  });

  it("없는 입력 폴더는 인자 오류로 구분한다", async () => {
    const b = join(temp, "b");
    mkdirSync(b);
    const result = await run(["scripts/qa/diff-snaps.mjs", join(temp, "missing"), b]);
    expect(result.code).toBe(2);
    expect(result.output).toContain("비교 대상 폴더가 없다");
  });
});
