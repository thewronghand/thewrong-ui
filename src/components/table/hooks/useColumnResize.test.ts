import type { MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getResizeStartWidth, useColumnResize } from "./useColumnResize";

// DOM 환경 없이 훅의 이벤트 연결과 mouseup 저장값을 확인한다.
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useCallback: (callback: unknown) => callback,
    useEffect: () => {},
    useRef: (initial: unknown) => ({ current: initial }),
    useState: (initial: unknown) => [
      typeof initial === "function" ? (initial as () => unknown)() : initial,
      vi.fn(),
    ],
  };
});

const col = (width: string, measuredWidth: number) => ({
  style: { width },
  getBoundingClientRect: () => ({ width: measuredWidth }),
});
const header = (width: number) => ({
  getBoundingClientRect: () => ({ width }),
});

describe("리사이즈 시작 너비", () => {
  it("저장된 0이 아닌 너비를 지정 너비보다 우선한다", () => {
    expect(getResizeStartWidth(180, col("220px", 288), header(288), 150)).toBe(180);
    expect(getResizeStartWidth(0, col("220px", 288), header(288), 150)).toBe(220);
  });

  it("저장값이 없으면 화면에서 늘어난 너비가 아닌 지정 px 너비를 사용한다", () => {
    expect(getResizeStartWidth(undefined, col("150px", 288), header(288), 150)).toBe(150);
    expect(getResizeStartWidth(undefined, col("220.5px", 288), header(288), 150)).toBe(220.5);
    expect(getResizeStartWidth(undefined, col("0px", 288), header(288), 150)).toBe(0);
  });

  it("px 지정 너비를 읽을 수 없으면 col과 헤더 순서로 화면 너비를 사용한다", () => {
    expect(getResizeStartWidth(undefined, col("50%", 220), header(230), 150)).toBe(220);
    expect(getResizeStartWidth(undefined, col("calc(100% - 5px)", 0), header(230), 150)).toBe(230);
    expect(getResizeStartWidth(undefined, null, header(230), 150)).toBe(230);
  });

  it("유효한 너비를 측정할 수 없으면 기본 너비를 사용한다", () => {
    expect(getResizeStartWidth(undefined, null, null, 150)).toBe(150);
    expect(getResizeStartWidth(undefined, col("auto", NaN), header(0), 150)).toBe(150);
  });
});

describe("리사이즈 이벤트 연결", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { saved: undefined, declared: "220px", measured: 220, expected: 220 },
    { saved: undefined, declared: "150px", measured: 288, expected: 150 },
    { saved: 0, declared: "220px", measured: 288, expected: 220 },
    { saved: undefined, declared: "50%", measured: 230, expected: 230 },
  ])("col과 헤더를 시작값 계산에 연결해 클릭 시 $expected px를 저장한다", ({ saved, declared, measured, expected }) => {
    const listeners = new Map<string, EventListener>();
    vi.stubGlobal("document", {
      addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
    });
    vi.stubGlobal("CSS", { escape: (key: string) => key });

    const column = col(declared, measured);
    const table = {
      querySelector: vi.fn(() => column),
      style: { width: "750px" },
      offsetWidth: 1440,
      parentElement: { clientWidth: 1440 },
    };
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: { closest: vi.fn(() => header(measured)) },
      clientX: 100,
    };
    const onColumnWidthsChange = vi.fn();
    const { handleMouseDown } = useColumnResize({
      columns: [{ key: "name" }],
      data: [],
      getCellContent: () => null,
      defaultWidth: 150,
      tableRef: { current: table as unknown as HTMLTableElement },
      controlledWidths: saved === undefined ? {} : { name: saved },
      onColumnWidthsChange,
    });

    handleMouseDown("name", event as unknown as ReactMouseEvent);
    expect(table.querySelector).toHaveBeenCalledWith('colgroup col[data-col-key="name"]');
    expect(listeners.has("mouseup")).toBe(true);
    listeners.get("mouseup")?.(new Event("mouseup"));
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ name: expected });
    expect(event.currentTarget.closest).toHaveBeenCalledWith("th");
    expect(listeners.size).toBe(0);
  });
});
