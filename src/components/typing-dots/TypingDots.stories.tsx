import type { Meta, StoryObj } from "@storybook/react";
import { TypingDots } from "./TypingDots";

const meta = {
  title: "Components/TypingDots",
  component: TypingDots,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "점의 크기와 색은 부모의 글자 크기와 색을 따릅니다. 모션 감소 환경에서는 정지한 점을 표시합니다.",
      },
    },
  },
  tags: ["autodocs"],
  args: { label: "입력 중" },
} satisfies Meta<typeof TypingDots>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-baseline gap-6 text-fg-default">
      <span className="text-sm">
        <TypingDots label="작은 크기 로딩 중" />
      </span>
      <span className="text-3xl">
        <TypingDots label="큰 크기 로딩 중" />
      </span>
    </div>
  ),
};
export const OnPrimary: Story = {
  render: () => (
    <div className="rounded-control-medium bg-primary p-5 text-xl text-fg-inverse">
      <TypingDots label="응답 중" />
    </div>
  ),
};
