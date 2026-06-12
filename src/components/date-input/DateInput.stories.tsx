import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateInput } from "./DateInput";

/**
 * DateInput — 네이티브 `<input type="date">` + 우측 캘린더 버튼(DatePicker popover).
 *
 * 직접 타이핑(브라우저가 yyyy-MM-dd 형식 강제) 또는 캘린더 버튼으로 선택. 트리거 없이 폼 필드처럼 인라인 배치.
 * `label`을 주면 SearchBox와 같은 플로팅 라벨(값 없을 땐 중앙 placeholder, 포커스/값 있으면 상단으로 부유)이 적용된다.
 */
const meta = {
  title: "Components/DateInput",
  component: DateInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "네이티브 date input + 캘린더 popover. 인라인 폼 필드. label 지정 시 SearchBox 플로팅 라벨. mini/small 두 사이즈.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const 기본: Story = {
  args: { value: "", onChange: () => {}, ariaLabel: "날짜" },
  parameters: story("값 없으면 '연도-월-일' placeholder. 직접 입력하거나 우측 캘린더 버튼으로 선택."),
  render: () => {
    const [value, setValue] = useState("");
    return <DateInput value={value} onChange={setValue} ariaLabel="날짜" />;
  },
};

export const 플로팅라벨: Story = {
  args: { value: "", onChange: () => {}, label: "기준일" },
  parameters: story("label을 주면 SearchBox 톤의 플로팅 라벨. 값/포커스 시 라벨이 상단 보더 위로 떠오른다."),
  render: () => {
    const [value, setValue] = useState("");
    return <DateInput value={value} onChange={setValue} label="기준일" />;
  },
};

export const 사이즈: Story = {
  args: { value: "", onChange: () => {} },
  parameters: story("mini(협소 영역) / small(데스크톱 폼, 기본)."),
  render: () => {
    const [a, setA] = useState("");
    const [b, setB] = useState("");
    return (
      <div className="flex flex-col gap-3">
        <DateInput value={a} onChange={setA} size="mini" ariaLabel="mini" />
        <DateInput value={b} onChange={setB} size="small" ariaLabel="small" />
      </div>
    );
  },
};
