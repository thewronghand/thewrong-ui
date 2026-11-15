import { useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";

import { Table, type ColumnSort, type TableColumn } from "@/components/table";
import { Tabs } from "@/components/tabs";
import { Slider } from "@/components/slider";
import { MultiSelect, Select } from "@/components/select";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import "@/styles/index.css";

const items = [
  { value: "first", label: "첫 탭", content: <input aria-label="첫 입력" /> },
  { value: "second", label: "둘째 탭", content: <input aria-label="둘째 입력" /> },
];
type Row = { name: string; time: Date | null };
const rows: Row[] = [
  { name: "늦음", time: new Date("2026-11-15T18:00:00Z") },
  { name: "없음", time: null },
  { name: "이름", time: new Date("2026-11-15T09:00:00Z") },
];
const columns: TableColumn<Row>[] = [
  { key: "name", header: "이름", accessor: (row) => row.name },
  { key: "time", header: "날짜", sortable: true, accessor: () => "같은 날짜", sortValue: (row) => row.time },
];

function App() {
  const [sort, setSort] = useState<ColumnSort | null>({ key: "time", direction: "asc" });
  const [requested, setRequested] = useState<ColumnSort | null>(null);
  const [instance, setInstance] = useState(0);
  return (
    <>
      <section aria-label="유지"><Tabs items={items} keepMounted aria-label="유지 탭" /></section>
      <section aria-label="기본"><Tabs items={items} aria-label="기본 탭" /></section>
      <section aria-label="폭">
        <Slider aria-label="슬라이더" className="w-32" />
        <Select variant="box" options={[]} value="" onChange={() => {}} aria-label="단일" containerProps={{ id: "single-width", className: "w-40" }} />
        <MultiSelect variant="box" options={[]} value={[]} onChange={() => {}} aria-label="다중" containerProps={{ id: "multi-width", className: "w-40" }} />
        <Input variant="box" aria-label="입력" containerProps={{ id: "input-width", className: "w-40 marker" }} />
        <Input variant="box" aria-label="기본 폭 입력" containerProps={{ id: "input-default", className: "marker" }} />
      </section>
      <section aria-label="제어 정렬">
        <output>{requested?.direction ?? "없음"}</output>
        <button type="button" onClick={() => setSort(requested)}>적용</button>
        <button type="button" onClick={() => setInstance((value) => value + 1)}>다시 마운트</button>
        <Table key={instance} columns={columns} data={rows} sort={sort} onSortChange={setRequested} enableSorting fillEmptyRows={false} />
      </section>
      <section aria-label="서버 정렬">
        <Table columns={columns} data={rows} sort={{ key: "time", direction: "desc" }} serverSideSorting fillEmptyRows={false} />
      </section>
      <section aria-label="포커스 띠">
        <Button>기본 띠</Button>
        <Button style={{ "--tw-ring-offset-color": "var(--color-bg-page)" } as CSSProperties}>페이지색 띠</Button>
      </section>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
