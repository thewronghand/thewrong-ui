import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "./Input";
import { PasswordInput } from "./PasswordInput";
import { inputFormats } from "./format";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["box", "line", "big", "hero"],
    },
    inputSize: {
      control: "select",
      options: ["mini", "small", "medium", "large"],
    },
    labelOption: {
      control: "radio",
      options: ["appear", "sustain"],
    },
    hasError: { control: "boolean" },
    disabled: { control: "boolean" },
    clearable: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "box",
    label: "이름",
    placeholder: "이름을 입력하세요",
    inputSize: "medium",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Sizes: Story = {
  args: { variant: "box" },
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      {(["mini", "small", "medium", "large"] as const).map((s) => (
        <Input
          key={s}
          variant="box"
          inputSize={s}
          placeholder={s}
          labelOption="sustain"
          label={s}
        />
      ))}
    </div>
  ),
};

export const States: Story = {
  args: { variant: "box" },
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input variant="box" label="기본" labelOption="sustain" placeholder="입력" />
      <Input
        variant="box"
        label="에러"
        labelOption="sustain"
        hasError
        defaultValue="잘못된 값"
        help="에러 메시지입니다"
      />
      <Input
        variant="box"
        label="비활성"
        labelOption="sustain"
        disabled
        placeholder="비활성"
      />
    </div>
  ),
};

export const WithSlots: Story = {
  args: { variant: "box" },
  render: () => {
    const [amount, setAmount] = useState("");
    return (
      <div className="flex w-80 flex-col gap-3">
        <Input
          variant="box"
          label="금액"
          labelOption="sustain"
          suffix="원"
          format={inputFormats.price}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          clearable
        />
        <Input
          variant="box"
          label="전화번호"
          labelOption="sustain"
          format={inputFormats.phoneNumber}
          placeholder="010-0000-0000"
        />
        <PasswordInput variant="box" label="비밀번호" labelOption="sustain" />
      </div>
    );
  },
};
