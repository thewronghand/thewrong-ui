import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  CheckboxCircle,
  CheckboxLine,
  CheckboxLineTransparent,
} from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: CheckboxCircle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "number" } },
    baseColor: {
      control: "select",
      options: ["primary", "secondary", "neutral"],
    },
    label: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof CheckboxCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "약관에 동의합니다",
    defaultChecked: true,
    baseColor: "primary",
    size: 24,
  },
};

export const AllVariants: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <CheckboxCircle checked={checked} onCheckedChange={setChecked} />
          <span className="text-xs text-text-secondary">Circle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckboxLine checked={checked} onCheckedChange={setChecked} />
          <span className="text-xs text-text-secondary">Line</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckboxLineTransparent
            checked={checked}
            onCheckedChange={setChecked}
          />
          <span className="text-xs text-text-secondary">LineTransparent</span>
        </div>
      </div>
    );
  },
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <CheckboxCircle baseColor="primary" defaultChecked label="primary" />
      <CheckboxCircle baseColor="secondary" defaultChecked label="secondary" />
      <CheckboxCircle baseColor="neutral" defaultChecked label="neutral" />
    </div>
  ),
};
