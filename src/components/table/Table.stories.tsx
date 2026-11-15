import type { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { useLayoutEffect, useMemo, useState } from "react";
import { Table } from "./table";
import { AccordionTable } from "./accordion-table";
import { PaginatedTable } from "./paginated-table";
import { MiniTable } from "./mini-table";
import { TableCheckbox } from "@/components/table-checkbox";
import { Modal } from "@/components/modal";
import { Drawer } from "@/components/drawer";
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
        <span className="text-sm text-fg-subtle">{selected.length}건 선택됨</span>
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

export const AccessibleSorting: Story = {
  render: () => {
    const data = SAMPLE.slice(0, 4);
    const columns: TableColumn<Tenant>[] = [
      { key: "name", header: "이름", accessor: (row) => row.name, sortable: true },
      { key: "rate", header: "사용률", accessor: (row) => row.usageRate, sortable: true },
      { key: "status", header: "상태", accessor: (row) => row.status },
    ];
    return (
      <div className="grid gap-6">
        <section aria-label="세 단계 정렬"><h2>세 단계 정렬</h2><Table data={data} columns={columns} enableSorting fillEmptyRows={false} /></section>
        <section aria-label="두 단계 정렬"><h2>두 단계 정렬</h2><Table data={data} columns={columns} enableSorting sortCycle="toggle" fillEmptyRows={false} /></section>
        <section aria-label="그룹 정렬"><h2>그룹 정렬</h2><Table data={data} columns={columns} enableSorting columnGroups={[{ key: "details", header: "상세", columnKeys: ["rate", "status"] }]} fillEmptyRows={false} /></section>
        <section aria-label="아코디언 정렬"><h2>아코디언 정렬</h2><AccordionTable data={data} columns={columns} enableSorting currentPage={1} totalPages={1} onPageChange={() => {}} fillEmptyRows={false} /></section>
      </div>
    );
  },
};

export const DragSorting: Story = {
  render: () => {
    const columns: TableColumn<Tenant>[] = [
      { key: "name", header: "이름", accessor: (row) => row.name, sortable: true, width: 300 },
      { key: "rate", header: "사용률", accessor: (row) => row.usageRate, sortable: true, width: 300 },
      { key: "status", header: "상태", accessor: (row) => row.status, width: 300 },
    ];
    const [order, setOrder] = useState(["name", "rate", "status"]);
    const [widths, setWidths] = useState<Record<string, number>>({});
    return (
      <Table
        data={SAMPLE.slice(0, 4)}
        columns={columns}
        enableSorting
        fillEmptyRows={false}
        columnState={{
          columnOrder: order,
          hiddenColumns: [],
          columnWidths: widths,
          onColumnOrderChange: setOrder,
          onColumnWidthsChange: setWidths,
        }}
      />
    );
  },
};

export const TableInModal: Story = {
  name: "모달 안 정렬 테이블",
  parameters: story("정렬 버튼에서 Escape와 Tab을 사용하고 Shift+Space로 컬럼을 이동한다. 같은 구성을 드로어에서도 확인할 수 있다."),
  render: () => {
    const [overlay, setOverlay] = useState<"modal" | "drawer" | null>("modal");
    const [order, setOrder] = useState(["name", "rate"]);
    const columns: TableColumn<Tenant>[] = [
      { key: "name", header: "이름", accessor: (row) => row.name, sortable: true, width: 200 },
      { key: "rate", header: "사용률", accessor: (row) => row.usageRate, sortable: true, width: 200 },
    ];
    const tables = (
      <div className="grid gap-4">
        <Table data={SAMPLE.slice(0, 2)} columns={columns} enableSorting fillEmptyRows={false}
          columnState={{ columnOrder: order, hiddenColumns: [], columnWidths: {}, onColumnOrderChange: setOrder, onColumnWidthsChange: () => {} }} />
        <Table data={SAMPLE.slice(0, 2)} columns={[{ key: "name", header: "평면", accessor: (row: Tenant) => row.name, sortable: true }]}
          enableSorting fillEmptyRows={false} />
      </div>
    );
    return (
      <div>
        <button type="button" onClick={() => setOverlay("modal")}>모달 열기</button>{" "}
        <button type="button" onClick={() => setOverlay("drawer")}>드로어 열기</button>
        <output aria-label="오버레이 상태">{overlay ?? "닫힘"}</output>
        <Modal isOpen={overlay === "modal"} onClose={() => setOverlay(null)} title="표 모달" widthPx={560}>{tables}</Modal>
        <Drawer open={overlay === "drawer"} onClose={() => setOverlay(null)} title="표 드로어" widthPx={560}>{tables}</Drawer>
      </div>
    );
  },
};

export const SortingKeyPropagation: Story = {
  name: "정렬 버튼 키 전파",
  render: () => {
    const [keys, setKeys] = useState<string[]>([]);
    const [order, setOrder] = useState(["name"]);
    // play가 시작되기 전에 window 리스너를 설치한다.
    useLayoutEffect(() => {
      const record = (event: KeyboardEvent) => setKeys((previous) => [...previous, event.key]);
      window.addEventListener("keydown", record);
      return () => window.removeEventListener("keydown", record);
    }, []);
    const columns: TableColumn<Tenant>[] = [
      { key: "name", header: "이름", accessor: (row) => row.name, sortable: true },
    ];
    return (
      <div>
        <section aria-label="드래그 열"><Table data={SAMPLE.slice(0, 1)} columns={columns} enableSorting fillEmptyRows={false}
          columnState={{ columnOrder: order, hiddenColumns: [], columnWidths: {}, onColumnOrderChange: setOrder, onColumnWidthsChange: () => {} }} /></section>
        <section aria-label="일반 열"><Table data={SAMPLE.slice(0, 1)} columns={columns} enableSorting fillEmptyRows={false} /></section>
        <output aria-label="상위 키 이벤트">{keys.join(",")}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const output = canvas.getByLabelText("상위 키 이벤트");
    for (const section of ["드래그 열", "일반 열"]) {
      const button = within(canvas.getByRole("region", { name: section })).getByRole("button", { name: "이름" });
      fireEvent.keyDown(button, { key: "Escape", code: "Escape" });
      fireEvent.keyDown(button, { key: "Tab", code: "Tab" });
    }
    await waitFor(() => expect(output.textContent).toBe("Escape,Tab,Escape,Tab"));
  },
};
