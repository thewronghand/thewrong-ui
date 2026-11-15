import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Table } from "./table";
import { AccordionTable } from "./accordion-table";
import type { TableColumn } from "./types";

interface Row { name: string; rate: number }
const data: Row[] = [{ name: "가", rate: 2 }];
const columns: TableColumn<Row>[] = [
  { key: "name", header: "이름", accessor: (row) => row.name, sortable: true },
  { key: "rate", header: "사용률", accessor: (row) => row.rate, sortable: true },
];
const shared = {
  data, columns, enableSorting: true, fillEmptyRows: false,
  initialSort: { key: "name", direction: "desc" as const },
};

function header(markup: string, text: string): string {
  const headers = [...markup.matchAll(/<th\b[^>]*>[\s\S]*?<\/th>/g)];
  const result = headers.map(([html]) => html).find((html) => html.includes(`>${text}<`));
  expect(result).toBeDefined();
  return result!;
}

describe("Table 정렬 헤더", () => {
  it.each(["table", "accordion"] as const)("%s는 버튼과 같은 열에 aria-sort를 전달한다", (kind) => {
    const markup = kind === "table"
      ? renderToStaticMarkup(createElement(Table<Row>, shared))
      : renderToStaticMarkup(createElement(AccordionTable<Row>, {
        ...shared, currentPage: 1, totalPages: 1, onPageChange: () => {},
      }));
    const name = header(markup, "이름");
    const rate = header(markup, "사용률");
    expect(name).toMatch(/<th\b[^>]*aria-sort="descending"/);
    expect(rate).toMatch(/<th\b[^>]*aria-sort="none"/);
    expect(name).toMatch(/<button\b(?![^>]*aria-label)[^>]*>이름<svg[^>]*aria-hidden="true"/);
    expect(name).toContain("lucide-arrow-down");
    expect(rate).toContain("lucide-arrow-up-down");
  });

  it("복잡한 헤더의 사용자 지정 버튼 이름을 유지한다", () => {
    const markup = renderToStaticMarkup(createElement(Table<Row>, {
      ...shared, formatSortLabel: () => "이름 정렬",
    }));
    expect(header(markup, "이름")).toContain('aria-label="이름 정렬"');
  });

  it("정렬과 컬럼 이동이 가능한 헤더는 버튼 하나만 Tab에 노출한다", () => {
    const markup = renderToStaticMarkup(createElement(Table<Row>, {
      ...shared,
      columnState: {
        columnOrder: ["name", "rate"], hiddenColumns: [], columnWidths: {},
        onColumnOrderChange: () => {}, onColumnWidthsChange: () => {},
      },
    }));
    const name = header(markup, "이름");
    expect(name).not.toMatch(/<th\b[^>]*tabindex=/);
    expect(name).not.toMatch(/<th\b[^>]*aria-roledescription=/);
    expect(name).toMatch(/<button\b[^>]*aria-keyshortcuts="Shift\+Space"/);
    const descriptionId = name.match(/<button\b[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(descriptionId).toBeDefined();
    expect(name).toContain(`id="${descriptionId}"`);
    expect(name).toContain("Shift+Space로 컬럼 이동");
  });
});
