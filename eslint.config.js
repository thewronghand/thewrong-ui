import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "storybook-static"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Critical Rule #1 — any 금지. (table/select의 forwardRef 우회용 <T = any>는 아래 override에서 완화)
      "@typescript-eslint/no-explicit-any": "error",

      // 폴더 밖 상대경로 import 금지(../). 같은 폴더 형제(./)는 허용.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "폴더 밖 참조는 @/ 절대경로를 쓰세요 (같은 폴더 형제 ./ 는 허용).",
            },
          ],
        },
      ],

      // 라이브러리라 unused는 잡되, _ 프리픽스는 의도적 미사용으로 허용
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // table/select는 검증된 구현을 거의 그대로 이관한 "내부 서브폴더(hooks/components)를 가진 모듈".
    // - forwardRef 제네릭 우회용 <T = any>가 다수 → no-explicit-any 완화(warn)
    // - 모듈 내부에서 부모의 types/utils를 ../로 참조하는 건 정상적 응집 → no-restricted-imports 완화
    //   (모듈 밖을 ../../로 넘는 건 여전히 없어야 하지만, 현재 그런 참조는 없음)
    files: ["src/components/table/**/*.{ts,tsx}", "src/components/select/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "no-restricted-imports": "off",
    },
  },
  {
    // stories는 데모 코드 — 일부 룰 완화
    files: ["**/*.stories.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
);
