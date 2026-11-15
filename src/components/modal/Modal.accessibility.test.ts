import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { StandardModal } from "./StandardModal";

vi.mock("@/lib/Portal", () => ({ Portal: ({ children }: { children: ReactNode }) => children }));

describe("Modal 설명 연결", () => {
  it("제목과 본문을 각각 연결한다", () => {
    const html = renderToStaticMarkup(createElement(Modal, {
      isOpen: true, onClose: () => {}, title: "확인", children: "본문 설명",
    }));
    const id = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(html).toContain("aria-labelledby=");
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain("본문 설명");
  });

  it("빈 본문과 명시적 해제를 연결하지 않고 외부 설명 id를 지원한다", () => {
    const render = (children: ReactNode, describedBy?: string | false) =>
      renderToStaticMarkup(createElement(Modal, { isOpen: true, onClose: () => {}, children, describedBy }));
    expect(render(null)).not.toContain("aria-describedby");
    expect(render("  ")).not.toContain("aria-describedby");
    expect(render("본문", false)).not.toContain("aria-describedby");
    expect(render(null, "external-description")).toContain('aria-describedby="external-description"');
    const emptyStandard = renderToStaticMarkup(createElement(StandardModal, {
      isOpen: true, onClose: () => {}, children: null,
    }));
    expect(emptyStandard).not.toContain("aria-describedby");
  });
});
