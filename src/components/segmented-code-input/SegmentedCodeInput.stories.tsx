import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SegmentedCodeInput } from "./SegmentedCodeInput";

const meta = {
  title: "Components/SegmentedCodeInput",
  component: SegmentedCodeInput,
  args: { id: "code", "aria-label": "인증번호", value: "", onChange: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          "실제 입력은 한 input에서 처리합니다. 숫자만 허용하며 일회용 코드를 보이게 하려면 masked={false}를 사용합니다.",
      },
    },
  },
} satisfies Meta<typeof SegmentedCodeInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OneTimeCode: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="grid w-96 max-w-full gap-4">
        <SegmentedCodeInput
          id="otp-code"
          aria-label="인증번호"
          value={value}
          onChange={setValue}
          masked={false}
        />
        <p className="text-center text-sm text-fg-muted">
          {value.length} / 6 자리
        </p>
      </div>
    );
  },
};
export const MaskedPin: Story = {
  render: () => {
    const [value, setValue] = useState("12");
    return (
      <div className="w-96 max-w-full">
        <SegmentedCodeInput
          id="pin-code"
          aria-label="PIN"
          value={value}
          onChange={setValue}
          length={4}
        />
      </div>
    );
  },
};
export const ErrorLine: Story = {
  render: () => {
    const [value, setValue] = useState("12");
    return (
      <div className="w-96 max-w-full">
        <SegmentedCodeInput
          id="error-code"
          aria-label="확인 코드"
          value={value}
          onChange={setValue}
          hasError
          variant="line"
          masked={false}
          length={4}
        />
      </div>
    );
  },
};
