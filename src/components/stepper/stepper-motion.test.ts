import { describe, expect, it } from "vitest";
import { resolveStepperMotion } from "./Stepper";

describe("단계 콘텐츠 전환", () => {
  it("뒤로 이동하면 슬라이드 진입과 퇴장 방향을 반대로 한다", () => {
    const forward = {
      direction: 1 as const,
      transition: "slide" as const,
      slideDirection: "left" as const,
      reducedMotion: false,
    };
    const backward = { ...forward, direction: -1 as const };
    expect(resolveStepperMotion("enter", forward).x).toBe(20);
    expect(resolveStepperMotion("exit", forward).x).toBe(-20);
    expect(resolveStepperMotion("enter", backward).x).toBe(-20);
    expect(resolveStepperMotion("exit", backward).x).toBe(20);
  });
  it("동작 줄이기를 요청하면 이동과 크기 전환을 제거한다", () => {
    expect(
      resolveStepperMotion("exit", {
        direction: -1,
        transition: "slide",
        slideDirection: "up",
        reducedMotion: true,
      }),
    ).toEqual({ opacity: 1, x: 0, y: 0, scale: 1 });
  });
});
