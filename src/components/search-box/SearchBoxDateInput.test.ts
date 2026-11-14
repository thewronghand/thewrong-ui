import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchBoxDateRange } from "./SearchBoxDateRange";
import { SearchBoxDateSingle } from "./SearchBoxDateSingle";
import { SearchBoxFloatingInput } from "./SearchBoxFloatingInput";
import { SearchBoxFloatingSelect } from "./SearchBoxFloatingSelect";
import { SearchBoxMonth } from "./SearchBoxMonth";
import { SearchBoxMultiSelect } from "./SearchBoxMultiSelect";

const onChange = () => {};

function heightClasses(classes: string): string[] {
  return classes.split(" ").filter((className) => className.startsWith("h-"));
}

describe("SearchBox 날짜 입력 높이", () => {
  it.each(["mini", "small"] as const)("%s에서 같은 크기 텍스트 필드와 높이가 같다", (size) => {
    const floatingMarkup = renderToStaticMarkup(
      createElement(SearchBoxFloatingInput, { label: "검색어", value: "", onChange, size }),
    );
    const floatingClass = floatingMarkup.match(/^<div class="([^"]+)"/)?.[1];
    expect(floatingClass).toBeDefined();
    const expectedHeight = heightClasses(floatingClass!);
    expect(expectedHeight).toEqual([size === "mini" ? "h-8" : "h-10"]);

    const rangeMarkup = renderToStaticMarkup(
      createElement(SearchBoxDateRange, { value: "", onChange, size }),
    );
    const singleMarkup = renderToStaticMarkup(
      createElement(SearchBoxDateSingle, { value: "", onChange, size }),
    );
    const dateInputClasses = (markup: string) =>
      [...markup.matchAll(/<div class="([^"]+)"[^>]*><input type="date"/g)].map(
        (match) => heightClasses(match[1]),
      );

    expect(dateInputClasses(rangeMarkup)).toEqual([expectedHeight, expectedHeight]);
    expect(dateInputClasses(singleMarkup)).toEqual([expectedHeight]);

    const selectMarkup = renderToStaticMarkup(
      createElement(SearchBoxFloatingSelect, { label: "상태", options: [], value: "", onChange, size }),
    );
    const multiMarkup = renderToStaticMarkup(
      createElement(SearchBoxMultiSelect, { label: "분류", options: [], value: "", onChange, size }),
    );
    const monthMarkup = renderToStaticMarkup(
      createElement(SearchBoxMonth, { value: "", onChange, size }),
    );
    for (const markup of [selectMarkup, multiMarkup, monthMarkup]) {
      const className = markup.match(/<button\b[^>]*class="([^"]+)"/)?.[1];
      expect(className).toBeDefined();
      expect(heightClasses(className!)).toEqual(expectedHeight);
    }

    const rangeWithPresets = renderToStaticMarkup(
      createElement(SearchBoxDateRange, {
        value: "2026-01-01~2026-01-02",
        onChange,
        size,
        presets: [
          { label: "선택됨", range: () => ({ from: "2026-01-01", to: "2026-01-02" }) },
          { label: "선택안됨", range: () => ({ from: "2026-02-01", to: "2026-02-02" }) },
        ],
      }),
    );
    const singleWithPresets = renderToStaticMarkup(
      createElement(SearchBoxDateSingle, {
        value: "2026-01-01",
        onChange,
        size,
        presets: [
          { label: "선택됨", date: () => "2026-01-01" },
          { label: "선택안됨", date: () => "2026-02-01" },
        ],
      }),
    );
    for (const markup of [rangeWithPresets, singleWithPresets]) {
      const presetClasses = [...markup.matchAll(/<button\b[^>]*class="([^"]+)"[^>]*>(선택됨|선택안됨)<\/button>/g)];
      expect(presetClasses).toHaveLength(2);
      for (const match of presetClasses) expect(heightClasses(match[1])).toEqual(expectedHeight);
    }
  });
});
