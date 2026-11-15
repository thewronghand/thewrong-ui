import { describe, expect, it } from "vitest";
import { stepperReducer } from "./use-stepper";

const start = { currentStep: 0, direction: 1 as const };
describe("단계 상태 전이", () => {
  it("경계에서 유지하고 다음·이전 방향을 기록한다", () => {
    expect(stepperReducer(start, { type: "previous", stepCount: 3 })).toBe(
      start,
    );
    const next = stepperReducer(start, { type: "next", stepCount: 3 });
    expect(next).toEqual({ currentStep: 1, direction: 1 });
    expect(stepperReducer(next, { type: "previous", stepCount: 3 })).toEqual({
      currentStep: 0,
      direction: -1,
    });
    expect(
      stepperReducer(
        { currentStep: 2, direction: 1 },
        { type: "next", stepCount: 3 },
      ).currentStep,
    ).toBe(2);
  });
  it("비선형 이동을 제한하고 허용 시 범위를 보정한다", () => {
    expect(
      stepperReducer(start, {
        type: "move",
        target: 2,
        stepCount: 3,
        allowNonLinear: false,
      }),
    ).toBe(start);
    expect(
      stepperReducer(start, {
        type: "move",
        target: 9,
        stepCount: 3,
        allowNonLinear: true,
      }),
    ).toEqual({ currentStep: 2, direction: 1 });
  });
  it("단계 수 감소와 초기화에서 범위와 방향을 보정한다", () => {
    expect(
      stepperReducer(
        { currentStep: 3, direction: 1 },
        { type: "clamp", stepCount: 2 },
      ),
    ).toEqual({ currentStep: 1, direction: -1 });
    expect(
      stepperReducer(
        { currentStep: 2, direction: 1 },
        { type: "reset", target: 0, stepCount: 3 },
      ),
    ).toEqual({ currentStep: 0, direction: -1 });
  });
});
