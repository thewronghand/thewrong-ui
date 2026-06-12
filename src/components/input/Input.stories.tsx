import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "./Input";
import { PasswordInput } from "./PasswordInput";
import { inputFormats } from "./format";

/**
 * Input — variant=box 기준의 텍스트 입력. height·rounded·padding은 size 토큰으로
 * Button/Select/Textarea와 정합한다.
 *
 * prefix/suffix 슬롯, clearable, 내장 format(전화번호·금액), PasswordInput(가시성 토글)을 갖춘다.
 * label은 appear(값 있을 때만) / sustain(항상) 중 고른다.
 */
const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "box variant 텍스트 입력. size 토큰 정합, prefix/suffix·clearable·format·PasswordInput 지원.",
      },
    },
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

/** prefix / suffix — 입력값 앞뒤에 고정 텍스트. 단위·도메인·통화 기호 등. */
export const PrefixSuffix: Story = {
  args: { variant: "box" },
  parameters: {
    docs: { description: { story: "prefix는 입력 앞, suffix는 뒤(clearable·아이콘보다 앞)에 고정 표시된다." } },
  },
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input variant="box" label="사이트" labelOption="sustain" prefix="https://" placeholder="example.com" />
      <Input variant="box" label="금액" labelOption="sustain" suffix="원" placeholder="0" />
      <Input variant="box" label="할인율" labelOption="sustain" prefix="-" suffix="%" placeholder="0" />
    </div>
  ),
};

/** 실시간 검증 — onChange에서 값을 검사해 hasError·help를 갱신하는 패턴. */
export const 실시간검증: Story = {
  args: { variant: "box" },
  parameters: {
    docs: { description: { story: "이메일 형식을 입력 즉시 검사. 라이브러리는 상태만 받고, 검증 로직은 호출부가 쥔다." } },
  },
  render: () => {
    const [email, setEmail] = useState("");
    const touched = email.length > 0;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return (
      <div className="w-80">
        <Input
          variant="box"
          label="이메일"
          labelOption="sustain"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hasError={touched && !valid}
          help={touched && !valid ? "이메일 형식이 올바르지 않아요" : "예: you@example.com"}
          clearable
        />
      </div>
    );
  },
};
