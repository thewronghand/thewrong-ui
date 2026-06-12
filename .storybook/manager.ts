import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// 사이드바 상단 브랜딩. 로고는 staticDirs(./assets)에서 /logo.png 로 서빙된다.
// brandImage와 brandTitle은 동시에 안 보이므로, brandTitle에 로고+이름 HTML을 직접 넣어
// 한 줄로 나란히 표시한다. (img 높이는 main.ts managerHead CSS로 제한)
// 빨강은 강한 색이라 로고에만 남기고, 매니저 UI 액센트(선택 강조 등)는
// 차분한 다크 슬레이트로 절제한다.
const SLATE = "#334155"; // 선택 항목/포커스 강조
const INK = "#1e293b"; // 본문 텍스트
const theme = create({
  base: "light",
  brandTitle:
    '<img src="/logo.png" alt="" /><span style="font-family:Georgia,\'Times New Roman\',serif;font-weight:700;font-size:16px;letter-spacing:-0.01em">thewrong-ui</span>',
  brandTarget: "_self",

  colorPrimary: SLATE,
  colorSecondary: SLATE,

  // 앱 배경 — 아주 옅은 회색으로 카드(흰색)와 미세 대비
  appBg: "#f8fafc",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#e2e8f0",
  appBorderRadius: 8,

  // 텍스트
  textColor: INK,
  textMutedColor: "#64748b",

  // 툴바/사이드바
  barTextColor: "#64748b",
  barSelectedColor: SLATE,
  barHoverColor: SLATE,
  barBg: "#ffffff",

  fontBase: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, monospace',
});

addons.setConfig({ theme });
