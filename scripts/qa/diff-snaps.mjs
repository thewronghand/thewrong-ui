#!/usr/bin/env node
/**
 * 두 스크린샷 폴더를 픽셀 비교한다.
 *
 * 사용: node scripts/qa/diff-snaps.mjs <dirA> <dirB> [--out <diffDir>] [--tolerance <0~255>]
 *
 * dirA 기준으로 하위 경로가 같은 PNG끼리 비교한다(재귀). 출력:
 *   - 달라진 파일과 달라진 픽셀 수·채널별 최대 차이(크기가 다르면 크기 차이로 보고)
 *   - 한쪽에만 있는 파일
 * --out을 주면 차이가 있는 파일마다 차이 픽셀을 빨갛게 칠한 PNG를 저장한다.
 *
 * 비교 기준: RGBA 네 채널이 하나라도 다르면 다른 픽셀.
 * 전체 채널의 최대 차이가 tolerance 이하인 파일은 흔들림으로 따로 집계한다(기본 0).
 * 디코딩은 node_modules에 이미 있는 pngjs를 쓴다(새 의존성 없음).
 * 종료 코드: 흔들림을 제외한 차이·누락이 없으면 0, 있으면 1.
 */
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

function listPngs(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".png")) out.push(relative(root, full));
    }
  };
  walk(root);
  return out.sort();
}

function compare(fileA, fileB) {
  const a = PNG.sync.read(readFileSync(fileA));
  const b = PNG.sync.read(readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) {
    return {
      sizeMismatch: `${a.width}x${a.height} → ${b.width}x${b.height}`,
      diff: null,
      count: -1,
    };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  let count = 0;
  const maxChannels = [0, 0, 0, 0];
  for (let i = 0; i < a.data.length; i += 4) {
    let same = true;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(a.data[i + channel] - b.data[i + channel]);
      maxChannels[channel] = Math.max(maxChannels[channel], delta);
      if (delta > 0) same = false;
    }
    if (same) {
      // 같은 픽셀은 흐리게 남겨 위치를 알아볼 수 있게 한다.
      diff.data[i] =
        diff.data[i + 1] =
        diff.data[i + 2] =
          255 - Math.round((255 - a.data[i]) * 0.2);
      diff.data[i + 3] = 255;
    } else {
      count++;
      diff.data[i] = 255;
      diff.data[i + 1] = 0;
      diff.data[i + 2] = 0;
      diff.data[i + 3] = 255;
    }
  }
  return { sizeMismatch: null, diff, count, maxChannels };
}

function main() {
  const argv = process.argv.slice(2);
  const positional = [];
  let outDir = null;
  let tolerance = 0;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") outDir = argv[++i];
    else if (argv[i] === "--tolerance") {
      const value = argv[++i];
      tolerance =
        value === undefined || value.trim() === "" ? NaN : Number(value);
    } else if (argv[i].startsWith("--")) {
      console.error(`알 수 없는 인자: ${argv[i]}`);
      process.exit(2);
    } else positional.push(argv[i]);
  }
  const [dirA, dirB] = positional;
  if (
    positional.length !== 2 ||
    !dirA ||
    !dirB ||
    !Number.isInteger(tolerance) ||
    tolerance < 0 ||
    tolerance > 255 ||
    (argv.includes("--out") && (!outDir || outDir.startsWith("--")))
  ) {
    console.error(
      "사용: node scripts/qa/diff-snaps.mjs <dirA> <dirB> [--out <diffDir>] [--tolerance <0~255>]",
    );
    process.exit(2);
  }
  const filesA = listPngs(dirA);
  const filesB = new Set(listPngs(dirB));
  const changed = [];
  const noise = [];
  const onlyA = [];
  for (const rel of filesA) {
    if (!filesB.has(rel)) {
      onlyA.push(rel);
      continue;
    }
    filesB.delete(rel);
    const r = compare(join(dirA, rel), join(dirB, rel));
    if (r.sizeMismatch) changed.push({ rel, detail: `크기 ${r.sizeMismatch}` });
    else if (r.count > 0) {
      const maxDelta = Math.max(...r.maxChannels);
      const [red, green, blue, alpha] = r.maxChannels;
      const item = {
        rel,
        detail: `${r.count}px, maxΔ=${maxDelta} (R=${red}, G=${green}, B=${blue}, A=${alpha})`,
      };
      (maxDelta <= tolerance ? noise : changed).push(item);
      if (outDir) {
        const target = join(outDir, rel);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, PNG.sync.write(r.diff));
      }
    }
  }
  const onlyB = [...filesB].sort();
  console.log(
    `비교 ${filesA.length - onlyA.length}건, 달라짐 ${changed.length}건, 흔들림 ${noise.length}건 (tolerance=${tolerance}), A에만 ${onlyA.length}건, B에만 ${onlyB.length}건`,
  );
  for (const c of changed) console.log(`  달라짐 ${c.rel}: ${c.detail}`);
  for (const c of noise) console.log(`  흔들림 ${c.rel}: ${c.detail}`);
  for (const f of onlyA) console.log(`  A에만 ${f}`);
  for (const f of onlyB) console.log(`  B에만 ${f}`);
  if (outDir && changed.length + noise.length > 0 && existsSync(outDir))
    console.log(`차이 이미지: ${outDir}`);
  process.exit(changed.length + onlyA.length + onlyB.length > 0 ? 1 : 0);
}

main();
