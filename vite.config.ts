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
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), dts({
    include: ["src"],
    exclude: ["src/**/*.stories.tsx", "src/**/*.d.ts"],
    // src/ 접두어를 떼고 dist 루트로 평탄화 → dist/index.d.ts (package.json "types"와 일치)
    entryRoot: "src"
  })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    },
    // 단일 인스턴스 보장 — 중복 번들 시 toast 큐 싱글톤/모션 컨텍스트가 갈라진다.
    dedupe: ["react", "react-dom", "react-hot-toast", "motion", "@dnd-kit/core", "@tanstack/react-virtual"]
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: format => `index.${format === "es" ? "es" : "cjs"}.js`
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
        /^@tanstack\/react-virtual($|\/)/
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        }
      }
    },
    cssCodeSplit: false
  },
  test: {
    projects: [{
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