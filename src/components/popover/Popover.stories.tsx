import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "./Popover";
import { Button } from "@/components/button";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <Button>메뉴 열기</Button>,
    content: (
      <div className="flex flex-col gap-1 text-sm text-text-primary">
        <span className="font-medium">팝오버 콘텐츠</span>
        <span className="text-text-secondary">
          외부를 클릭하면 닫혀요. trigger 오른쪽 끝 기준으로 배치됩니다.
        </span>
      </div>
    ),
  },
};

export const WithCloseCallback: Story = {
  args: { trigger: null, content: null },
  render: () => (
    <Popover
      trigger={<Button variant="secondary">액션 메뉴</Button>}
      content={(close) => (
        <div className="flex flex-col gap-1">
          {["수정", "복제", "삭제"].map((label) => (
            <button
              key={label}
              onClick={close}
              className="rounded-md px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-base-secondary"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    />
  ),
};
