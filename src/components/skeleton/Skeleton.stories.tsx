import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "장식용 요소이므로 크기는 className으로 지정하고, 로딩 상태는 별도 텍스트로 설명하세요.",
      },
    },
  },
  tags: ["autodocs"],
  args: { className: "h-6 w-48" },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
};
export const LoadingCard: Story = {
  render: () => (
    <div
      role="status"
      aria-label="내용을 불러오는 중"
      className="grid w-80 gap-3 rounded-control-medium border-control border-border-subtle bg-bg-surface p-4"
    >
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};
