import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";
import { useVirtualRows } from "./useVirtualRows";

const meta = {
  title: "Hooks/VirtualRows",
  parameters: {
    docs: {
      description: {
        component:
          "고정 높이의 스크롤 영역에 ref를 연결합니다. 가상 항목과 앞뒤 스페이서로 전체 높이를 유지합니다.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const { virtualItems, topSpacerHeight, bottomSpacerHeight } =
      useVirtualRows({ scrollElementRef: ref, count: 1000 });
    return (
      <div
        ref={ref}
        className="h-64 w-80 overflow-auto rounded-surface border border-border-subtle bg-bg-surface"
        aria-label="가상 행 목록"
      >
        <div style={{ height: topSpacerHeight }} />
        {virtualItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center border-b border-border-subtle px-4 text-fg-default"
            style={{ height: item.size }}
          >
            항목 {item.index + 1}
          </div>
        ))}
        <div style={{ height: bottomSpacerHeight }} />
      </div>
    );
  },
};
