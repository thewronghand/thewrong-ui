import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "@/components/input";
import { Field } from "./Field";
import { FieldMessage } from "./FieldMessage";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "label과 컨트롤을 htmlFor/id로 연결하세요. animated 메시지는 FieldMessage를 유지하고 자식만 바꿉니다.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    label: "이름",
    htmlFor: "field-default",
    children: (
      <Input id="field-default" variant="box" placeholder="이름 입력" />
    ),
  },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args} />
    </div>
  ),
};
export const Labels: Story = {
  render: () => (
    <div className="grid w-80 gap-5">
      <Field
        label="이름"
        htmlFor="field-required"
        required
        rightLabel="필수 입력"
      >
        <Input id="field-required" variant="box" required />
      </Field>
      <Field label="설명" htmlFor="field-optional" optional>
        <Input id="field-optional" variant="box" />
      </Field>
    </div>
  ),
};
export const Message: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div className="grid w-80 gap-3">
        <Field label="이메일" htmlFor="field-email" required>
          <Input
            id="field-email"
            variant="box"
            hasError={show}
            aria-describedby="field-error"
          />
          <FieldMessage
            animated
            id="field-error"
            className="text-xs text-fg-danger"
          >
            {show ? "이메일을 확인해 주세요." : null}
          </FieldMessage>
        </Field>
        <button
          type="button"
          className="text-left text-sm text-primary"
          onClick={() => setShow(!show)}
        >
          메시지 전환
        </button>
      </div>
    );
  },
};
