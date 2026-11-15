import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useContext: () => null,
  useRef: (value: unknown) => ({ current: value }),
  useCallback: (callback: unknown) => callback,
}));

import { RadioItem } from "./Radio";

class RadioInput {
  type = "radio";
  name = "choice";
  form = null;
  disabled = false;
  fieldsetDisabled = false;
  ownerDocument = { getElementsByName: () => [] as RadioInput[] };
  focus = vi.fn();
  click = vi.fn();
  matches(selector: string) { return selector === ":disabled" && (this.disabled || this.fieldsetDisabled); }
}

type RadioTree = ReactElement<{ children: [ReactElement<{ onKeyDown: (event: unknown) => void }>, unknown] }>;

afterEach(() => vi.unstubAllGlobals());

describe("Radio 방향키", () => {
  it("fieldset으로 비활성화된 항목을 건너뛰고 다음 활성 항목을 선택한다", () => {
    vi.stubGlobal("HTMLInputElement", RadioInput);
    const first = new RadioInput();
    const disabled = new RadioInput();
    const next = new RadioInput();
    disabled.fieldsetDisabled = true;
    first.ownerDocument.getElementsByName = () => [first, disabled, next];
    const render = RadioItem as unknown as { render: (props: { name: string; children: string }, ref: null) => RadioTree };
    const tree = render.render({ name: "choice", children: "첫째" }, null);
    const preventDefault = vi.fn();
    tree.props.children[0].props.onKeyDown({ key: "ArrowRight", currentTarget: first, preventDefault, defaultPrevented: false });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(disabled.focus).not.toHaveBeenCalled();
    expect(next.focus).toHaveBeenCalledOnce();
    expect(next.click).toHaveBeenCalledOnce();
  });
});
