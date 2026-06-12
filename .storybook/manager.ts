import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// 사이드바 상단 브랜딩. 로고는 staticDirs(./assets)에서 /logo.png 로 서빙된다.
const theme = create({
  base: "light",
  brandTitle: "The Wrong UI",
  brandImage: "/logo.png",
  brandTarget: "_self",
  // 로고의 빨강 물결 액센트와 맞춤
  colorPrimary: "#ff4d4d",
  colorSecondary: "#ff4d4d",
});

addons.setConfig({ theme });
