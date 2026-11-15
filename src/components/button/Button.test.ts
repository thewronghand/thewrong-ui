import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/badge/Badge";
import { cn } from "@/lib/utils";

import { Button } from "./Button";
import { getButtonSizeClasses } from "./utils";

const overrides =
  "h-10 px-4 gap-2 bg-red-500 border-border-faint! dark:bg-white/10";

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
      "border-border-faint!",
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
        "border-border-faint!",
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

describe("Button link 모양", () => {
  it.each(["primary", "secondary", "tertiary", "danger"] as const)("%s 링크의 포커스 링은 배경과 대비되는 색을 쓴다", (variant) => {
    const classes = classesFromMarkup(renderToStaticMarkup(createElement(Button, {
      appearance: "link", variant,
    }, "안내")));
    expect(classes).toContain("focus-visible:ring-primary-fg");
    expect(classes).toContain("focus-visible:ring-button");
  });

  it("링크 모양은 바깥쪽 포커스 링을 쓰고 비활성 anchor에 불투명도를 더하지 않는다", () => {
    const anchor = classesFromMarkup(renderToStaticMarkup(createElement(Button, {
      as: "a", href: "/", appearance: "link", disabled: true,
    }, "안내")));
    expect(anchor).toEqual(expect.arrayContaining([
      "box-decoration-clone", "focus-visible:ring-offset-2", "focus-visible:ring-offset-transparent",
    ]));
    expect(anchor).not.toContain("focus-visible:ring-inset");
    expect(anchor).not.toContain("opacity-button-disabled");
    const filled = classesFromMarkup(renderToStaticMarkup(createElement(Button, { as: "a", href: "/", disabled: true })));
    expect(filled).toContain("opacity-button-disabled");
    expect(filled).toContain("focus-visible:ring-inset");
  });

  it("크기와 block 대신 부모 글꼴과 문장 안 배치를 사용하고 비활성화한다", () => {
    const markup = renderToStaticMarkup(createElement(Button, {
      appearance: "link", variant: "danger", size: "large", display: "block", disabled: true,
    }, "삭제"));
    const classes = classesFromMarkup(markup);
    expect(markup).toContain("disabled");
    expect(classes).toEqual(expect.arrayContaining([
      "inline", "text-[length:inherit]", "leading-[inherit]", "font-[inherit]", "no-underline",
      "text-error-fg", "hover:decoration-2", "active:decoration-[3px]",
    ]));
    expect(classes).not.toContain("w-full");
    expect(classes).not.toContain("font-control-action");
    expect(classes).not.toContain("h-control-large");
    expect(classes).not.toContain("hover:text-error-hover");
  });

  it("호출부 글자 크기·줄높이·굵기가 상속 유틸을 대체한다", () => {
    const inherited = "text-[length:inherit] leading-[inherit] font-[inherit]";
    const override = "text-lg leading-tight font-bold";
    expect(cn(inherited, override).split(" ")).toEqual(override.split(" "));
    const markup = renderToStaticMarkup(createElement(Button, {
      appearance: "link", className: override,
    }, "안내"));
    const classes = classesFromMarkup(markup);
    expect(classes).toEqual(expect.arrayContaining(override.split(" ")));
    for (const name of inherited.split(" ")) expect(classes).not.toContain(name);
    expect(classes).not.toContain("[font-size:inherit]");
    expect(classes).not.toContain("[line-height:inherit]");
    expect(classes).not.toContain("[font-weight:inherit]");
  });

  it.each(["primary", "secondary", "tertiary", "danger"] as const)("%s 비활성 버튼과 링크는 밑줄을 제거한다", (variant) => {
    for (const props of [{}, { as: "a" as const, href: "/" }]) {
      const active = classesFromMarkup(renderToStaticMarkup(createElement(Button, {
        ...props, appearance: "link", variant,
      }, "안내")));
      const disabled = classesFromMarkup(renderToStaticMarkup(createElement(Button, {
        ...props, appearance: "link", variant, disabled: true,
      }, "안내")));
      expect(active).toContain("underline");
      expect(active).not.toContain("no-underline");
      expect(disabled).toContain("no-underline");
      expect(disabled).not.toContain("underline");
      expect(disabled).toContain("disabled:text-fg-disabled");
      expect(disabled).toContain("aria-disabled:text-fg-disabled");
    }
  });

  it("primary와 danger의 대화형 상태에 배경 전용 색을 글자색으로 쓰지 않는다", () => {
    for (const variant of ["primary", "danger"] as const) {
      const markup = renderToStaticMarkup(createElement(Button, { appearance: "link", variant }, "안내"));
      const classes = classesFromMarkup(markup);
      expect(classes).not.toContain(`hover:text-${variant === "danger" ? "error" : variant}-hover`);
      expect(classes).not.toContain(`active:text-${variant === "danger" ? "error" : variant}-active`);
    }
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
