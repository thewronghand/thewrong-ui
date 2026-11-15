import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";
import { TableCheckbox } from "@/components/table-checkbox";
import { Radio } from "@/components/radio";
import { Switch } from "@/components/switch";
import { SegmentedControl } from "@/components/segmented-control";

describe("폼 컨트롤 입력과 fieldset 비활성 상태", () => {
  it("체크박스와 라디오는 실제 입력을 시각 영역 위에 두고 라벨에는 phrasing 요소를 쓴다", () => {
    for (const element of [
      createElement(Checkbox.Line, { label: "동의" }),
      createElement(TableCheckbox, { checked: false, ariaLabel: "전체" }),
      createElement(Radio.Item, { name: "test", children: "선택" }),
    ]) {
      const html = renderToStaticMarkup(element);
      const input = html.match(/<input\b[^>]*>/)?.[0] ?? "";
      expect(input).toContain("absolute inset-0 z-10");
      expect(input).toContain("opacity-0");
      expect(input).not.toContain("sr-only");
      expect(html).not.toContain("<div");
    }
  });

  it("상위 fieldset의 실제 disabled 상태를 커서와 hover에 반영한다", () => {
    const radio = renderToStaticMarkup(createElement(Radio.Item, { name: "r", children: "라디오" }));
    const checkbox = renderToStaticMarkup(createElement(Checkbox.Line, { label: "동의" }));
    const table = renderToStaticMarkup(createElement(TableCheckbox, { checked: false }));
    const toggle = renderToStaticMarkup(createElement(Switch, { label: "전환" }));
    const segments = renderToStaticMarkup(createElement(SegmentedControl, {
      value: "a", onChange: () => {}, options: [{ value: "a", label: "첫째" }],
    }));
    for (const html of [radio, checkbox, table, toggle, segments]) {
      expect(html).toContain("has-[:disabled]:cursor-not-allowed");
    }
    expect(radio).toContain("peer-enabled:peer-hover:bg-bg-subtle");
    expect(checkbox).toContain("peer-disabled:border-dashed");
    expect(toggle).toContain("peer-disabled:peer-checked:bg-bg-disabled");
    expect(segments).toContain("peer-disabled:hover:text-fg-default");
  });
});
