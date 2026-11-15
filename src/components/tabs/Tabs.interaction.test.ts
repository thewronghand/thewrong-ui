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

  it("선택을 거부하는 controlled 탭의 클릭은 한 번만 알린다", () => {
    const onValueChange = vi.fn();
    const root = Tabs({
      value: "first", onValueChange, "aria-label": "메뉴",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
      ],
    }) as Root;
    const tabs = root.props.children[0].props.children;
    tabs[1]!.props.onFocus();
    tabs[1]!.props.onClick();
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("second");
  });

  it("프로그램 포커스는 선택을 알리지 않는다", () => {
    const onValueChange = vi.fn();
    const root = Tabs({
      value: "first", onValueChange, "aria-label": "메뉴",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
      ],
    }) as Root;
    root.props.children[0].props.children[1]!.props.onFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("선택을 거부해도 자동 모드 키보드 이동마다 한 번 알린다", () => {
    const onValueChange = vi.fn();
    const root = Tabs({
      value: "first", onValueChange, "aria-label": "메뉴",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
        { value: "third", label: "셋째", content: "셋째 내용" },
      ],
    }) as Root;
    const tabs = root.props.children[0].props.children;
    for (const tab of tabs) tab.props.ref({ focus: tab.props.onFocus });
    const preventDefault = vi.fn();
    tabs[0]!.props.onKeyDown({ key: "ArrowRight", preventDefault });
    tabs[1]!.props.onKeyDown({ key: "ArrowRight", preventDefault });
    tabs[2]!.props.onKeyDown({ key: "ArrowLeft", preventDefault });
    tabs[1]!.props.onKeyDown({ key: "End", preventDefault });
    expect(onValueChange.mock.calls).toEqual([["second"], ["third"], ["second"], ["third"]]);
    expect(preventDefault).toHaveBeenCalledTimes(4);
  });

  it("자동 모드 Home 이동도 선택을 한 번 알린다", () => {
    const onValueChange = vi.fn();
    const root = Tabs({
      value: "second", onValueChange, "aria-label": "메뉴",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
      ],
    }) as Root;
    const tabs = root.props.children[0].props.children;
    for (const tab of tabs) tab.props.ref({ focus: tab.props.onFocus });
    tabs[1]!.props.onKeyDown({ key: "Home", preventDefault: vi.fn() });
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("first");
  });
});
