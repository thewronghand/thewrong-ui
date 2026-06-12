import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { Button } from "@/components/button";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
    content: { control: "text" },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "floating-ui 기반 툴팁이에요",
    position: "top",
    children: <Button>마우스를 올려보세요</Button>,
  },
};

export const Positions: Story = {
  args: { content: "", children: null },
  render: () => (
    <div className="flex gap-6">
      {(["top", "bottom", "left", "right"] as const).map((p) => (
        <Tooltip key={p} content={`position: ${p}`} position={p}>
          <Button variant="secondary">{p}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};
