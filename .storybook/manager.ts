import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// 사이드바 상단 브랜딩. 로고는 staticDirs(./assets)에서 /logo.png 로 서빙된다.
// brandImage와 brandTitle은 동시에 안 보이므로, brandTitle에 로고+이름 HTML을 직접 넣어
// 한 줄로 나란히 표시한다. (img 높이는 main.ts managerHead CSS로 제한)
const theme = create({
  base: "light",
  brandTitle:
    '<img src="/logo.png" alt="" /><span style="font-family:Georgia,\'Times New Roman\',serif;font-weight:700;font-size:16px;letter-spacing:-0.01em">thewrong-ui</span>',
  brandTarget: "_self",
  // 로고의 빨강 물결 액센트와 맞춤
  colorPrimary: "#ff4d4d",
  colorSecondary: "#ff4d4d",
});

addons.setConfig({ theme });
