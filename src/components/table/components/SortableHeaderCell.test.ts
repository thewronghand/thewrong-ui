import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { SortableHeaderCell } from "./SortableHeaderCell";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    attributes: { role: "button", tabIndex: 0, "aria-pressed": true },
    listeners: {},
    transform: null,
    transition: undefined,
    isDragging: true,
  }),
}));

it("정렬 버튼이 있는 드래그 중 헤더에 aria-pressed를 전달하지 않는다", () => {
  const markup = renderToStaticMarkup(createElement(SortableHeaderCell, {
    id: "name", as: "th", hasSortButton: true, children: "이름",
  }));
  expect(markup).not.toMatch(/<th\b[^>]*aria-pressed=/);
});
