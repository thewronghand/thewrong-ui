import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Collapsible } from "./Collapsible";
import { Button } from "@/components/button";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: true, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="w-80">
        <Button onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "펼치기"}
        </Button>
        <Collapsible open={open} className="mt-3">
          <div className="rounded-xl border border-border-tertiary bg-bg-card p-4 text-sm text-text-primary">
            grid-template-rows 0fr ↔ 1fr 트릭으로 JS 측정 없이 height auto를
            부드럽게 펼치고 접습니다. 여러 줄의 콘텐츠도 문제없이 동작해요.
          </div>
        </Collapsible>
      </div>
    );
  },
};
