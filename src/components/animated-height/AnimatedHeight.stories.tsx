import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AnimatedHeight } from "./AnimatedHeight";
import { Button } from "@/components/button";

/**
 * AnimatedHeight — 자식 콘텐츠의 높이가 *바뀔 때마다* 부드럽게 추적해 애니메이션한다.
 * 행 추가/제거, 검색 결과 증감, 동적 리스트처럼 "내용이 변하면서 높이도 변하는" 경우에 쓴다.
 *
 * 단순히 열림/닫힘 두 상태만 전환한다면 Collapsible이 더 가볍다(JS 측정 없이 grid 트릭).
 * AnimatedHeight는 ResizeObserver로 실제 높이를 추적하므로 임의의 콘텐츠 변화에 대응한다.
 *
 * 너비는 추적하지 않는다 — 폭이 변하면 "뚝 끊기는 확장"이 보이므로 컨테이너 너비를 고정할 것.
 */
const meta = {
  title: "Components/AnimatedHeight",
  component: AnimatedHeight,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "자식 높이 변화를 ResizeObserver로 추적해 애니메이션. 내용이 변하며 높이가 따라가야 할 때. 단순 열림/닫힘은 Collapsible. 너비는 고정 권장.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AnimatedHeight>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const Default: Story = {
  args: { children: null },
  parameters: story("행을 추가/제거하면 높이가 그 변화를 부드럽게 따라간다. 너비는 w-80으로 고정해 가로 점프를 막았다."),
  render: () => {
    const [rows, setRows] = useState(1);
    return (
      <div className="w-80">
        <div className="mb-3 flex gap-2">
          <Button size="small" onClick={() => setRows((r) => r + 1)}>
            행 추가
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setRows((r) => Math.max(1, r - 1))}
          >
            행 제거
          </Button>
        </div>
        <AnimatedHeight className="rounded-xl border border-border-tertiary bg-bg-card">
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className="rounded-lg bg-bg-base-secondary px-3 py-2 text-sm text-text-primary"
              >
                행 {i + 1}
              </div>
            ))}
          </div>
        </AnimatedHeight>
      </div>
    );
  },
};
