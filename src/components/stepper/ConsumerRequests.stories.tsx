import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "@/components/button";
import { MultiSelect, Select } from "@/components/select";
import { Slider } from "@/components/slider";
import { Table, type ColumnSort, type TableColumn } from "@/components/table";
import { Tabs } from "@/components/tabs";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Stepper } from "./Stepper";

const meta = { title: "검증/소비자 요청", tags: ["!autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const tabItems = [
  { value: "first", label: "첫 탭", content: <input aria-label="첫 입력" className="border border-fg-default bg-bg-surface text-fg-default" /> },
  { value: "second", label: "둘째 탭", content: <input aria-label="둘째 입력" className="border border-fg-default bg-bg-surface text-fg-default" /> },
];
const steps = [
  { id: "past", label: "지난 단계", skipped: true },
  { id: "current", label: "현재 단계", skipped: true },
  { id: "future", label: "예정 단계", skipped: true },
  { id: "pending", label: "대기 단계" },
];
type Row = { name: string; time: Date | null };
const rows: Row[] = [
  { name: "늦음", time: new Date("2026-11-15T18:00:00Z") },
  { name: "없음", time: null },
  { name: "이름", time: new Date("2026-11-15T09:00:00Z") },
];
const columns: TableColumn<Row>[] = [
  { key: "name", header: "이름", accessor: (row) => row.name },
  { key: "time", header: "날짜", sortable: true, accessor: () => "2026-11-15", sortValue: (row) => row.time },
];

function Gallery() {
  const [sort, setSort] = useState<ColumnSort | null>({ key: "time", direction: "asc" });
  const [requested, setRequested] = useState<ColumnSort | null>(null);
  return (
    <div className="space-y-6 text-fg-default">
      <div className="grid grid-cols-2 gap-6">
        {(["page", "surface"] as const).map((background) => (
          <section key={background} data-background={background} className={background === "page" ? "bg-bg-page p-4" : "bg-bg-surface p-4"}>
            <h2 className="mb-3 font-semibold">{background}</h2>
            <Stepper steps={steps} currentStep={1} allowNonLinear onStepChange={() => {}} />
            <p className="mt-6 text-fg-default">주변 문장 <Button appearance="link" color="inherit">상속 링크</Button> <Button appearance="link" color="inherit" disabled>비활성 링크</Button></p>
          </section>
        ))}
      </div>
      <section className="space-y-3">
        <h2>고정 폭</h2>
        <Slider aria-label="고정 슬라이더" className="w-32" />
        <Select variant="box" options={[{ value: "a", label: "항목" }]} value="a" onChange={() => {}} aria-label="단일 선택" containerProps={{ id: "single-width", className: "w-40" }} />
        <MultiSelect variant="box" options={[{ value: "a", label: "항목" }]} value={[]} onChange={() => {}} aria-label="다중 선택" containerProps={{ id: "multi-width", className: "w-40" }} />
      </section>
      <section>
        <h2>부모가 정렬을 적용할 때만 변경</h2>
        <button type="button" onClick={() => setSort(requested)}>부모 정렬 적용</button>
        <Table columns={columns} data={rows} sort={sort} onSortChange={setRequested} enableSorting fillEmptyRows={false} />
      </section>
      <section aria-label="마운트 유지 탭"><Tabs items={tabItems} keepMounted aria-label="마운트 유지" /></section>
      <section aria-label="기본 탭"><Tabs items={tabItems} aria-label="기본" /></section>
    </div>
  );
}

function TrappedTabs() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useFocusTrap(container, { enabled: true });
  return (
    <div ref={setContainer} role="dialog" aria-label="탭 포커스 트랩">
      <Tabs items={tabItems} keepMounted aria-label="트랩 탭" />
      <button type="button">트랩 끝</button>
    </div>
  );
}

export const GalleryStates: Story = { render: () => <Gallery /> };
export const FocusTrap: Story = { render: () => <TrappedTabs /> };
