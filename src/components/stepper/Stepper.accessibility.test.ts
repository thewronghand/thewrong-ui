import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Stepper } from "./Stepper";

const steps = [
  { id: "first", label: "정보", skipped: true },
  { id: "second", label: "확인", skipped: true },
  { id: "third", label: "완료" },
];

describe("Stepper 접근성", () => {
  it("목록 이름을 지정하고 건너뛴 항목의 보이는 라벨과 상태를 이름에 포함한다", () => {
    const html = renderToStaticMarkup(createElement(Stepper, {
      steps, currentStep: 1, "aria-label": "주문 진행",
      allowNonLinear: true, onStepChange: () => {},
    }));
    expect(html).toContain('aria-label="주문 진행"');
    expect(html).toContain('aria-label="1단계: 정보 (건너뜀)"');
    expect(html).toContain('data-status="skipped"');
    expect(html).toContain("border-dashed");
    expect(html).toContain(">건너뜀</span>");
    expect(html).toContain('aria-label="2단계: 확인"');
    expect(html).toContain('data-status="current"');
  });

  it("외부 제목과 기본 목록 이름을 지원하고 정적 목록도 상태를 읽을 수 있다", () => {
    const labelled = renderToStaticMarkup(createElement(Stepper, {
      steps, currentStep: 2, "aria-labelledby": "heading",
    }));
    expect(labelled).toContain('aria-labelledby="heading"');
    expect(labelled).not.toContain('aria-label="진행 단계"');
    expect(labelled.match(/>건너뜀<\/span>/g)).toHaveLength(2);
    const fallback = renderToStaticMarkup(createElement(Stepper, { steps, currentStep: 0 }));
    expect(fallback).toContain('aria-label="진행 단계"');
    expect(fallback).not.toContain('data-status="skipped"');
  });
});
