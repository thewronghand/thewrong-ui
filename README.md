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

## 특징

- **CSS 자체포함** — `styles.css` 한 줄이면 끝. Tailwind 설정 불필요.
- **테마 오버라이드** — oklch 기반 2계층 토큰. `:root`에서 CSS Variable만 덮어쓰면 전체 테마가 바뀐다.
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

## 테마 오버라이드

```css
:root {
  --color-primary-500: oklch(0.6 0.2 260); /* 브랜드 색 교체 */
}
.dark {
  /* 다크 토큰도 같은 방식으로 */
}
```

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
