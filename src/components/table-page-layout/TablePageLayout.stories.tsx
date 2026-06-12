import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { TablePageLayout, PageHeader, TableCard } from "./TablePageLayout";
import { Toolbar } from "@/components/toolbar";
import { PaginatedTable } from "@/components/table";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import type { TableColumn } from "@/components/table/types";

/**
 * TablePageLayout — 검색/요약/테이블이 있는 표준 페이지 외곽 레이아웃.
 *
 * 조합 규칙(source에서 테이블이 늘 쓰이던 형태):
 * - 최상단 `PageHeader` — 풀폭 + 하단 구분선. 제목 + 우측 액션.
 * - 본문은 흰 카드 `TableCard` 안에 `Toolbar` + `Table`을 담는다 — 이게 "흰 섹션 + 툴바" 패턴.
 *
 * `TablePageLayout`은 `h-[calc(100dvh-64px)]`를 가정한다(앱 상단바 64px). 마지막 자식(보통 TableCard)이
 * 남은 높이를 채우고 내부에서 테이블이 스크롤된다. Storybook 미리보기에선 높이를 명시해 감싼다.
 */
const meta = {
  title: "Layouts/TablePageLayout",
  component: TablePageLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "테이블 페이지 표준 외곽: PageHeader(풀폭 헤더) + TableCard(흰 카드) 안에 Toolbar+Table. source에서 테이블이 늘 쓰이던 '흰 섹션+툴바' 패턴을 컴포넌트화.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TablePageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({ docs: { description: { story: text } } });

interface Row {
  id: string;
  name: string;
  bizNo: string;
  status: "활성" | "중지";
  amount: number;
}

const SAMPLE: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: String(i + 1),
  name: `테넌트 ${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
  bizNo: `${(123 + i) % 1000}-${(45 + i) % 100}-${(67890 + i) % 100000}`,
  status: i % 5 === 0 ? "중지" : "활성",
  amount: ((i * 137) % 900 + 100) * 1000,
}));

const COLUMNS: TableColumn<Row>[] = [
  { key: "id", header: "ID", accessor: (r) => r.id },
  { key: "name", header: "테넌트명", accessor: (r) => r.name },
  { key: "bizNo", header: "사업자번호", accessor: (r) => r.bizNo },
  {
    key: "status",
    header: "상태",
    accessor: (r) => (
      <Badge color={r.status === "활성" ? "success" : "neutral"} variant="weak" size="xsmall">
        {r.status}
      </Badge>
    ),
  },
  { key: "amount", header: "정산액", accessor: (r) => `₩ ${r.amount.toLocaleString()}` },
];

/** 전체 페이지 — 헤더 + 흰 카드(툴바 + 페이지네이티드 테이블). source 테이블 페이지의 표준 골격. */
export const 전체페이지: Story = {
  parameters: story(
    "PageHeader(제목+액션) → TableCard(흰 카드) 안에 Toolbar(요약/컨트롤/액션) + PaginatedTable. 테이블이 단독으로 떠 있지 않고 항상 이 골격 안에 놓인다.",
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
      // Storybook 미리보기용 높이 래퍼 (실제 앱에선 TablePageLayout이 100dvh-64px를 차지)
      <div style={{ height: "600px" }}>
        <TablePageLayout>
          <PageHeader title="테넌트 정산 관리">
            <Button variant="secondary" size="small">엑셀 다운로드</Button>
            <Button variant="primary" size="small">+ 테넌트 등록</Button>
          </PageHeader>
          <TableCard>
            <Toolbar>
              <Toolbar.Summary totalElements={SAMPLE.length}>
                <Toolbar.Summary.Item variant="success">활성 38</Toolbar.Summary.Item>
                <Toolbar.Summary.Item variant="neutral">중지 9</Toolbar.Summary.Item>
              </Toolbar.Summary>
              <Toolbar.Left>
                <Button variant="secondary" size="small">컬럼 설정</Button>
              </Toolbar.Left>
            </Toolbar>
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
          </TableCard>
        </TablePageLayout>
      </div>
    );
  },
};
