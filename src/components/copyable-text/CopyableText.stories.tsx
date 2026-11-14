import type { Meta, StoryObj } from "@storybook/react";
import { CopyableText } from "./CopyableText";

const meta = {
  title: "Components/CopyableText",
  component: CopyableText,
  args: { value: "sample-1234", label: "코드" },
  parameters: {
    docs: {
      description: {
        component:
          "보안 컨텍스트와 clipboard 권한이 필요합니다. 앱 루트에 ToastProvider를 마운트해 결과를 표시합니다.",
      },
    },
  },
} satisfies Meta<typeof CopyableText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const IconOnly: Story = { args: { iconOnly: true } };
export const CustomLabel: Story = { args: { children: "초대 코드 복사" } };
