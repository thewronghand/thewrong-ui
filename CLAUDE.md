# thewrong-ui (@thewrong/ui)

the source app에서 직접 만든 UI 컴포넌트들을 **별도 라이브러리로 분리**한 프로젝트.
사이드프로젝트에서 `npm install @thewrong/ui` 후 슥슥 꺼내쓰는 게 목적.

> "잘못된 건데 잘 돌아가는 UI 라이브러리"

## 정체성

- **소스**: the source app `src/shared/ui/*` (FSD 구조의 공통 UI 레이어)
- **소비자**: 의현 개인 사이드프로젝트들 (synapse, escapist, tarot 등)
- **배포**: npm publish (`@thewrong/ui`)
- **git**: 개인 계정 `thewronghand` / `penfreak77@gmail.com` (local config로 설정됨, remote는 `github-personal` SSH host alias 사용)

## 기술 스택

- **Vite (lib mode)** — ES + CJS 듀얼 번들, `vite-plugin-dts`로 `.d.ts` 생성
- **React 19** — peerDependency (`>=18`), 번들에서 external
- **Tailwind CSS v4** — `@tailwindcss/vite`, `@theme`로 토큰 등록
- **Storybook 10** — 컴포넌트 개발/문서/시각 테스트 (`npm run dev` → :6006)
- **Vitest (browser mode, playwright)** — Storybook 스토리 기반 테스트

## 스타일링 & 테마

- **CSS 자체포함**: 빌드 시 모든 스타일을 단일 CSS로 번들 (`cssCodeSplit: false`).
  소비자는 `import "@thewrong/ui/styles.css"` 한 줄이면 됨 — Tailwind 설치 불필요.
- **테마 시스템**: `src/styles/theme.css`의 `@theme` 블록에 oklch 기반 색상 토큰 정의.
  - 토큰 계열: `primary-*`, `secondary-*`(neutral), `error-*` (각 50~950)
  - 소비자가 `:root`에서 CSS Variable(`--color-primary-500` 등)을 오버라이드하면 전체 테마 변경 가능
  - source 토큰 네이밍과 동일 계열이라 추출 시 토큰 변환 거의 불필요

## 컴포넌트 구조 (컨벤션)

각 컴포넌트는 `src/components/<name>/` 폴더에 다음 패턴으로 작성:

```
components/<name>/
  types.ts          # Props 타입 (discriminated union 등)
  utils.ts          # Tailwind 클래스 매핑 함수 (variant/size/appearance)
  <Name>.tsx        # 컴포넌트 본체 (forwardRef 권장)
  <Name>.stories.tsx
  index.ts          # public export
```

- `src/index.ts`에서 `export * from "./components/<name>"`로 노출
- **기존 Button** 컴포넌트가 레퍼런스 구현 (variant×appearance×size 매핑, forwardRef, button/anchor 분기)

## 추출 원칙

- source 구현을 **거의 그대로 복사**하는 방향 (재작성 X, 빠른 이전 우선)
- `@shared/*` 내부 의존(`overlay-stack`, `portal`, click-outside 훅 등)은 라이브러리 내부로 함께 가져옴
- 의존성 낮은 것부터 추출 (Tier 0 → Tier 3). 상세는 `PLAN.md` 참조.

## 코딩 스타일 (전역 규칙 상속)

- import 경로: 절대경로 `@/` (상대경로 금지)
- `any` 금지 — `unknown` 또는 구체 타입
- 주석/커밋 한국어, 커밋은 제목 한 줄만
- Prettier

## 명령어

```bash
npm run dev          # Storybook 개발 서버 (:6006)
npm run build        # 라이브러리 빌드 (dist/)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
```

## 주의

- `.envrc` (GH_TOKEN 등)는 절대 커밋 금지 — `.gitignore`에 포함됨
- publish 전 `package.json`의 `repository.url`을 `thewronghand` 계정으로 맞출 것
  (현재 `github.com/euihyeon`로 되어있음)
- `exports["./styles.css"]` 경로(`dist/style.css`)가 vite 산출물명과 일치하는지 빌드 후 확인
