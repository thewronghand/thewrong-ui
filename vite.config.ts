/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import tailwindcss from "@tailwindcss/vite";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// 소비자용 토큰 소스 — dist/tokens.css.
// 소비자가 자기 Tailwind 빌드에서 `@import "@thewrong/ui/tokens.css"` 하면 @theme·@utility가 살아 있어
// bg-bg-surface·rounded-control-medium·z-floating 같은 유틸이 생성된다(컴파일된 styles.css와 별개).
// 층 순서대로 원본 CSS를 이어 붙이기만 한다. legacy.css(옛 이름 임시 별칭)는 넣지 않는다.
const TOKEN_SOURCES = ["primitives.css", "semantic.css", "component-utils.css"];
function emitTokensCss() {
  return {
    name: "thewrong-ui:emit-tokens-css",
    apply: "build" as const,
    closeBundle() {
      const body = TOKEN_SOURCES.map((file) => `/* ── ${file} ── */\n${readFileSync(resolve(__dirname, "src/styles", file), "utf8")}`).join("\n");
      mkdirSync(resolve(__dirname, "dist"), { recursive: true });
      writeFileSync(resolve(__dirname, "dist/tokens.css"), `/* @thewrong/ui 토큰 소스 — Tailwind v4 빌드에서 @import한다. 생성물: 수정 금지 */\n${body}`);
    }
  };
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), emitTokensCss(), dts({
    include: ["src"],
    // .d.ts는 산출물로 재방출하지 않되, 앰비언트 선언 파일(vite-env·css)은 dts 컴파일
    // 컨텍스트에 포함해야 import.meta.env / CSS side-effect import 타입이 해석된다.
    // (전체 *.d.ts를 빼면 그 참조가 끊겨 dts 빌드에서 경고가 난다.)
    exclude: ["src/**/*.stories.tsx"],
    // src/ 접두어를 떼고 dist 루트로 평탄화 → dist/index.d.ts (package.json "types"와 일치)
    entryRoot: "src"
  })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    },
    // 단일 인스턴스 보장 — 중복 번들 시 toast 큐 싱글톤/모션 컨텍스트가 갈라진다.
    dedupe: ["react", "react-dom", "react-hot-toast", "motion", "@floating-ui/react", "@dnd-kit/core", "@tanstack/react-virtual", "date-fns"]
  },
  build: {
    lib: {
      // 다중 진입점 — 루트 배럴(.) + 훅 전용 서브패스(./hooks).
      // 훅 진입점을 분리해 소비자가 useIsMobile 등만 쓸 때 무거운 UI(motion/floating)가
      // 끌려오지 않게 한다. preserveModules와 함께 컴포넌트별 개별 트리셰이킹도 가능해진다.
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        hooks: resolve(__dirname, "src/hooks/index.ts")
      },
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // react·motion·floating-ui는 peerDependency로 빼서 번들 비대화 방지.
      // lucide-react는 tree-shaking이 잘 돼 사용한 아이콘만 들어가므로 번들 포함(소비 편의).
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^motion($|\/)/,
        /^@floating-ui($|\/)/,
        "react-hot-toast",
        // table 전용 — 무겁고 소비자가 직접 버전 관리하는 게 나아 peer로 분리.
        /^@dnd-kit($|\/)/,
        /^@tanstack\/react-virtual($|\/)/,
        // date-picker/search-box 전용 — 무겁고 로케일 데이터 포함. peer로 분리.
        /^date-fns($|\/)/
      ],
      output: {
        // 모듈 구조 보존 — 컴포넌트/훅이 개별 파일로 남아 소비자 번들러가 쓰지 않는 것을
        // 트리셰이킹할 수 있다. 단일 번들이면 useIsMobile만 import해도 전체가 평가됐다.
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].[format].js",
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        }
      }
    },
    // CSS는 단일 파일 유지(소비자가 styles.css 한 줄만 import). 코드분할은 JS 모듈에만 적용.
    cssCodeSplit: false
  },
  test: {
    projects: [{
      // node 환경 단위 테스트 — src/**/*.test.ts (npm run test:unit)
      resolve: {
        alias: {
          "@": resolve(__dirname, "src")
        }
      },
      test: {
        name: 'unit',
        environment: 'node',
        include: ['src/**/*.test.ts']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});