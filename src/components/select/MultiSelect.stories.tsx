import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MultiSelect } from "./MultiSelect";
import type { SelectOption } from "./types";

/**
 * MultiSelect — floating-ui 기반 다중 선택. 옵션마다 체크박스를 표시하고 토글한다.
 *
 * 트리거/패널/슬롯/사이즈 토큰은 단일 `Select`·`Input`과 정합한다.
 * value는 `string[]`이고 항상 options 순서를 보존해 emit한다.
 * 트리거에는 선택 라벨을 콤마로 연결해 보여주되, 폭이 부족하면 자동으로 `${n}개 선택` 폴백으로 전환된다
 * (`disableAutoCollapse`로 끄면 항상 풀 텍스트 + ellipsis).
 */
const meta = {
  title: "Components/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "다중 선택 Select. 체크박스 토글, options 순서 보존 emit, 트리거 폭 부족 시 자동 collapse, searchable·전체선택 지원.",
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
} satisfies Meta<typeof MultiSelect>;

export default meta;
// MultiSelect props도 searchable 여부로 갈리는 discriminated union이라 StoryObj<typeof meta>는
// args를 never로 강제한다. Select와 동일하게 느슨한 StoryObj + render로 둔다.
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

const FRUITS: SelectOption[] = [
  { value: "apple", label: "사과" },
  { value: "banana", label: "바나나" },
  { value: "cherry", label: "체리" },
  { value: "grape", label: "포도" },
  { value: "melon", label: "멜론" },
  { value: "peach", label: "복숭아" },
];

export const 기본: Story = {
  parameters: story("체크박스를 토글해 여러 개 선택. value는 string[]로 제어한다."),
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <MultiSelect
        variant="box"
        options={FRUITS}
        value={value}
        onChange={setValue}
        placeholder="과일 선택"
      />
    );
  },
};

export const 사이즈: Story = {
  parameters: story("mini / small / medium / large — Select·Input과 동일 토큰."),
  render: () => {
    const [v, setV] = useState<string[]>(["apple", "banana"]);
    return (
      <div className="flex flex-col gap-3">
        {(["mini", "small", "medium", "large"] as const).map((s) => (
          <MultiSelect
            key={s}
            variant="box"
            selectSize={s}
            options={FRUITS}
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
    const [v, setV] = useState<string[]>(["cherry", "grape"]);
    return (
      <div className="flex flex-col gap-3">
        <MultiSelect variant="box" options={FRUITS} value={[]} onChange={() => {}} placeholder="default" labelOption="sustain" label="default" />
        <MultiSelect variant="box" options={FRUITS} value={v} onChange={setV} labelOption="sustain" label="filled" />
        <MultiSelect variant="box" options={FRUITS} value={["apple"]} onChange={() => {}} hasError help="최소 1개를 선택해주세요" labelOption="sustain" label="error" />
        <MultiSelect variant="box" options={FRUITS} value={["banana"]} onChange={() => {}} disabled labelOption="sustain" label="disabled" />
      </div>
    );
  },
};

export const 자동_collapse: Story = {
  parameters: story(
    "많이 선택해 트리거 폭이 모자라면 라벨 콤마 연결 → `${n}개 선택` 폴백으로 자동 전환된다. 폭이 다시 늘어나면 풀 텍스트로 복귀(회복 가능). `disableAutoCollapse`로 끌 수 있다.",
  ),
  render: () => {
    const [v, setV] = useState<string[]>(["apple", "banana", "cherry", "grape", "melon"]);
    return (
      <div className="flex flex-col gap-4">
        <MultiSelect variant="box" options={FRUITS} value={v} onChange={setV} labelOption="sustain" label="자동 collapse (기본)" />
        <MultiSelect variant="box" options={FRUITS} value={v} onChange={setV} disableAutoCollapse labelOption="sustain" label="항상 풀 텍스트 (disableAutoCollapse)" />
      </div>
    );
  },
};

export const 옵션_description_trailing: Story = {
  parameters: story("단일 Select와 같은 description / trailing 지원. disabled 옵션도."),
  render: () => {
    const [v, setV] = useState<string[]>(["1"]);
    const accounts: SelectOption[] = [
      { value: "1", label: "신한 110-***", description: "기업 주거래", trailing: "₩ 1,250,000" },
      { value: "2", label: "국민 220-***", description: "정산 전용", trailing: "₩ 80,000" },
      { value: "3", label: "우리 330-***", description: "예비비(잠금)", trailing: "₩ 5,400,000", disabled: true },
    ];
    return (
      <MultiSelect
        variant="box"
        options={accounts}
        value={v}
        onChange={setV}
        placeholder="계좌 선택"
        labelOption="sustain"
        label="대상 계좌"
      />
    );
  },
};

export const Searchable: Story = {
  parameters: story("패널 상단 검색 input으로 옵션 필터. 검색 후에도 토글 가능하고 닫아도 선택은 유지된다."),
  render: () => {
    const [v, setV] = useState<string[]>([]);
    const many: SelectOption[] = Array.from({ length: 30 }, (_, i) => ({
      value: String(i),
      label: `옵션 ${i + 1} - ${["서울", "부산", "대구", "인천", "광주"][i % 5]}`,
    }));
    return (
      <MultiSelect
        variant="box"
        searchable
        options={many}
        value={v}
        onChange={setV}
        placeholder="검색해서 다중 선택"
        searchPlaceholder="지역 검색..."
        labelOption="sustain"
        label="지역(복수)"
      />
    );
  },
};

export const 전체선택: Story = {
  parameters: story("showSelectAll로 패널 상단에 전체 선택/해제 토글 노출. searchable과 함께 쓰면 검색 결과 기준으로 동작하고 disabled 옵션은 제외된다."),
  render: () => {
    const [v, setV] = useState<string[]>([]);
    return (
      <MultiSelect
        variant="box"
        showSelectAll
        options={FRUITS}
        value={v}
        onChange={setV}
        placeholder="전체 선택 가능"
        labelOption="sustain"
        label="과일"
      />
    );
  },
};
