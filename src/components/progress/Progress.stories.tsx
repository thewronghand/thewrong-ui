import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./Progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "value는 0~100의 백분율입니다. 0~1 비율은 호출부에서 변환하고 접근성 이름을 전달하세요.",
      },
    },
  },
  tags: ["autodocs"],
  args: { value: 60, "aria-label": "진행률", className: "w-80" },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Sizes: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <Progress value={35} size="small" aria-label="작은 진행률" />
      <Progress value={70} size="medium" aria-label="중간 진행률" />
    </div>
  ),
};
export const States: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <Progress value={0} aria-label="시작 전" />
      <Progress value={50} aria-label="진행 중" />
      <Progress value={100} aria-label="완료" />
    </div>
  ),
};
