import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { Tabs } from "./Tabs";

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useId: () => "tabs",
  useRef: () => ({ current: [] }),
  useState: (initial: unknown) => [initial, vi.fn()],
}));

type Tab = ReactElement<{
  ref: (node: { focus: () => void }) => void;
  onFocus: () => void;
  onClick: () => void;
  onKeyDown: (event: { key: string; preventDefault: () => void }) => void;
}>;
type List = ReactElement<{ children: Tab[] }>;
type Root = ReactElement<{ children: [List, unknown] }>;

describe("Tabs 키보드 활성화", () => {
  it.each(["manual", "auto"] as const)("%s에서 화살표 이동과 선택을 구분한다", (activation) => {
    const onValueChange = vi.fn();
    const root = Tabs({
      activation, onValueChange, defaultValue: "first", "aria-label": "메뉴",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
      ],
    }) as Root;
    const tabs = root.props.children[0].props.children;
    for (const tab of tabs) tab.props.ref({ focus: tab.props.onFocus });
    const preventDefault = vi.fn();
    tabs[0]!.props.onKeyDown({ key: "ArrowRight", preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    if (activation === "manual") {
      expect(onValueChange).not.toHaveBeenCalled();
      tabs[1]!.props.onClick();
    }
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("second");
  });
});
