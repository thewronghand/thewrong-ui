import { describe, expect, it } from "vitest";
import { createAwaitableOverlayController } from "./awaitableOverlayController";

describe("오버레이 응답 계약", () => {
  it("확인 값과 취소를 resolve하고 중복 완료는 무시한다", async () => {
    const controller = createAwaitableOverlayController<number>();
    const confirmed = controller.open();
    expect(controller.settle({ type: "confirm", value: 42 })).toBe(true);
    await expect(confirmed).resolves.toEqual({ type: "confirm", value: 42 });
    expect(controller.settle({ type: "cancel" })).toBe(false);
    const cancelled = controller.open();
    controller.settle({ type: "cancel" });
    await expect(cancelled).resolves.toEqual({ type: "cancel" });
  });
  it("다시 열면 이전 요청을 취소하고 새 요청을 유지한다", async () => {
    const controller = createAwaitableOverlayController<string>();
    const first = controller.open();
    const second = controller.open();
    await expect(first).resolves.toEqual({ type: "cancel" });
    controller.settle({ type: "confirm", value: "ok" });
    await expect(second).resolves.toEqual({ type: "confirm", value: "ok" });
  });
});
