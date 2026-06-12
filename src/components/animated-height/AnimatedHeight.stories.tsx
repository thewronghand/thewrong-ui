import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AnimatedHeight } from "./AnimatedHeight";
import { Button } from "@/components/button";

const meta = {
  title: "Components/AnimatedHeight",
  component: AnimatedHeight,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AnimatedHeight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => {
    const [rows, setRows] = useState(1);
    return (
      <div className="w-80">
        <div className="mb-3 flex gap-2">
          <Button size="small" onClick={() => setRows((r) => r + 1)}>
            행 추가
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setRows((r) => Math.max(1, r - 1))}
          >
            행 제거
          </Button>
        </div>
        <AnimatedHeight className="rounded-xl border border-border-tertiary bg-bg-card">
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className="rounded-lg bg-bg-base-secondary px-3 py-2 text-sm text-text-primary"
              >
                행 {i + 1}
              </div>
            ))}
          </div>
        </AnimatedHeight>
      </div>
    );
  },
};
