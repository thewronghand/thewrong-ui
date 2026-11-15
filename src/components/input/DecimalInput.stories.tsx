import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DecimalInput } from "./DecimalInput";
import { Input } from "./Input";
import { inputFormats } from "./format";

const meta = {
  title: "Components/DecimalInput",
  component: DecimalInput,
  args: { variant: "box" },
  parameters: {
    docs: {
      description: {
        component:
          "범위에 도달할 수 있는 접두사는 임시 입력으로 보관하며 blur 시 마지막 유효 값으로 복원합니다. 빈 값을 전달하려면 emitEmpty를 켭니다.",
      },
    },
  },
} satisfies Meta<typeof DecimalInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("12.5");
    return (
      <div className="grid w-80 gap-4">
        <DecimalInput
          variant="box"
          label="비율"
          labelOption="sustain"
          aria-label="비율"
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          decimalPlaces={2}
          suffix="%"
        />
        <p className="text-sm text-fg-muted">전달 값: {value}</p>
      </div>
    );
  },
};
export const Formats: Story = {
  render: () => {
    const [phoneResult, setPhoneResult] = useState("");
    return (
      <div className="grid w-80 gap-4">
        <Input
          variant="box"
          name="phone"
          aria-label="전화번호"
          placeholder="전화번호"
          format={inputFormats.phoneNumber}
          onChange={(event) =>
            setPhoneResult(`${event.target.name}: ${event.target.value}`)
          }
        />
        <p className="text-sm text-fg-muted" aria-live="polite">
          {phoneResult || "전화번호 원본 대기"}
        </p>
        <Input
          variant="box"
          aria-label="사업자등록번호"
          placeholder="사업자등록번호"
          format={inputFormats.businessNumber}
        />
        <Input
          variant="box"
          aria-label="금액"
          placeholder="금액"
          format={inputFormats.price}
        />
      </div>
    );
  },
};
