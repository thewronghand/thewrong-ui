import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field, FieldMessage } from "@/components/field";
import { Progress } from "@/components/progress";
import { Radio } from "@/components/radio";
import { SegmentedControl } from "@/components/segmented-control";
import { Skeleton } from "@/components/skeleton";
import { TypewriterText } from "@/components/typewriter-text";
import { TypingDots } from "@/components/typing-dots";

describe("이관한 컴포넌트의 정적 마크업", () => {
  it("라디오는 네이티브 상태와 선택 표시 요소를 제공한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Radio.Item, {
        name: "choice",
        disabled: true,
        children: "선택",
      }),
    );
    expect(markup).toContain('type="radio"');
    expect(markup).toContain('name="choice"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("data-radio-indicator");
    expect(markup).toContain("data-radio-dot");
  });
  it("세그먼트는 라디오 그룹과 선택·비활성 상태를 제공한다", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl, {
        "aria-label": "기간",
        value: "a",
        onChange: () => {},
        options: [
          { value: "a", label: "첫째" },
          { value: "b", label: "둘째", disabled: true },
        ],
      }),
    );
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="기간"');
    expect(markup).toContain("checked");
    expect(markup).toContain("disabled");
    expect(markup).toContain("data-segmented-control-indicator");
  });
  it("진행률 범위를 0~100으로 제한하고 크기와 클래스 덮어쓰기를 적용한다", () => {
    const high = renderToStaticMarkup(
      createElement(Progress, {
        value: 120,
        size: "small",
        className: "h-4",
        "aria-label": "완료",
      }),
    );
    const low = renderToStaticMarkup(createElement(Progress, { value: -10 }));
    expect(high).toContain('aria-valuenow="100"');
    expect(high).toContain("width:100%");
    expect(high).toContain("h-4");
    expect(high).not.toContain("h-1.5");
    expect(low).toContain('aria-valuenow="0"');
    const onePercent = renderToStaticMarkup(
      createElement(Progress, { value: 1, size: "small" }),
    );
    expect(onePercent).toContain('aria-valuemin="0"');
    expect(onePercent).toContain('aria-valuemax="100"');
    expect(onePercent).toContain("width:1%");
    expect(onePercent).toContain("h-1.5");
  });
  it("스켈레톤은 보조기기에서 숨고 크기·반경을 덮어쓸 수 있다", () => {
    const markup = renderToStaticMarkup(
      createElement(Skeleton, { className: "h-4 w-20 rounded-full" }),
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("bg-bg-muted");
    expect(markup).toContain("rounded-full");
    expect(markup).not.toContain("rounded-control-small");
    expect(markup).toContain("animate-pulse");
    expect(markup).toContain("motion-reduce:animate-none");
    const attributes = { role: "presentation", "data-testid": "placeholder" };
    const withAttributes = renderToStaticMarkup(
      createElement(Skeleton, attributes),
    );
    expect(withAttributes).toContain('role="presentation"');
    expect(withAttributes).toContain('data-testid="placeholder"');
    expect(withAttributes).toContain('aria-hidden="true"');
  });
  it("필수 라벨과 선택적 메시지의 마크업을 유지한다", () => {
    const markup = renderToStaticMarkup(
      createElement(Field, {
        label: "이름",
        htmlFor: "name",
        required: true,
        optional: true,
        children: createElement("input", { id: "name", required: true }),
      }),
    );
    expect(markup).toContain('for="name"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("(선택)");
    expect(
      renderToStaticMarkup(
        createElement(FieldMessage, {
          className: "text-fg-danger",
          children: "확인",
        }),
      ),
    ).toContain("text-fg-danger");
    expect(renderToStaticMarkup(createElement(FieldMessage, null))).toBe("");
  });
  it("입력 중 표시는 설명 하나와 장식용 점 세 개를 제공한다", () => {
    const markup = renderToStaticMarkup(
      createElement(TypingDots, { label: "입력 중" }),
    );
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="입력 중"');
    expect(markup.match(/aria-hidden="true"/g)).toHaveLength(3);
    expect(markup).toContain("bg-current");
  });
  it("즉시 표시 모드는 보조기기와 화면에 전체 문자열을 제공한다", () => {
    const markup = renderToStaticMarkup(
      createElement(TypewriterText, { text: "안녕하세요", animate: false }),
    );
    expect(markup).toContain('aria-label="안녕하세요"');
    expect(markup).toContain('aria-hidden="true">안녕하세요');
  });
});
