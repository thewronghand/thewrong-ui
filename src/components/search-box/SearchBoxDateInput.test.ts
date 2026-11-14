import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchBoxDateRange } from "./SearchBoxDateRange";
import { SearchBoxDateSingle } from "./SearchBoxDateSingle";
import { SearchBoxFloatingInput } from "./SearchBoxFloatingInput";

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
  });
});
