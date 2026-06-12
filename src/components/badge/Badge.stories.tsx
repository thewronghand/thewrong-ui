import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import type { BadgeColor } from "./types";

/**
 * Badge — 상태·카테고리·카운트를 작게 표시하는 라벨.
 *
 * 색은 의미 토큰(`color`)으로 고른다 — 성공은 `success`, 경고는 `warning`처럼.
 * `variant`는 채움(`fill`) / 옅음(`weak`) 두 강도. `as`로 span(기본)/div/a 태그를 바꿀 수 있다.
 */
const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "상태/카테고리/카운트용 라벨. 의미 토큰 color + fill/weak variant + size 4종. as로 태그 전환.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "error",
        "warning",
        "info",
        "neutral",
      ],
    },
    variant: {
      control: "radio",
      options: ["fill", "weak"],
    },
    size: {
      control: "select",
      options: ["xsmall", "small", "medium", "large"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS: BadgeColor[] = [
  "primary",
  "secondary",
  "success",
  "error",
  "warning",
  "info",
  "neutral",
];

export const Default: Story = {
  args: {
    children: "뱃지",
    color: "primary",
    variant: "fill",
    size: "medium",
  },
};

export const AllColors: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["fill", "weak"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <span className="w-12 text-sm text-secondary-500">{variant}</span>
          {COLORS.map((color) => (
            <Badge key={color} color={color} variant={variant}>
              {color}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex items-center gap-3">
      {(["xsmall", "small", "medium", "large"] as const).map((size) => (
        <Badge key={size} color="primary" size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
};

/** 상태 표시 — 의미 토큰으로 색을 고른다. weak는 배경이 옅어 본문 옆에 두기 좋다. */
export const 상태표시: Story = {
  args: { children: "" },
  parameters: {
    docs: { description: { story: "정산/배치 등 상태를 색으로 구분. success=정상, warning=주의, error=실패, neutral=비활성." } },
  },
  render: () => (
    <div className="flex items-center gap-2">
      <Badge color="success" variant="weak" size="small">정산완료</Badge>
      <Badge color="warning" variant="weak" size="small">대기</Badge>
      <Badge color="error" variant="weak" size="small">실패</Badge>
      <Badge color="info" variant="weak" size="small">진행중</Badge>
      <Badge color="neutral" variant="weak" size="small">마감</Badge>
    </div>
  ),
};

/** 카운트/숫자 뱃지 — 항목 옆에 개수를 표시. xsmall이 인라인에 적당. */
export const 카운트: Story = {
  args: { children: "" },
  parameters: {
    docs: { description: { story: "메뉴/탭 옆 개수 표시. fill로 강조, xsmall로 작게." } },
  },
  render: () => (
    <div className="flex items-center gap-4 text-sm text-text-primary">
      <span className="flex items-center gap-1.5">
        받은 정산 <Badge color="primary" size="xsmall">12</Badge>
      </span>
      <span className="flex items-center gap-1.5">
        오류 <Badge color="error" size="xsmall">3</Badge>
      </span>
      <span className="flex items-center gap-1.5">
        신규 <Badge color="info" variant="weak" size="xsmall">N</Badge>
      </span>
    </div>
  ),
};

/** 인라인 — 제목/문단 안에 섞어 쓰기. 텍스트 베이스라인에 자연스럽게 정렬된다. */
export const 인라인: Story = {
  args: { children: "" },
  parameters: {
    docs: { description: { story: "제목 옆 카테고리/상태를 인라인으로. 텍스트와 같은 줄에 둔다." } },
  },
  render: () => (
    <p className="max-w-md text-sm leading-7 text-text-primary">
      6월 정산 보고서 <Badge color="success" variant="weak" size="xsmall">확정</Badge> 가
      업로드되었습니다. 일부 항목은 <Badge color="warning" variant="weak" size="xsmall">검토 필요</Badge>{" "}
      상태이니 마감 전에 확인해주세요.
    </p>
  ),
};
