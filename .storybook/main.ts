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
      "@dnd-kit/core",
      "@tanstack/react-virtual",
    ];
    return config;
  },
};
export default config;