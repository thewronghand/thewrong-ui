import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    textareaSize: {
      control: "select",
      options: ["mini", "small", "medium", "large"],
    },
    hasError: { control: "boolean" },
    disabled: { control: "boolean" },
    showCount: { control: "boolean" },
    resize: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "메모",
    placeholder: "내용을 입력하세요",
    rows: 4,
  },
};

export const WithCount: Story = {
  render: () => {
    const [v, setV] = useState("");
    return (
      <Textarea
        label="소개"
        placeholder="최대 200자"
        maxLength={200}
        showCount
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
    );
  },
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Textarea label="기본" placeholder="입력" />
      <Textarea
        label="에러"
        hasError
        defaultValue="잘못된 값"
        help="필수 항목이에요"
      />
      <Textarea label="비활성" disabled placeholder="비활성" />
    </div>
  ),
};
