import { createElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AccordionTable } from "./accordion-table";
import { PaginatedTable } from "./paginated-table";
import { Table } from "./table";
import { useTableSort } from "./hooks/useTableSort";
import type { ColumnSort, TableColumn } from "./types";

type Row = { name: string; time: Date | null };
const rows: Row[] = [
  { name: "늦음", time: new Date("2026-02-01T12:00:00Z") },
  { name: "없음", time: null },
  { name: "이름", time: new Date("2026-01-01T12:00:00Z") },
];
const columns: TableColumn<Row>[] = [
  { key: "name", header: "이름", accessor: (row) => row.name },
  { key: "time", header: "날짜", sortable: true, accessor: () => "2026-11-15", sortValue: (row) => row.time },
];
const asc: ColumnSort = { key: "time", direction: "asc" };
const desc: ColumnSort = { key: "time", direction: "desc" };

function namesInOrder(html: string): string[] {
  return [...html.matchAll(/>(늦음|없음|이름)<\/td>/g)].map((match) => match[1]!);
}

describe("실제 정렬 훅과 테이블 렌더", () => {
  it("유효하지 않은 날짜와 null은 두 방향 모두 마지막에 둔다", () => {
    const dates = [
      { name: "3월", value: new Date("2026-03-01T12:00:00Z") },
      { name: "유효하지 않음", value: new Date("invalid") },
      { name: "1월", value: new Date("2026-01-01T12:00:00Z") },
      { name: "2월", value: new Date("2026-02-01T12:00:00Z") },
      { name: "없음", value: null },
      { name: "작년 12월", value: new Date("2025-12-01T12:00:00Z") },
    ];
    const nullFirst = [dates[0]!, dates[2]!, dates[3]!, dates[5]!, dates[4]!, dates[1]!];
    for (const [input, missing] of [[dates, ["유효하지 않음", "없음"]], [nullFirst, ["없음", "유효하지 않음"]]] as const) {
      for (const [direction, valid] of [
        ["asc", ["작년 12월", "1월", "2월", "3월"]],
        ["desc", ["3월", "2월", "1월", "작년 12월"]],
      ] as const) {
        let names: string[] = [];
        function Probe() {
          const { sortedData } = useTableSort({ sort: { key: "value", direction } });
          names = sortedData(input, (row) => row.value).map((row) => row.name);
          return null;
        }
        renderToStaticMarkup(createElement(Probe));
        expect(names).toEqual([...valid, ...missing]);
      }
    }
  });

  it("숫자 NaN은 두 방향 모두 마지막에 둔다", () => {
    for (const [numbers, missing] of [
      [[3, NaN, 1, 2, 0], [NaN]],
      [[3, 1, 2, 0, null, NaN], [null, NaN]],
    ] as const) {
      for (const [direction, valid] of [
        ["asc", [0, 1, 2, 3]],
        ["desc", [3, 2, 1, 0]],
      ] as const) {
        let sorted: (number | null)[] = [];
        function Probe() {
          const { sortedData } = useTableSort({ sort: { key: "value", direction } });
          sorted = sortedData([...numbers], (value) => value);
          return null;
        }
        renderToStaticMarkup(createElement(Probe));
        expect(sorted).toEqual([...valid, ...missing]);
      }
    }
  });

  it("controlled 클릭은 요청만 알리고 부모 변경까지 순서와 상태를 유지한다", () => {
    const onSort = vi.fn();
    const snapshots: Array<{ sort: ColumnSort | null; names: string[] }> = [];
    function Probe() {
      const [phase, setPhase] = useState(0);
      const [external, setExternal] = useState<ColumnSort | null>(asc);
      const { sort, handleSort, sortedData } = useTableSort({ sort: external, onSort });
      snapshots.push({ sort, names: sortedData(rows, (row) => row.time).map((row) => row.name) });
      if (phase === 0) {
        handleSort("time");
        setPhase(1);
      } else if (phase === 1) {
        setExternal(desc);
        setPhase(2);
      }
      return null;
    }
    renderToStaticMarkup(createElement(Probe));
    expect(onSort).toHaveBeenCalledExactlyOnceWith(desc);
    expect(snapshots).toEqual([
      { sort: asc, names: ["이름", "늦음", "없음"] },
      { sort: asc, names: ["이름", "늦음", "없음"] },
      { sort: desc, names: ["늦음", "이름", "없음"] },
    ]);
  });

  it("비제어 훅은 오름차순, 내림차순, 해제로 전이한다", () => {
    const snapshots: Array<ColumnSort | null> = [];
    function Probe() {
      const [phase, setPhase] = useState(0);
      const { sort, handleSort } = useTableSort();
      snapshots.push(sort);
      if (phase < 3) {
        handleSort("time");
        setPhase(phase + 1);
      }
      return null;
    }
    renderToStaticMarkup(createElement(Probe));
    expect(snapshots).toEqual([null, asc, desc, null]);
  });

  it("controlled null은 정렬 해제로 유지되고 클릭은 오름차순을 요청한다", () => {
    const onSort = vi.fn();
    const snapshots: Array<ColumnSort | null> = [];
    function Probe() {
      const [clicked, setClicked] = useState(false);
      const { sort, handleSort } = useTableSort({ sort: null, onSort });
      snapshots.push(sort);
      if (!clicked) {
        handleSort("time");
        setClicked(true);
      }
      return null;
    }
    renderToStaticMarkup(createElement(Probe));
    expect(snapshots).toEqual([null, null]);
    expect(onSort).toHaveBeenCalledExactlyOnceWith(asc);
  });

  it.each(["table", "paginated", "accordion"] as const)("%s 경로는 날짜와 null을 표시값이 아닌 sortValue로 정렬한다", (kind) => {
    function render(sort: ColumnSort | null, serverSideSorting = false) {
      const common = { columns, data: rows, sort, enableSorting: true, serverSideSorting, fillEmptyRows: false };
      const page = { currentPage: 1, totalPages: 1, onPageChange: () => {} };
      const element = kind === "table"
        ? createElement(Table<Row>, common)
        : kind === "paginated"
          ? createElement(PaginatedTable<Row>, { ...common, ...page })
          : createElement(AccordionTable<Row>, { ...common, ...page });
      return renderToStaticMarkup(element);
    }
    const ascending = render(asc);
    expect(ascending).toContain('aria-sort="ascending"');
    expect(namesInOrder(ascending)).toEqual(["이름", "늦음", "없음"]);
    const descending = render(desc);
    expect(descending).toContain('aria-sort="descending"');
    expect(namesInOrder(descending)).toEqual(["늦음", "이름", "없음"]);
    const server = render(desc, true);
    expect(server).toContain('aria-sort="descending"');
    expect(namesInOrder(server)).toEqual(["늦음", "없음", "이름"]);
    expect(namesInOrder(render(null))).toEqual(["늦음", "없음", "이름"]);
    expect(render(desc)).toContain('aria-sort="descending"');
  });
});
