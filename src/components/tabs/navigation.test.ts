import { describe, expect, it } from "vitest";
import { nextTabIndex } from "./navigation";

describe("탭 키보드 이동", () => {
  const disabled = [false, true, false, false];
  it("좌우 이동은 비활성 탭을 건너뛰고 양끝에서 순환한다", () => {
    expect(nextTabIndex(disabled, 0, "ArrowRight")).toBe(2);
    expect(nextTabIndex(disabled, 0, "ArrowLeft")).toBe(3);
    expect(nextTabIndex(disabled, 3, "ArrowRight")).toBe(0);
  });
  it("Home과 End는 처음과 마지막 활성 탭으로 이동한다", () => {
    expect(nextTabIndex([true, false, false, true], 2, "Home")).toBe(1);
    expect(nextTabIndex([true, false, false, true], 1, "End")).toBe(2);
  });
  it("이동할 탭이나 해당 키가 없으면 null이다", () => {
    expect(nextTabIndex([true, true], 0, "Home")).toBeNull();
    expect(nextTabIndex([], 0, "ArrowRight")).toBeNull();
    expect(nextTabIndex(disabled, 0, "ArrowDown")).toBeNull();
  });
});
