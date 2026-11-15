import { createElement, createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "@/hooks";
import { Drawer } from "./Drawer";

vi.mock("@/lib/Portal", () => ({
  Portal: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/hooks", () => ({
  useFocusTrap: vi.fn(),
  useIsMobile: () => false,
  useScrollLock: vi.fn(),
}));

describe("Drawer 초기 포커스", () => {
  it("지정한 ref를 포커스 트랩에 전달한다", () => {
    const initialFocus = createRef<HTMLButtonElement>();
    renderToStaticMarkup(
      createElement(Drawer, {
        open: true,
        onClose: () => {},
        initialFocus,
        children: "본문",
      }),
    );
    expect(useFocusTrap).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ enabled: true, initialFocus }),
    );
  });
});
