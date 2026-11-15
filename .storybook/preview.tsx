import type { Decorator, Preview } from "@storybook/react";
import { ToastProvider } from "@/components/toast";
import "@/styles/index.css";
import "./preview.css";

/**
 * 다크·테마 토글을 story 루트(iframe의 `<html>`)에 반영한다.
 * - colorMode: `.dark` 클래스 하나로 다크 전환(시맨틱 토큰·`dark:` 유틸 공통 트리거).
 * - theme: `data-theme` 속성. "default"면 속성을 지운다.
 * URL 쿼리 `globals=colorMode:dark;theme:default`로도 켤 수 있다(스크린샷 스크립트가 쓴다).
 * docs 페이지도 같은 iframe 문서라 같은 데코레이터로 반영된다.
 */
const withColorModeAndTheme: Decorator = (Story, context) => {
  const root = document.documentElement;
  root.classList.toggle("dark", context.globals.colorMode === "dark");
  const theme = context.globals.theme;
  if (typeof theme === "string" && theme !== "default") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: "라이트/다크 (.dark 클래스)",
      toolbar: {
        title: "Color mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "테마 (data-theme 속성)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default" },
          { value: "quiet", title: "Quiet" },
          { value: "high-contrast", title: "High contrast" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorMode: "light",
    theme: "default",
  },
  parameters: {
    // "시작하기"(소개 MDX) 최상단 → Components → Layouts 순.
    options: {
      storySort: {
        order: ["시작하기", "Components", "Layouts", "*"],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // 배경 전환은 colorMode 토글이 맡는다(캔버스 배경이 시맨틱 배경 토큰을 따른다 — preview.css).
    backgrounds: { disable: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    // Modal/Drawer는 sm(640px) 미만에서 바텀시트로 분기한다.
    // story에서 parameters.viewport.defaultViewport: "mobile"로 고정하면
    // 데스크탑에서도 iframe이 좁아져 바텀시트 모드로만 렌더된다.
    viewport: {
      options: {
        mobile: {
          name: "Mobile (바텀시트)",
          styles: { width: "390px", height: "760px" },
          type: "mobile",
        },
      },
    },
  },
  // Toast/ActionToast가 동작하려면 ToastProvider(Toaster)가 마운트돼 있어야 한다.
  decorators: [
    withColorModeAndTheme,
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default preview;
