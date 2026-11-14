import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "@/components/button";
import { MonthRangePicker, type MonthRange } from "./month-range-picker";

const meta = {
  title: "Components/MonthRangePicker",
  component: MonthRangePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "월 범위를 선택한다. 데스크톱에서는 두 연도, 모바일에서는 한 연도를 보여준다. Modal 안에서는 popover로 열린다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MonthRangePicker>;

export default meta;
type Story = StoryObj;

export const 연도_경계_범위: Story = {
  render: () => {
    const [range, setRange] = useState<MonthRange>({
      from: { year: 2025, month: 12 },
      to: { year: 2026, month: 2 },
    });
    const label =
      range.from && range.to
        ? `${range.from.year}.${String(range.from.month).padStart(2, "0")} ~ ${range.to.year}.${String(range.to.month).padStart(2, "0")}`
        : "월 범위 선택";
    return (
      <MonthRangePicker value={range} onApply={setRange}>
        <Button variant="secondary">{label}</Button>
      </MonthRangePicker>
    );
  },
};

export const 선택_전: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "한 월만 선택하고 적용하면 시작과 끝이 같은 범위가 된다. 닫기를 누르면 선택이 취소된다.",
      },
    },
  },
  render: () => {
    const [range, setRange] = useState<MonthRange>({ from: null, to: null });
    const label =
      range.from && range.to
        ? `${range.from.year}.${String(range.from.month).padStart(2, "0")} ~ ${range.to.year}.${String(range.to.month).padStart(2, "0")}`
        : "월 범위 선택";
    return (
      <MonthRangePicker value={range} onApply={setRange}>
        <Button variant="secondary">{label}</Button>
      </MonthRangePicker>
    );
  },
};
