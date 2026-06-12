import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SearchBox } from "./SearchBox";
import { DEFAULT_DATE_RANGE_PRESETS } from "./dateRangePresets";
import type { SearchField, SearchValues } from "./types";

/**
 * SearchBox — 선언적 검색 바. `fields` 배열만 정의하면 타입별 컨트롤이 자동 렌더된다.
 *
 * field type: `text` / `select` / `multiSelect` / `dateRange` / `dateSingle` / `month`.
 * draft 상태(입력 중 값)는 SearchBox 내부가 관리하고, [검색]을 눌러야 `onSearch(values)`로 emit한다 —
 * 즉 입력마다 쿼리가 나가지 않는다. 모바일에선 바텀시트로 전환되고, 적용된 조건은 칩으로 표시된다.
 *
 * 결과 파싱은 `parseSearchValues`가 field 타입에 맞춰(범위→{from,to}, multiSelect→배열) 풀어준다.
 */
const meta = {
  title: "Components/SearchBox",
  component: SearchBox,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "선언적 검색 바. fields 배열로 text/select/multiSelect/dateRange/dateSingle/month 컨트롤 자동 생성. draft는 내부 관리, [검색] 시 onSearch emit, 모바일 바텀시트+칩.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchBox>;

export default meta;
// fields가 required라 느슨한 StoryObj + render로 둔다.
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

const FIELDS: readonly SearchField[] = [
  { type: "text", key: "keyword", label: "검색어", placeholder: "테넌트명/사업자번호" },
  {
    type: "select",
    key: "status",
    label: "상태",
    options: [
      { value: "active", label: "활성" },
      { value: "suspended", label: "중지" },
    ],
  },
  {
    type: "multiSelect",
    key: "categories",
    label: "카테고리",
    options: [
      { value: "pg", label: "PG" },
      { value: "vacct", label: "가상계좌" },
      { value: "card", label: "카드" },
    ],
  },
  { type: "dateRange", key: "period", label: "기간", presets: DEFAULT_DATE_RANGE_PRESETS },
];

export const 기본: Story = {
  parameters: story("text+select+multiSelect+dateRange 혼합. [검색]을 눌러야 onSearch로 값이 나간다. 아래에 적용된 values를 그대로 출력."),
  render: () => {
    const [applied, setApplied] = useState<SearchValues>({});
    return (
      <div className="flex flex-col gap-4">
        <SearchBox fields={FIELDS} values={applied} onSearch={setApplied} />
        <pre className="rounded-lg bg-bg-base-secondary p-3 text-xs text-text-secondary">
          {JSON.stringify(applied, null, 2)}
        </pre>
      </div>
    );
  },
};

export const 완전일치_토글: Story = {
  parameters: story("exactMatch를 주면 검색/초기화 좌측에 '완전일치' 토글이 노출된다. value/onChange를 함께 받는다."),
  render: () => {
    const [applied, setApplied] = useState<SearchValues>({});
    const [exact, setExact] = useState(false);
    return (
      <SearchBox
        fields={[FIELDS[0], FIELDS[1]]}
        values={applied}
        onSearch={setApplied}
        exactMatch={{ value: exact, onChange: setExact }}
      />
    );
  },
};

export const 날짜_조건: Story = {
  parameters: story("dateSingle / month 단일 날짜 필드. 프리셋 버튼으로 빠른 선택."),
  render: () => {
    const [applied, setApplied] = useState<SearchValues>({});
    const fields: readonly SearchField[] = [
      { type: "dateSingle", key: "baseDate", label: "기준일" },
      { type: "month", key: "settleMonth", label: "정산월" },
    ];
    return <SearchBox fields={fields} values={applied} onSearch={setApplied} />;
  },
};
