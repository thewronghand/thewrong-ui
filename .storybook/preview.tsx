import type { Preview } from "@storybook/react";
import { Toaster } from "react-hot-toast";
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
  },
  // ActionToast(react-hot-toast 기반)가 동작하려면 Toaster가 마운트돼 있어야 한다.
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster position="bottom-center" />
      </>
    ),
  ],
};

export default preview;
