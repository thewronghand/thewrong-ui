import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/badge/Badge";
import { cn } from "@/lib/utils";

import { Button } from "./Button";
import { getButtonSizeClasses } from "./utils";

const overrides =
  "h-10 px-4 gap-2 bg-red-500 border-border-tertiary! dark:bg-white/10";

function classesFromMarkup(markup: string): string[] {
  const match = markup.match(/class="([^"]+)"/);
  expect(match).not.toBeNull();
  return match![1].split(" ");
}

function expectButtonOverrides(classes: string[]) {
  expect(classes).toEqual(
    expect.arrayContaining([
      "h-10",
      "px-4",
      "gap-2",
      "bg-red-500",
      "border-border-tertiary!",
      "dark:bg-white/10",
      "border-button",
    ]),
  );
  expect(classes).not.toContain("h-control-small");
  expect(classes).not.toContain("px-control-pad-small");
  expect(classes).not.toContain("gap-button-small");
  expect(classes).not.toContain("bg-primary");
}

describe("Button className 덮어쓰기", () => {
  it("실제 small 사이즈 클래스와 호출부 클래스를 병합한다", () => {
    const classes = cn(getButtonSizeClasses("small"), overrides).split(" ");
    expect(classes).toEqual(
      expect.arrayContaining([
        "h-10",
        "px-4",
        "gap-2",
        "bg-red-500",
        "border-border-tertiary!",
        "dark:bg-white/10",
      ]),
    );
    expect(classes).not.toContain("h-control-small");
    expect(classes).not.toContain("px-control-pad-small");
    expect(classes).not.toContain("gap-button-small");
  });

  it("button에서 크기와 호출부 클래스를 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Button, { size: "small", className: overrides }, "검색"),
    );
    expectButtonOverrides(classesFromMarkup(markup));
  });

  it("loading anchor에서도 크기와 호출부 클래스를 병합한다", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Button,
        {
          as: "a",
          href: "/",
          loading: true,
          size: "small",
          className: overrides,
        },
        "검색",
      ),
    );
    const classes = classesFromMarkup(markup);
    expectButtonOverrides(classes);
    expect(classes).toContain("pointer-events-none");
    expect(classes).toContain("opacity-70");
    expect(classes).not.toContain("opacity-button-disabled");
    expect(markup).toContain('aria-disabled="true"');
  });

  it("loading button과 anchor는 같은 opacity를 사용한다", () => {
    const button = renderToStaticMarkup(createElement(Button, { loading: true }));
    const link = renderToStaticMarkup(createElement(Button, { as: "a", href: "/", loading: true }));
    expect(classesFromMarkup(button)).toContain("opacity-70");
    expect(classesFromMarkup(link)).toContain("opacity-70");
  });
});

describe("Badge className 덮어쓰기", () => {
  it.each([undefined, "div"] as const)("%s에서 크기를 병합한다", (as) => {
    const markup = renderToStaticMarkup(
      createElement(Badge, {
        as,
        className: "px-4 rounded-full",
        children: "상태",
      }),
    );
    const classes = classesFromMarkup(markup);
    expect(classes).toEqual(expect.arrayContaining(["px-4", "rounded-full"]));
    expect(classes).not.toContain("px-2.5");
    expect(classes).not.toContain("rounded-badge");
  });
});
