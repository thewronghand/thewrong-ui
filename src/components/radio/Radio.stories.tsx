import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Mail } from "lucide-react";
import { useState } from "react";
import { Radio, RadioItem } from "./Radio";
import { Checkbox } from "@/components/checkbox";
import { TableCheckbox } from "@/components/table-checkbox";
import { Switch } from "@/components/switch";
import { SegmentedControl } from "@/components/segmented-control";

const meta = {
  title: "Components/Radio",
  component: RadioItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "fieldset과 legend로 그룹을 설명하고, 각 항목에 같은 name을 전달합니다. 그룹은 배치만 담당합니다.",
      },
    },
  },
  tags: ["autodocs"],
  args: { children: "이메일", name: "radio-demo" },
} satisfies Meta<typeof RadioItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { defaultChecked: true } };
export const States: Story = {
  render: () => (
    <fieldset className="grid w-80 gap-2">
      <legend className="mb-2 text-fg-default">알림 방식</legend>
      <Radio.Group className="grid gap-2">
        <Radio.Item name="states" defaultChecked>
          이메일
        </Radio.Item>
        <Radio.Item name="states">알림</Radio.Item>
        <Radio.Item name="states" disabled>
          사용 불가
        </Radio.Item>
      </Radio.Group>
    </fieldset>
  ),
};
export const Centered: Story = {
  render: () => {
    const [value, setValue] = useState("mail");
    return (
      <fieldset className="w-80">
        <legend className="mb-2 text-fg-default">수신 방식</legend>
        <Radio.Group equalizeLabelWidth className="grid gap-2">
          <Radio.Item
            name="centered"
            value="mail"
            checked={value === "mail"}
            onChange={() => setValue("mail")}
            leadingIcon={<Mail />}
            contentAlignment="center"
          >
            이메일
          </Radio.Item>
          <Radio.Item
            name="centered"
            value="notice"
            checked={value === "notice"}
            onChange={() => setValue("notice")}
            leadingIcon={<Bell />}
            contentAlignment="center"
          >
            앱 알림
          </Radio.Item>
        </Radio.Group>
      </fieldset>
    );
  },
};

export const FieldsetDisabled: Story = {
  render: () => (
    <fieldset disabled className="grid w-80 gap-3 bg-bg-surface p-4">
      <legend className="text-fg-default">비활성 폼</legend>
      <Radio.Group className="grid gap-2">
        <Radio.Item name="disabled-group" defaultChecked>
          선택됨
        </Radio.Item>
        <Radio.Item name="disabled-group">선택 안 됨</Radio.Item>
      </Radio.Group>
      <Checkbox.Line label="체크박스" />
      <TableCheckbox checked={false} ariaLabel="테이블 체크박스" />
      <Switch label="스위치" defaultChecked />
      <SegmentedControl
        aria-label="기간"
        value="month"
        onChange={() => {}}
        options={[
          { value: "month", label: "월간" },
          { value: "year", label: "연간" },
        ]}
      />
    </fieldset>
  ),
};
