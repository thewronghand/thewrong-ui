import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./date-picker";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import { MonthPicker } from "./month-picker";
import { DateInput } from "@/components/date-input";
import { Button } from "@/components/button";

/**
 * DatePicker 가족 — floating-ui 기반 날짜 선택 popover. 모바일에선 바텀시트로 전환된다.
 *
 * - `DatePicker` — 단일 날짜. children이 트리거, value(`yyyy-MM-dd`) + onApply.
 * - `DateRangePicker` — 시작~종료 범위. value `{ start, end }` + onApply. 프리셋(최근 7일 등) 포함.
 * - `MonthPicker` — 연/월 선택.
 * - `DateInput` — 네이티브 `<input type=date>` 래퍼(트리거 없이 인라인 입력).
 *
 * 날짜 포맷·로케일은 date-fns(peer)에 위임한다.
 */
const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "floating-ui 날짜 선택 popover(모바일 바텀시트 전환). 단일/범위/월 + 네이티브 DateInput. date-fns peer.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const 단일날짜: Story = {
  parameters: story("children이 트리거. 클릭하면 달력 popover가 뜨고 선택 시 onApply(yyyy-MM-dd)."),
  render: () => {
    const [date, setDate] = useState("");
    return (
      <DatePicker value={date} onApply={setDate}>
        <Button variant="secondary" size="small">
          {date || "날짜 선택"}
        </Button>
      </DatePicker>
    );
  },
};

export const 기간선택: Story = {
  parameters: story("시작~종료 범위 + 프리셋. onApply로 { start, end } emit."),
  render: () => {
    const [range, setRange] = useState<DateRange>({ from: null, to: null });
    const label = range.from && range.to ? `${range.from} ~ ${range.to}` : "기간 선택";
    return (
      <DateRangePicker value={range} onApply={setRange}>
        <Button variant="secondary" size="small">{label}</Button>
      </DateRangePicker>
    );
  },
};

export const 월선택: Story = {
  parameters: story("연/월 단위 선택. 통계·정산 월 화면에 적합."),
  render: () => {
    const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
    const label = month ? `${month.year}. ${String(month.month).padStart(2, "0")}.` : "월 선택";
    return (
      <MonthPicker value={month ?? undefined} onChange={setMonth}>
        <Button variant="secondary" size="small">{label}</Button>
      </MonthPicker>
    );
  },
};

export const 인라인_DateInput: Story = {
  parameters: story("네이티브 input[type=date] 래퍼. 트리거 없이 폼 필드처럼 인라인으로 둔다."),
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="w-60">
        <DateInput value={value} onChange={setValue} />
      </div>
    );
  },
};
