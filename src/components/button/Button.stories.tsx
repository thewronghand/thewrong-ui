import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "danger"],
    },
    appearance: {
      control: "select",
      options: ["filled", "outlined", "transparent"],
    },
    size: {
      control: "select",
      options: ["mini", "small", "medium", "large"],
    },
    display: {
      control: "radio",
      options: ["inline", "block"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "버튼",
    variant: "primary",
    appearance: "filled",
    size: "medium",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["primary", "secondary", "tertiary", "danger"] as const).map(
        (variant) => (
          <div key={variant} className="flex items-center gap-3">
            <span className="w-24 text-sm text-secondary-500">{variant}</span>
            <Button variant={variant} appearance="filled">
              Filled
            </Button>
            <Button variant={variant} appearance="outlined">
              Outlined
            </Button>
            <Button variant={variant} appearance="transparent">
              Transparent
            </Button>
          </div>
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Button size="mini">Mini</Button>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: "저장 중...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "비활성",
    disabled: true,
  },
};

export const Block: Story = {
  args: {
    children: "전체 너비 버튼",
    display: "block",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
