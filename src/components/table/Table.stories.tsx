import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { Table } from "./table";
import { PaginatedTable } from "./paginated-table";
import { MiniTable } from "./mini-table";
import { TableCheckbox } from "@/components/table-checkbox";
import type { TableColumn } from "./types";

/**
 * Table — 정렬·리사이즈·행 선택·sticky 헤더·컬럼 프리셋을 갖춘 데이터 테이블.
 *
 * 핵심 가족:
 * - `Table` — 페이지네이션 없이 한 번에 그린다. 정렬/리사이즈/선택/sticky 지원.
 * - `PaginatedTable` — Table 코어에 페이지네이션 footer를 더한 변형. 페이지·페이지사이즈·페이지점프 내장.
 * - `MiniTable` / `AccordionTable` — 모달 안 단순 표 / 펼침 행 변형.
 *
 * 컬럼은 `{ key, header, accessor }` 평면 배열. 선택·정렬·리사이즈는 prop으로 켠다.
 */
interface Tenant {
  id: string;
  name: string;
  bizNo: string;
  status: "활성" | "중지";
  usageRate: number;
}

const SAMPLE: Tenant[] = Array.from({ length: 87 }, (_, i) => ({
  id: String(i + 1),
  name: `테넌트 ${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
  bizNo: `${(123 + i) % 1000}-${(45 + i) % 100}-${(67890 + i) % 100000}`,
  status: i % 5 === 0 ? "중지" : "활성",
  usageRate: (i * 7) % 100,
}));

const COLUMNS: TableColumn<Tenant>[] = [
  { key: "id", header: "ID", accessor: (r) => r.id },
  { key: "name", header: "테넌트명", accessor: (r) => r.name },
  { key: "bizNo", header: "사업자번호", accessor: (r) => r.bizNo },
  { key: "status", header: "상태", accessor: (r) => r.status },
  { key: "rate", header: "사용률", accessor: (r) => `${r.usageRate}%`, sortable: true },
];

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "정렬·리사이즈·행 선택·sticky·컬럼 프리셋을 갖춘 데이터 테이블. PaginatedTable은 footer를 더한 변형, MiniTable/AccordionTable은 경량 변형.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
// Table props는 제네릭 T라 StoryObj<typeof meta>가 args를 좁히기 어렵다. 모두 render로.
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const 페이지네이티드: Story = {
  parameters: story(
    "PaginatedTable — 주력. 페이지/페이지사이즈/페이지점프 footer 내장. data는 현재 페이지 슬라이스만 넘기고, currentPage·totalPages·onPageChange로 제어한다.",
  ),
  render: () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const slice = useMemo(
      () => SAMPLE.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
      [page, pageSize],
    );
    const totalPages = Math.ceil(SAMPLE.length / pageSize);
    return (
      <PaginatedTable
        data={slice}
        columns={COLUMNS}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        totalElements={SAMPLE.length}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
    );
  },
};

export const 기본_정렬: Story = {
  parameters: story("Table — 페이지네이션 없이 한 번에. `sortable` 컬럼(사용률) 헤더 클릭으로 정렬."),
  render: () => {
    const data = useMemo(() => SAMPLE.slice(0, 12), []);
    return <Table data={data} columns={COLUMNS} totalElements={data.length} />;
  },
};

export const 행_선택: Story = {
  parameters: story("enableRowSelection + enableSelectAll. 체크박스 선택, 헤더 체크박스로 전체 선택. selectedRows를 외부 state로 제어."),
  render: () => {
    const data = useMemo(() => SAMPLE.slice(0, 10), []);
    const [selected, setSelected] = useState<Tenant[]>([]);
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-tertiary">{selected.length}건 선택됨</span>
        <Table
          data={data}
          columns={COLUMNS}
          enableRowSelection
          enableSelectAll
          selectedRows={selected}
          onRowSelect={(row, next) =>
            setSelected((prev) =>
              next ? [...prev.filter((r) => r.id !== row.id), row] : prev.filter((r) => r.id !== row.id),
            )
          }
          rowCompare={(a, b) => a.id === b.id}
          getRowId={(row) => row.id}
          totalElements={data.length}
        />
      </div>
    );
  },
};

export const 미니: Story = {
  parameters: story("MiniTable — 모달 안 등 좁은 영역의 단순 표. 정렬/리사이즈 없이 가볍게."),
  render: () => {
    const data = useMemo(() => SAMPLE.slice(0, 5), []);
    return (
      <div className="max-w-sm">
        <MiniTable
          data={data}
          columns={[
            { key: "name", header: "테넌트명", accessor: (r: Tenant) => r.name },
            { key: "status", header: "상태", accessor: (r: Tenant) => r.status },
          ]}
        />
      </div>
    );
  },
};

export const 체크박스_단독: Story = {
  parameters: story("TableCheckbox — 테이블 전용 체크박스. checked / indeterminate / disabled. 드래그 선택 시 pointerEventsNone로 부모가 클릭을 가로챈다."),
  render: () => {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="flex items-center gap-4">
        <TableCheckbox checked={a} onChange={setA} ariaLabel="a" />
        <TableCheckbox checked={b} onChange={setB} ariaLabel="b" />
        <TableCheckbox checked={false} indeterminate ariaLabel="부분선택" />
        <TableCheckbox checked={true} disabled ariaLabel="비활성 선택" />
        <TableCheckbox checked={false} disabled ariaLabel="비활성" />
      </div>
    );
  },
};
