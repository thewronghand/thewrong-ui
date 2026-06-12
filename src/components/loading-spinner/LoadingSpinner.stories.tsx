import type { Meta, StoryObj } from "@storybook/react";
import { LoadingSpinner, InlineSpinner, Spinner } from "./LoadingSpinner";

const meta = {
  title: "Components/LoadingSpinner",
  component: LoadingSpinner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    message: { control: "text" },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { message: "데이터를 불러오는 중이에요...", size: "md" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      {(["sm", "md", "lg"] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <Spinner size={s} />
          <span className="text-xs text-text-secondary">{s}</span>
        </div>
      ))}
    </div>
  ),
};

export const Inline: Story = {
  render: () => <InlineSpinner />,
};
