import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "@/components/drawer";
import { Modal } from "./Modal";

const subView = vi.hoisted(() => ({ open: false }));
vi.mock("@/lib/Portal", () => ({ Portal: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/modal/ModalFocusTrapContext", async () => {
  const actual = await vi.importActual<typeof import("@/components/modal/ModalFocusTrapContext")>(
    "@/components/modal/ModalFocusTrapContext",
  );
  return {
    ...actual,
    useModalSubViews: () => ({
      context: actual.defaultModalFocusTrapContext,
      isTop: () => true,
      hasOpenSubView: subView.open,
    }),
  };
});

describe("서브뷰 상태에 따른 부모 설명 연결", () => {
  for (const [name, render] of [
    ["Modal", () => renderToStaticMarkup(createElement(Modal, {
      isOpen: true, onClose: () => {}, describedBy: "description", children: "본문",
    }))],
    ["Drawer", () => renderToStaticMarkup(createElement(Drawer, {
      open: true, onClose: () => {}, describedBy: "description", children: "본문",
    }))],
  ] as const) {
    it(`${name}은 서브뷰가 열린 동안 설명을 해제하고 닫으면 복원한다`, () => {
      subView.open = false;
      expect(render()).toContain('aria-describedby="description"');
      subView.open = true;
      expect(render()).not.toContain("aria-describedby");
      subView.open = false;
      expect(render()).toContain('aria-describedby="description"');
    });
  }
});
