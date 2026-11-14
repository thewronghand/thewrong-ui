import type { Meta, StoryObj } from "@storybook/react";
import { CalendarDays, List } from "lucide-react";
import { useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "짧은 선택지 2~3개에 적합합니다. aria-label 또는 aria-labelledby로 그룹 이름을 제공하세요.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    "aria-label": "기간",
    value: "month",
    onChange: () => {},
    options: [
      { value: "month", label: "월간" },
      { value: "year", label: "연간" },
    ],
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("month");
    return (
      <SegmentedControl
        aria-label="기간"
        value={value}
        onChange={setValue}
        options={[
          { value: "month", label: "월간" },
          { value: "year", label: "연간" },
        ]}
      />
    );
  },
};
export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState("list");
    return (
      <SegmentedControl
        aria-label="보기"
        value={value}
        onChange={setValue}
        options={[
          { value: "list", label: "목록", icon: <List /> },
          { value: "calendar", label: "달력", icon: <CalendarDays /> },
          { value: "other", label: "비활성", disabled: true },
        ]}
      />
    );
  },
};
export const Disabled: Story = { args: { disabled: true } };
