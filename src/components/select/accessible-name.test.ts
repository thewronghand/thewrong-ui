import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";
import { MultiSelect } from "./MultiSelect";

const options = [{ value: "a", label: "항목" }];

describe("Select 트리거 이름", () => {
  it("검색형 선택의 래퍼는 표현용이며 combobox는 입력 하나뿐이다", () => {
    const markup = renderToStaticMarkup(createElement(Select, {
      variant: "box", options, value: "", onChange: () => {}, searchable: true,
      "aria-label": "검색",
    }));
    expect(markup.match(/role="combobox"/g)).toHaveLength(1);
    expect(markup).toMatch(/role="presentation"[^>]*>[\s\S]*<input[^>]*role="combobox"/);
  });
  it("단일 선택의 버튼과 검색 입력에 aria-label을 전달한다", () => {
    for (const searchable of [false, true] as const) {
      const markup = renderToStaticMarkup(createElement(Select, {
        variant: "box", options, value: "", onChange: () => {}, searchable,
        label: "시각 라벨", labelOption: "sustain", "aria-label": "명시 이름",
      }));
      expect(markup).toMatch(/role="combobox"[^>]*aria-label="명시 이름"|aria-label="명시 이름"[^>]*role="combobox"/);
      expect(markup).toContain("시각 라벨");
    }
  });
  it("다중 선택 트리거에 aria-labelledby를 전달한다", () => {
    const markup = renderToStaticMarkup(createElement(MultiSelect, {
      variant: "box", options, value: [], onChange: () => {}, "aria-labelledby": "external-label",
    }));
    expect(markup).toMatch(/role="combobox"[^>]*aria-labelledby="external-label"|aria-labelledby="external-label"[^>]*role="combobox"/);
  });
});
