import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Checkbox } from "@/components/checkbox/Checkbox";
import { DateInput } from "@/components/date-input/DateInput";
import { Input } from "@/components/input/Input";
import { MultiSelect } from "@/components/select/MultiSelect";
import { Select } from "@/components/select/Select";
import { LoadingDots } from "@/components/select/loading-dots";
import { Switch } from "@/components/switch/Switch";
import { Textarea } from "@/components/textarea/Textarea";

function classesFor(markup: string, tag: string): string[] {
  const match = markup.match(new RegExp(`<${tag}\\b[^>]*class="([^"]+)"`));
  expect(match).not.toBeNull();
  return match![1].split(" ");
}

function expectTriggerOverrides(classes: string[]) {
  expect(classes).toEqual(expect.arrayContaining(["h-10", "gap-2", "bg-primary"]));
  expect(classes).not.toContain("h-control-small");
  expect(classes).not.toContain("gap-slot-small");
  expect(classes).not.toContain("bg-bg-surface");
}

describe("폼 필드 className 덮어쓰기", () => {
  const className = "h-10 gap-2 bg-primary";

  it("Input box의 크기와 색상을 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, { variant: "box", inputSize: "small", className }),
    );
    const wrapper = markup.match(/<div class="([^"]*h-10[^"]*)"/);
    expect(wrapper).not.toBeNull();
    expectTriggerOverrides(wrapper![1].split(" "));
  });

  it("Input line의 색상과 크기를 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, { variant: "line", className: "h-10 bg-primary" }),
    );
    const classes = classesFor(markup, "input");
    expect(classes).toEqual(expect.arrayContaining(["h-10", "bg-primary"]));
    expect(classes).not.toContain("bg-bg-surface");
  });

  it.each([false, true])("Select searchable=%s 트리거를 병합한다", (searchable) => {
    const props = {
      variant: "box" as const,
      selectSize: "small" as const,
      options: [],
      value: "",
      onChange: () => {},
      className,
    };
    const markup = renderToStaticMarkup(
      searchable
        ? createElement(Select, { ...props, searchable: true })
        : createElement(Select, props),
    );
    const match = markup.match(/class="([^"]*h-10[^"]*)"/);
    expect(match).not.toBeNull();
    expectTriggerOverrides(match![1].split(" "));
  });

  it("MultiSelect 트리거의 크기·간격·색상을 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(MultiSelect, {
        variant: "box",
        selectSize: "small",
        options: [],
        value: [],
        onChange: () => {},
        className,
      }),
    );
    expectTriggerOverrides(classesFor(markup, "button"));
  });

  it("Textarea의 본문과 컨테이너 클래스를 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Textarea, {
        className: "w-20 text-primary-fg",
        containerClassName: "w-24",
      }),
    );
    expect(classesFor(markup, "div")).toEqual(["w-24"]);
    const classes = classesFor(markup, "textarea");
    expect(classes).toEqual(expect.arrayContaining(["w-20", "text-primary-fg"]));
    expect(classes).not.toContain("w-full");
    expect(classes).not.toContain("text-fg-subtle");
  });

  it("DateInput의 높이·간격·색상·왼쪽 패딩을 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(DateInput, {
        value: "",
        onChange: () => {},
        size: "small",
        className: "h-10 gap-3 bg-bg-subtle pl-4",
      }),
    );
    const classes = classesFor(markup, "div");
    expect(classes).toEqual(expect.arrayContaining(["h-10", "gap-3", "bg-bg-subtle", "pl-4"]));
    expect(classes).not.toContain("h-control-medium");
    expect(classes).not.toContain("gap-1");
    expect(classes).not.toContain("bg-bg-surface");
    expect(classes).not.toContain("pl-control-pad-small");
  });

  it("Switch와 Checkbox의 호출부 클래스를 병합한다", () => {
    const switchMarkup = renderToStaticMarkup(createElement(Switch, { className: "gap-4" }));
    expect(classesFor(switchMarkup, "label")).toContain("gap-4");
    expect(classesFor(switchMarkup, "label")).not.toContain("gap-2");
    const checkboxMarkup = renderToStaticMarkup(
      createElement(Checkbox.Line, { className: "border-4 text-error peer-checked:bg-error" }),
    );
    const match = checkboxMarkup.match(/<span class="([^"]*border-4[^"]*)"/);
    expect(match).not.toBeNull();
    const classes = match![1].split(" ");
    expect(classes).toEqual(expect.arrayContaining(["border-4", "text-error", "peer-checked:bg-error"]));
    expect(classes).not.toContain("border-2");
    expect(classes).not.toContain("text-fg-inverse");
    expect(classes).not.toContain("peer-checked:bg-primary");
  });

  it("로딩 점의 호출부 간격을 병합한다", () => {
    const markup = renderToStaticMarkup(createElement(LoadingDots, { className: "gap-2" }));
    expect(classesFor(markup, "span")).toContain("gap-2");
    expect(classesFor(markup, "span")).not.toContain("gap-0.5");
  });
});
