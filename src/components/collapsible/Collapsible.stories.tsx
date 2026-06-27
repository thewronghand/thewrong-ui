import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Collapsible } from "./Collapsible";
import { Button } from "@/components/button";

/**
 * Collapsible — `open` 불리언으로 콘텐츠를 0 ↔ auto 높이로 부드럽게 펼치고 접는다.
 * `grid-template-rows: 0fr ↔ 1fr` 트릭이라 JS 높이 측정 없이 동작한다.
 *
 * 펼침/접힘이 명확한 토글(고급옵션, FAQ 답변)에 쓴다. 콘텐츠가 *바뀌면서* 높이가 따라가야 한다면
 * AnimatedHeight를 쓴다 — Collapsible은 열림/닫힘 두 상태 전환용이다.
 */
const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "open 토글로 0↔auto 높이 전환. grid 0fr/1fr 트릭으로 JS 측정 없이 펼침/접힘. 콘텐츠가 바뀌며 높이 추적이 필요하면 AnimatedHeight.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const Default: Story = {
  args: { open: true, children: null },
  parameters: story("가장 기본. 버튼으로 open을 토글하면 콘텐츠가 0↔auto로 펼쳐진다."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="w-80">
        <Button onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "펼치기"}
        </Button>
        <Collapsible open={open} className="mt-3">
          <div className="rounded-xl border border-border-tertiary bg-bg-card p-4 text-sm text-text-primary">
            grid-template-rows 0fr ↔ 1fr 트릭으로 JS 측정 없이 height auto를
            부드럽게 펼치고 접습니다. 여러 줄의 콘텐츠도 문제없이 동작해요.
          </div>
        </Collapsible>
      </div>
    );
  },
};

/** FAQ 아코디언 — 질문 클릭으로 답변을 펼친다. 한 번에 하나만 열리도록 제어. */
export const FAQ: Story = {
  args: { open: true, children: null },
  parameters: story("실사용 예: 한 번에 하나만 열리는 아코디언. 열린 항목 id를 state로 쥐고 Collapsible의 open에 매핑."),
  render: () => {
    const [openId, setOpenId] = useState<number | null>(0);
    const items = [
      { q: "정산 주기는 어떻게 되나요?", a: "기본 D+2 영업일이며, 계약에 따라 조정될 수 있어요." },
      { q: "수수료는 언제 차감되나요?", a: "정산 시점에 자동 차감되어 순액으로 지급됩니다." },
      { q: "세금계산서는 어디서 받나요?", a: "월 단위로 마이페이지 > 세금계산서에서 발행됩니다." },
    ];
    return (
      <div className="flex w-96 flex-col gap-2">
        {items.map((item, i) => {
          const open = openId === i;
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-border-tertiary">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary"
              >
                {item.q}
                <span className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
              </button>
              <Collapsible open={open}>
                <div className="px-4 pb-3 text-sm text-text-secondary">{item.a}</div>
              </Collapsible>
            </div>
          );
        })}
      </div>
    );
  },
};

/** 폼 고급 옵션 — 평소엔 접어두고 필요할 때만 펼치는 부가 입력 영역. */
export const 고급옵션: Story = {
  args: { open: true, children: null },
  parameters: story("실사용 예: 폼의 선택적 필드를 기본 접어두기. 토글로 펼쳐 입력 공간을 확보."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="w-80">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-primary-600"
        >
          {open ? "− 고급 옵션 숨기기" : "+ 고급 옵션"}
        </button>
        <Collapsible open={open} className="mt-2">
          <div className="flex flex-col gap-2 rounded-xl border border-border-tertiary bg-bg-card p-4 text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 영업일만 정산
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 0원 정산 건 숨기기
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 알림 메일 받기
            </label>
          </div>
        </Collapsible>
      </div>
    );
  },
};
