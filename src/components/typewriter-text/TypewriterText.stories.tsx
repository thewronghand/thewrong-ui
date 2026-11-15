import type { Meta, StoryObj } from "@storybook/react";
import { TypewriterText } from "./TypewriterText";

const meta = {
  title: "Components/TypewriterText",
  component: TypewriterText,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "보조기기에는 전체 텍스트를 즉시 제공하며 모션 감소 환경에서는 애니메이션 없이 표시합니다.",
      },
    },
  },
  tags: ["autodocs"],
  args: { text: "안녕하세요. 반갑습니다." },
} satisfies Meta<typeof TypewriterText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Words: Story = {
  args: { text: "단어 단위로 메시지가 나타납니다.", unit: "word" },
};
export const Immediate: Story = {
  args: { text: "애니메이션 없이 표시합니다.", animate: false },
};
