import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import type { BadgeColor } from "./types";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "error",
        "warning",
        "info",
        "neutral",
      ],
    },
    variant: {
      control: "radio",
      options: ["fill", "weak"],
    },
    size: {
      control: "select",
      options: ["xsmall", "small", "medium", "large"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS: BadgeColor[] = [
  "primary",
  "secondary",
  "success",
  "error",
  "warning",
  "info",
  "neutral",
];

export const Default: Story = {
  args: {
    children: "뱃지",
    color: "primary",
    variant: "fill",
    size: "medium",
  },
};

export const AllColors: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["fill", "weak"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <span className="w-12 text-sm text-secondary-500">{variant}</span>
          {COLORS.map((color) => (
            <Badge key={color} color={color} variant={variant}>
              {color}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex items-center gap-3">
      {(["xsmall", "small", "medium", "large"] as const).map((size) => (
        <Badge key={size} color="primary" size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
};
