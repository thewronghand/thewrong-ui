import type { Meta, StoryObj } from "@storybook/react";
import { Toolbar } from "./Toolbar";
import { Button } from "@/components/button";

/**
 * Toolbar — 테이블 위에 놓이는 표준 툴바(컴파운드 컴포넌트).
 *
 * 슬롯으로 조립한다:
 * - `<Toolbar.Title>` — 영역 제목
 * - `<Toolbar.Summary>` — 데이터 요약 칩(총 N건 + Summary.Item 칩들). collapsible로 모바일 접기
 * - `<Toolbar.Left>` — 좌측 컨트롤(프리셋 셀렉터 등)
 * - `<Toolbar.Right>` — 우측 액션(다운로드·등록 버튼 등). collapseOnMobile로 팝오버 묶기
 *
 * 레이아웃: Summary가 있으면 윗줄, Left+Right는 아랫줄. Summary 없으면 한 줄.
 */
const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "테이블 위 표준 툴바. Title/Summary/Left/Right 슬롯으로 조립. Summary는 총건수 칩+요약 칩, Right는 모바일 팝오버 묶기 지원.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const 기본: Story = {
  args: { children: null },
  parameters: story("Left(좌측 컨트롤) + Right(우측 액션) 한 줄. 가장 흔한 형태."),
  render: () => (
    <Toolbar>
      <Toolbar.Left>
        <Button variant="secondary" size="small">컬럼 설정</Button>
      </Toolbar.Left>
      <Toolbar.Right>
        <Button variant="secondary" size="small">엑셀 다운로드</Button>
        <Button variant="primary" size="small">+ 등록</Button>
      </Toolbar.Right>
    </Toolbar>
  ),
};

export const 요약칩: Story = {
  args: { children: null },
  parameters: story("Summary 슬롯 — 총 N건 트리거 칩 + Summary.Item 칩들(입금/출금/차액 등). variant로 색 구분."),
  render: () => (
    <Toolbar>
      <Toolbar.Summary totalElements={1287}>
        <Toolbar.Summary.Item variant="success">입금 ₩ 12,500,000</Toolbar.Summary.Item>
        <Toolbar.Summary.Item variant="error">출금 ₩ 3,200,000</Toolbar.Summary.Item>
        <Toolbar.Summary.Item variant="warning">차액 ₩ 9,300,000</Toolbar.Summary.Item>
      </Toolbar.Summary>
      <Toolbar.Left>
        <Button variant="secondary" size="small">컬럼 설정</Button>
      </Toolbar.Left>
      <Toolbar.Right>
        <Button variant="primary" size="small">+ 등록</Button>
      </Toolbar.Right>
    </Toolbar>
  ),
};

export const 제목과함께: Story = {
  args: { children: null },
  parameters: story("Title 슬롯 — 영역 제목. Summary/Left/Right 위에 한 줄 차지한다."),
  render: () => (
    <Toolbar>
      <Toolbar.Title>정산 내역</Toolbar.Title>
      <Toolbar.Summary totalElements={89} totalPrefix="MID" />
      <Toolbar.Right>
        <Button variant="secondary" size="small">엑셀</Button>
      </Toolbar.Right>
    </Toolbar>
  ),
};
