import type { Meta, StoryObj } from "@storybook/react";
import { PageTitle } from "./PageTitle";

/**
 * PageTitle — 페이지 헤더 좌측의 타이틀 영역. 굵은 제목 + 옆에 baseline 정렬된 부제목.
 *
 * Breadcrumb 자리를 대체한다(라우트 뎁스가 얕을 때 적합). 좁아지면 부제목이 먼저 줄고,
 * 더 좁아지면 제목도 truncate된다.
 */
const meta = {
  title: "Components/PageTitle",
  component: PageTitle,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "페이지 제목 + baseline 정렬 부제목. 좁아지면 부제목→제목 순으로 truncate.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const 기본: Story = {
  args: { title: "테넌트 정산 관리" },
};

export const 부제목: Story = {
  args: {
    title: "테넌트 정산 관리",
    subtitle: "선정산 대상 테넌트의 정산 내역을 조회·관리합니다",
  },
};

export const 좁은폭: Story = {
  args: {
    title: "아주 긴 페이지 제목이 들어왔을 때",
    subtitle: "부제목이 먼저 줄어들고 그래도 모자라면 제목이 truncate됩니다",
  },
  decorators: [
    (Story) => (
      <div className="w-64 border border-border-tertiary p-2">
        <Story />
      </div>
    ),
  ],
};
