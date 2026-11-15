import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { StandardModal } from "./StandardModal";

vi.mock("@/lib/Portal", () => ({ Portal: ({ children }: { children: ReactNode }) => children }));

describe("Modal 설명 연결", () => {
  it("제목은 연결하고 본문은 기본적으로 설명에 연결하지 않는다", () => {
    const html = renderToStaticMarkup(createElement(Modal, {
      isOpen: true, onClose: () => {}, title: "확인", children: "본문 설명",
    }));
    expect(html).toContain("aria-labelledby=");
    expect(html).not.toContain("aria-describedby");
  });

  it("설명 id를 지정한 경우에만 연결하고 StandardModal도 전달한다", () => {
    const render = (children: ReactNode, describedBy?: string) =>
      renderToStaticMarkup(createElement(Modal, { isOpen: true, onClose: () => {}, children, describedBy }));
    expect(render(null)).not.toContain("aria-describedby");
    expect(render("  ")).not.toContain("aria-describedby");
    expect(render("본문")).not.toContain("aria-describedby");
    expect(render(null, "external-description")).toContain('aria-describedby="external-description"');
    const emptyStandard = renderToStaticMarkup(createElement(StandardModal, {
      isOpen: true, onClose: () => {}, children: null,
    }));
    expect(emptyStandard).not.toContain("aria-describedby");
    const describedStandard = renderToStaticMarkup(createElement(StandardModal, {
      isOpen: true, onClose: () => {}, children: "본문", describedBy: "description",
    }));
    expect(describedStandard).toContain('aria-describedby="description"');
  });
});
