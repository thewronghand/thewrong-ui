import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "radio",
      options: ["small", "medium"],
    },
    label: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "알림 받기",
    size: "medium",
  },
};

export const Controlled: Story = {
  args: { label: "" },
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <Switch
        checked={on}
        onCheckedChange={setOn}
        label={on ? "켜짐" : "꺼짐"}
      />
    );
  },
};

export const Sizes: Story = {
  args: { label: "" },
  render: () => (
    <div className="flex items-center gap-6">
      <Switch size="small" label="small" defaultChecked />
      <Switch size="medium" label="medium" defaultChecked />
    </div>
  ),
};

export const Disabled: Story = {
  args: { label: "" },
  render: () => (
    <div className="flex items-center gap-6">
      <Switch label="비활성 (꺼짐)" disabled />
      <Switch label="비활성 (켜짐)" disabled defaultChecked />
    </div>
  ),
};
