import type { Meta, StoryObj } from "@storybook/react";
import { InfoTooltip } from "./InfoTooltip";

const meta = {
  title: "Components/InfoTooltip",
  component: InfoTooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
  },
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "이 항목에 대한 부가 설명입니다. ? 아이콘에 호버하면 보여요.",
    position: "top",
  },
};

export const WithLabel: Story = {
  args: { content: "" },
  render: () => (
    <div className="flex items-center gap-1.5 text-sm text-text-primary">
      <span>정산 수수료</span>
      <InfoTooltip content="정산 시 차감되는 수수료입니다. VAT 별도." />
    </div>
  ),
};
