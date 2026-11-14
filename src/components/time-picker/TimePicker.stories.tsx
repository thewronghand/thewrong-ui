import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import {
  MonthRangePicker,
  type MonthRange,
} from "@/components/month-range-picker";
import { TimeInput, TimePicker } from "./time-picker";

const meta = {
  title: "Components/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "시간을 시·분 또는 시·분·초 단위로 선택한다. 모바일에서는 바텀시트로 표시하며 Modal 안에서는 popover로 열린다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj;

export const 분_선택: Story = {
  render: () => {
    const [value, setValue] = useState("09:30");
    return (
      <TimePicker value={value} onApply={setValue} precision="minute">
        <Button variant="secondary">{value} 선택</Button>
      </TimePicker>
    );
  },
};

export const 초_입력: Story = {
  parameters: {
    docs: {
      description: {
        story: "숫자를 직접 입력하거나 시계 버튼에서 시·분·초를 선택한다.",
      },
    },
  },
  render: () => {
    const [value, setValue] = useState("12:30:05");
    return (
      <div className="w-64">
        <TimeInput
          value={value}
          onChange={setValue}
          precision="second"
          ariaLabel="시작 시간"
        />
      </div>
    );
  },
};

export const 입력_상태: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "조회 전용 값은 대비를 유지하며 disabled는 입력과 선택을 비활성화한다.",
      },
    },
  },
  render: () => {
    const [value, setValue] = useState("09:30");
    return (
      <div className="grid w-64 gap-3">
        <TimeInput
          value={value}
          onChange={setValue}
          precision="minute"
          ariaLabel="시간"
        />
        <TimeInput
          value="12:30"
          onChange={() => {}}
          precision="minute"
          ariaLabel="조회 시간"
          readOnly
        />
        <TimeInput
          value="17:30"
          onChange={() => {}}
          precision="minute"
          ariaLabel="비활성 시간"
          disabled
        />
      </div>
    );
  },
};

export const 모달_안_피커: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "모바일 Modal 안에서는 시간과 월 범위가 두 번째 시트 대신 popover로 열린다.",
      },
    },
  },
  render: () => {
    const [open, setOpen] = useState(false);
    const [time, setTime] = useState("09:30");
    const [range, setRange] = useState<MonthRange>({ from: null, to: null });
    return (
      <>
        <Button onClick={() => setOpen(true)}>피커 모달 열기</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="피커 선택">
          <div className="grid w-64 gap-4 p-4">
            <TimeInput value={time} onChange={setTime} precision="minute" />
            <MonthRangePicker value={range} onApply={setRange}>
              <Button variant="secondary">월 범위 선택</Button>
            </MonthRangePicker>
          </div>
        </Modal>
      </>
    );
  },
};
