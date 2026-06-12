import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  // 브랜딩 로고·파비콘 등 정적 에셋 서빙 (/logo.png 로 접근)
  "staticDirs": ["./assets"],
  // brandImage는 원본 크기대로 렌더돼 정사각 로고가 과하게 크다. 사이드바 로고 높이를 제한.
  managerHead: (head) => `${head}
    <style>
      /* brandTitle에 로고 img + 이름 span을 함께 넣어 한 줄로 정렬. 로고 과대 렌더 보정. */
      .sidebar-header a { display: flex !important; align-items: center !important; gap: 8px !important; }
      .sidebar-header img { height: 28px !important; width: auto !important; }
      /* 코어 내장 "Get started" 온보딩 체크리스트 위젯 숨김 */
      #storybook-checklist-widget { display: none !important; }
    </style>`,
  // 기본 온보딩("Get started" 위젯) / 신기능 알림 끄기
  "core": {
    "disableWhatsNewNotifications": true
  },
  // react-hot-toast 등 싱글톤 패키지가 중복 번들되면 toast 큐가 갈라져 토스트가 안 뜬다.
  // story와 preview가 같은 인스턴스를 보도록 dedupe.
  async viteFinal(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.dedupe = [
      ...(config.resolve.dedupe ?? []),
      "react",
      "react-dom",
      "react-hot-toast",
      "motion",
      "@floating-ui/react",
      "@dnd-kit/core",
      "@tanstack/react-virtual",
      "date-fns",
    ];
    return config;
  },
};
export default config;