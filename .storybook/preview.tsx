import type { Preview } from "@storybook/react";
import { ToastProvider } from "../src/components/toast";
import "../src/styles/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1a1a2e" },
      ],
    },

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
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default preview;
