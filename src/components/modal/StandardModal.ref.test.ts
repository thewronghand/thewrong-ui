import { createElement, createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/button";
import { StandardModal } from "./StandardModal";

vi.mock("@/lib/Portal", () => ({
  Portal: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/button", () => ({ Button: vi.fn(() => null) }));

describe("StandardModal 액션 ref", () => {
  it("각 액션의 ref를 해당 버튼으로 전달한다", () => {
    const primary = createRef<HTMLButtonElement>();
    const secondary = createRef<HTMLButtonElement>();
    const left = createRef<HTMLButtonElement>();
    const action = (label: string, ref: typeof primary) => ({
      label,
      ref,
      onClick: () => {},
    });
    renderToStaticMarkup(
      createElement(StandardModal, {
        isOpen: true,
        onClose: () => {},
        children: "본문",
        primaryAction: action("저장", primary),
        secondaryAction: action("취소", secondary),
        leftAction: action("이력", left),
      }),
    );
    const calls = vi.mocked(Button).mock.calls.map(([props]) => props);
    for (const [label, ref] of [
      ["저장", primary],
      ["취소", secondary],
      ["이력", left],
    ] as const) {
      expect(calls.find((props) => props.children === label)?.ref).toBe(ref);
    }
  });
});
