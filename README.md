<div align="center">
  <img src="https://raw.githubusercontent.com/thewronghand/thewrong-ui/main/logo.png" alt="thewrong-ui" height="72" />
  <h1>thewrong-ui</h1>
  <p><a href="https://github.com/thewronghand">@thewronghand</a>의 개인 프로젝트용 React UI 컴포넌트 라이브러리</p>
</div>

---

## 설치

```bash
npm install @thewrong/ui
```

```tsx
// 1. 스타일 한 줄 (Tailwind 설치 불필요 — CSS가 번들에 자체포함)
import "@thewrong/ui/styles.css";

// 2. 컴포넌트 import
import { Button, Modal, PaginatedTable, SearchBox } from "@thewrong/ui";
```

TypeScript 선언은 ESM용이다. `moduleResolution: "bundler"` 또는 `"nodenext"`의 ESM에서 사용한다. CJS 런타임의 `require`는 지원하며, 타입 사용에는 `nodenext` ESM을 권장한다 (`node16` CJS에서는 TS1471이 발생한다).

## 특징

- **CSS 자체포함** — `styles.css` 한 줄이면 끝. Tailwind 설정 불필요.
- **토큰 2계층** — 프리미티브(`--p-*`) → 시맨틱(역할). 시맨틱 CSS Variable을 덮어쓰면 테마가 바뀐다. 다크는 `.dark` 클래스 하나.
- **가벼운 코어** — 무거운 의존(motion, floating-ui, dnd-kit, react-virtual, date-fns, react-hot-toast)은 **optional peerDependency**. 해당 기능을 쓰는 컴포넌트만 그 패키지를 함께 설치하면 된다.
- **React 19**, TypeScript, Vite(lib mode).

## 구성

| 분류 | 컴포넌트 |
|------|----------|
| 폼 | Button · Input(+PasswordInput) · Textarea · Select · MultiSelect · Switch · Checkbox · Badge |
| 오버레이 | Modal(+SubView/Standard) · Drawer · Popover · Tooltip · InfoTooltip · Toast · ActionToast |
| 날짜 | DatePicker · DateRangePicker · MonthPicker · DateInput |
| 데이터 | Table · PaginatedTable · AccordionTable · MiniTable · Pagination · SearchBox |
| 레이아웃 | TablePageLayout · TableCard · Toolbar · PageTitle |
| 모션/유틸 | AnimatedHeight · Collapsible · LoadingSpinner · cn |

## 테마 · 토큰

- **층**: 프리미티브(`--p-*`, 원료 — 직접 쓰지 않는다) → 시맨틱(`--color-bg-surface`, `--radius-control-medium` 같은 역할). 변수명이 곧 Tailwind 유틸 이름이다(`bg-bg-surface`, `rounded-control-medium`).
- **다크**: 시맨틱 토큰은 조상 요소의 `.dark`를 따른다. Modal·Drawer·Tooltip·Popover·Select·DatePicker 등 body로 portal되는 컴포넌트에도 적용하고 `:root` 오버라이드와 함께 쓰려면 `<html>`에 붙인다. `<body>`에 붙여도 포털은 덮지만 `:root` 값이 body의 다크 선언보다 우선하지는 않는다. `styles.css`의 `dark:` 유틸도 `.dark`를 따르며 OS 설정은 따르지 않는다.
- **오버라이드**: 시맨틱 변수를 덮는다. 아래 예시는 별도 오버라이드 CSS에 두고 항상 `styles.css` 뒤에 로드하며, 다크 값은 `.dark` 블록에 따로 적는다.
- **그림자**: `shadow-control` 등 그림자 유틸의 값은 `--shadow-control-src` 같은 `--shadow-*-src` 변수를 덮어 조절한다.

```css
:root {
  --color-primary: #2563eb;
}
.dark {
  --color-bg-surface: #0b1220;
}
```

- **내 Tailwind에서 토큰 유틸 쓰기** (Tailwind v4):

```css
@import "tailwindcss";
@import "@thewrong/ui/tokens.css"; /* bg-bg-surface, rounded-control-medium, z-floating … 생성 */
@custom-variant dark (&:where(.dark, .dark *)); /* 소비자 dark:도 .dark를 따르게 할 때 */
```

`tokens.css`를 컴파일한 소비자 CSS와 `styles.css`를 함께 쓸 수 있다. 별도 사용자 오버라이드 CSS는 둘 다 로드한 뒤에 둔다.

`tokens.css`는 소비자의 variant를 강제하지 않으므로 `@custom-variant dark`를 포함하지 않는다. 위 선언이 없으면 소비자 Tailwind의 기본 `dark:`는 `prefers-color-scheme`을 따른다.

## 개발

```bash
npm run dev        # Storybook (:6006) — 컴포넌트 문서·예시
npm run build      # 라이브러리 빌드 (dist/)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

각 컴포넌트의 사용법·정책·안티패턴은 Storybook 문서에서 확인할 수 있다.

## License

MIT
