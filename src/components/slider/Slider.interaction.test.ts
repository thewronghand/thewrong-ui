import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Slider } from "./Slider";
import type { SliderProps } from "./types";

const mocks = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  setValue: vi.fn(),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
  useRef: () => ({ current: null }),
  useState: (initial: number) => [initial, mocks.setValue],
}));

type Input = ReactElement<{
  ref: (node: { form: EventTarget } | null) => void;
  onChange: (event: { currentTarget: { valueAsNumber: number } }) => void;
}>;
const render = (Slider as unknown as { render: (props: SliderProps, ref: null) => Input }).render;

describe("Slider 폼 초기화", () => {
  beforeEach(() => { mocks.effects.length = 0; mocks.setValue.mockReset(); });

  it("비제어 값 변경 후 폼 reset으로 초기 값을 복원하고 해제한다", () => {
    const form = new EventTarget();
    const input = render({ defaultValue: 20, min: 0, max: 100 }, null);
    input.props.ref({ form });
    const cleanup = mocks.effects[0]?.();
    input.props.onChange({ currentTarget: { valueAsNumber: 80 } });
    expect(mocks.setValue).toHaveBeenLastCalledWith(80);
    form.dispatchEvent(new Event("reset"));
    expect(mocks.setValue).toHaveBeenLastCalledWith(20);
    expect(mocks.setValue).toHaveBeenCalledTimes(2);
    if (typeof cleanup === "function") cleanup();
    form.dispatchEvent(new Event("reset"));
    expect(mocks.setValue).toHaveBeenCalledTimes(2);
  });

  it("제어 값은 reset으로 내부 값을 바꾸지 않는다", () => {
    const form = new EventTarget();
    const input = render({ value: 30, defaultValue: 20 }, null);
    input.props.ref({ form });
    mocks.effects[0]?.();
    form.dispatchEvent(new Event("reset"));
    expect(mocks.setValue).not.toHaveBeenCalled();
  });
});
