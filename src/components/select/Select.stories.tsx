import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";
import type { SelectOption } from "./types";

/**
 * Select — floating-ui 기반 단일 선택. 트리거 폭과 패널 폭이 정합되고 a11y 키보드 동작을 갖춘다.
 *
 * 트리거 외관(슬롯/사이즈/variant)은 Input과 동일 토큰을 공유한다.
 * searchable로 옵션 검색(클라이언트 필터/서버 검색)을 켤 수 있고, 옵션에 description/trailing을 줄 수 있다.
 */
const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "단일 선택 Select. box variant + size 토큰은 Input과 정합. description/trailing 옵션, searchable 지원.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
// Select props가 discriminated union(searchable 여부)이라 StoryObj<typeof meta>는 args를
// never로 강제한다. 모든 케이스를 render로 그리므로 args 없는 느슨한 StoryObj로 둔다.
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

const COUNTRIES: SelectOption[] = [
  { value: "kr", label: "대한민국" },
  { value: "us", label: "미국" },
  { value: "jp", label: "일본" },
  { value: "cn", label: "중국" },
  { value: "de", label: "독일" },
];

export const 기본: Story = {
  parameters: story("가장 기본. value/onChange 제어. placeholder는 미선택 시 노출."),
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Select
        variant="box"
        options={COUNTRIES}
        value={value}
        onChange={setValue}
        placeholder="국가 선택"
      />
    );
  },
};

export const 사이즈: Story = {
  parameters: story("mini / small / medium / large — Input과 동일한 height·rounded·padding 토큰."),
  render: () => {
    const [v, setV] = useState("");
    return (
      <div className="flex flex-col gap-3">
        {(["mini", "small", "medium", "large"] as const).map((s) => (
          <Select
            key={s}
            variant="box"
            selectSize={s}
            options={COUNTRIES}
            value={v}
            onChange={setV}
            placeholder={s}
            labelOption="sustain"
            label={s}
          />
        ))}
      </div>
    );
  },
};

export const 상태별: Story = {
  parameters: story("default / filled / error / disabled."),
  render: () => {
    const [v, setV] = useState("kr");
    return (
      <div className="flex flex-col gap-3">
        <Select variant="box" options={COUNTRIES} value="" onChange={() => {}} placeholder="default" labelOption="sustain" label="default" />
        <Select variant="box" options={COUNTRIES} value={v} onChange={setV} labelOption="sustain" label="filled" />
        <Select variant="box" options={COUNTRIES} value="us" onChange={() => {}} hasError help="필수 항목이에요" labelOption="sustain" label="error" />
        <Select variant="box" options={COUNTRIES} value="jp" onChange={() => {}} disabled labelOption="sustain" label="disabled" />
      </div>
    );
  },
};

export const 옵션_description_trailing: Story = {
  parameters: story("옵션마다 라벨 아래 description, 우측 trailing 표시 가능. 트리거에는 라벨만 노출된다."),
  render: () => {
    const [v, setV] = useState("");
    const accounts: SelectOption[] = [
      { value: "1", label: "신한 110-***", description: "기업 주거래", trailing: "₩ 1,250,000" },
      { value: "2", label: "국민 220-***", description: "정산 전용", trailing: "₩ 80,000" },
      { value: "3", label: "우리 330-***", description: "예비비", trailing: "₩ 5,400,000" },
    ];
    return (
      <Select
        variant="box"
        options={accounts}
        value={v}
        onChange={setV}
        placeholder="출금 계좌 선택"
        labelOption="sustain"
        label="출금 계좌"
      />
    );
  },
};

export const Searchable_클라이언트필터: Story = {
  parameters: story("searchable=true. 트리거 자체가 input — 클릭하면 펼쳐지고 입력하면 클라이언트 측에서 옵션 필터링. 선택 시 chip처럼 동작(닫힌 상태 readonly), Backspace로 클리어."),
  render: () => {
    const [v, setV] = useState("");
    const many: SelectOption[] = Array.from({ length: 30 }, (_, i) => ({
      value: String(i),
      label: `옵션 ${i + 1} - ${["서울", "부산", "대구", "인천", "광주"][i % 5]}`,
    }));
    return (
      <Select
        variant="box"
        searchable
        options={many}
        value={v}
        onChange={setV}
        placeholder="검색해서 선택"
        searchPlaceholder="도시 검색..."
        labelOption="sustain"
        label="지역"
      />
    );
  },
};
