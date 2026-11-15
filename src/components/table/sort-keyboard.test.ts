import type { KeyboardEvent, ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SortHeader } from "@/components/table/components/SortHeader";
import { SortableHeaderCell } from "@/components/table/components/SortableHeaderCell";

const mocks = vi.hoisted(() => ({ context: vi.fn(), activate: vi.fn(), dragging: false }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useContext: mocks.context,
  useId: () => "keyboard-help",
}));
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    setNodeRef: vi.fn(), setActivatorNodeRef: vi.fn(), attributes: {},
    listeners: { onKeyDown: mocks.activate }, transform: null, transition: undefined,
    isDragging: mocks.dragging,
  }),
}));

type Handler = (event: KeyboardEvent<HTMLButtonElement>) => void;
type DragContext = { onKeyDown: Handler } | null;
type Cell = ReactElement<{ onKeyDown?: Handler }>;
type Provider = ReactElement<{ value: DragContext; children: Cell }>;
type SortButton = ReactElement<{ onKeyDown?: Handler }>;

function keyEvent(code: string, shiftKey = false) {
  let stopped = false;
  const event = {
    key: code === "Space" ? " " : code, code, shiftKey,
    stopPropagation: () => { stopped = true; },
  } as KeyboardEvent<HTMLButtonElement>;
  return { event, stopped: () => stopped };
}

function press(draggable: boolean, code: string, shiftKey = false) {
  const provider = SortableHeaderCell({ id: "name", disabled: !draggable, hasSortButton: true, children: null }) as Provider;
  mocks.context.mockReturnValue(provider.props.value);
  const button = SortHeader({ children: "이름", current: null, onSort: vi.fn() }) as SortButton;
  const listener = vi.fn();
  const { event, stopped } = keyEvent(code, shiftKey);
  button.props.onKeyDown?.(event);
  if (!stopped()) provider.props.children.props.onKeyDown?.(event);
  if (!stopped()) listener(event);
  return { listener, stopped: stopped() };
}

describe("정렬 헤더 키 전파", () => {
  beforeEach(() => { mocks.context.mockReset(); mocks.activate.mockReset(); mocks.dragging = false; });

  it.each([false, true])("드래그 가능 %s: Escape·Tab·화살표를 상위 리스너에 전달한다", (draggable) => {
    for (const key of ["Escape", "Tab", "ArrowRight"]) {
      const result = press(draggable, key);
      expect(result.listener).toHaveBeenCalledOnce();
      expect(result.stopped).toBe(false);
    }
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("드래그 열의 일반 Space·Enter는 드래그를 시작하지 않고 Shift+Space만 시작한다", () => {
    for (const key of ["Space", "Enter"]) {
      expect(press(true, key).stopped).toBe(true);
      expect(mocks.activate).not.toHaveBeenCalled();
    }
    expect(press(true, "Enter", true).stopped).toBe(false);
    expect(mocks.activate).not.toHaveBeenCalled();
    const shifted = press(true, "Space", true);
    expect(shifted.stopped).toBe(false);
    expect(mocks.activate).toHaveBeenCalledOnce();
    expect(shifted.listener).toHaveBeenCalledOnce();
  });

  it("드래그 중 Escape는 차단하지 않는다", () => {
    mocks.dragging = true;
    expect(press(true, "Escape").listener).toHaveBeenCalledOnce();
  });
});
