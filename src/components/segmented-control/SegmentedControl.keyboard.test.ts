import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useId: () => "choice",
  useRef: (value: unknown) => ({ current: value }),
  useCallback: (callback: unknown) => callback,
  useLayoutEffect: () => {},
  useState: (value: unknown) => [value, () => {}],
}));

import { SegmentedControl } from "./SegmentedControl";

class RadioInput {
  type = "radio";
  name = "choice";
  form = null;
  disabled = false;
  fieldsetDisabled = false;
  ownerDocument = { getElementsByName: () => [] as RadioInput[] };
  focus = vi.fn();
  click = vi.fn();
  matches(selector: string) {
    return selector === ":disabled" && (this.disabled || this.fieldsetDisabled);
  }
}

type InputElement = ReactElement<{ onKeyDown: (event: unknown) => void }>;
type LabelElement = ReactElement<{ children: [InputElement, unknown] }>;
type GroupElement = ReactElement<{ children: [unknown, LabelElement[]] }>;

afterEach(() => vi.unstubAllGlobals());

describe("SegmentedControl 방향키", () => {
  it.each(["ArrowRight", "ArrowLeft"])(
    "%s에서 fieldset 비활성 항목을 건너뛴다",
    (key) => {
      vi.stubGlobal("HTMLInputElement", RadioInput);
      const first = new RadioInput();
      const disabled = new RadioInput();
      const next = new RadioInput();
      disabled.fieldsetDisabled = true;
      for (const element of [first, disabled, next]) {
        element.ownerDocument.getElementsByName = () => [first, disabled, next];
      }
      const tree = SegmentedControl({
        value: "a",
        onChange: () => {},
        options: [
          { value: "a", label: "첫째" },
          { value: "b", label: "둘째" },
          { value: "c", label: "셋째" },
        ],
      }) as GroupElement;
      const preventDefault = vi.fn();
      const current = key === "ArrowRight" ? first : next;
      const destination = key === "ArrowRight" ? next : first;
      tree.props.children[1][0].props.children[0].props.onKeyDown({
        key,
        currentTarget: current,
        preventDefault,
      });
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(disabled.focus).not.toHaveBeenCalled();
      expect(destination.focus).toHaveBeenCalledOnce();
      expect(destination.click).toHaveBeenCalledOnce();
    },
  );
});
