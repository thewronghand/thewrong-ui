import { describe, expect, it } from "vitest";
import {
  formatDigitStream,
  formatTime,
  isValidTimeDraft,
  normalizeTime,
  parseTime,
} from "./time-utils";

describe("시간 계산", () => {
  it("값을 읽고 한 자리 값을 두 자리로 정규화한다", () => {
    expect(parseTime("12:34:56")).toEqual({
      hour: "12",
      minute: "34",
      second: "56",
    });
    expect(parseTime("")).toEqual({ hour: "00", minute: "00", second: "00" });
    const time = normalizeTime(
      { hour: "9", minute: "5", second: "7" },
      "second",
    );
    expect(time && formatTime(time, "second")).toBe("09:05:07");
    expect(time && formatTime(time, "minute")).toBe("09:05");
  });
  it("시·분·초의 경계와 빈 입력을 검증한다", () => {
    expect(
      normalizeTime({ hour: "23", minute: "59", second: "59" }, "second"),
    ).not.toBeNull();
    expect(
      normalizeTime({ hour: "24", minute: "00", second: "00" }, "minute"),
    ).toBeNull();
    expect(
      normalizeTime({ hour: "12", minute: "60", second: "00" }, "minute"),
    ).toBeNull();
    expect(
      normalizeTime({ hour: "12", minute: "30", second: "60" }, "second"),
    ).toBeNull();
    expect(
      normalizeTime({ hour: "", minute: "30", second: "00" }, "minute"),
    ).toBeNull();
  });
  it("직접 입력 스트림과 부분 입력을 검증한다", () => {
    expect(formatDigitStream("0934", "minute")).toBe("09:34");
    expect(formatDigitStream("235959", "second")).toBe("23:59:59");
    expect(formatDigitStream("12345", "minute")).toBeNull();
    expect(formatDigitStream("12a", "minute")).toBeNull();
    for (const draft of ["", "2", "23:", "23:59", "23:59:5"])
      expect(isValidTimeDraft(draft, "second")).toBe(true);
    for (const draft of ["3", "24", "23:60", "12:3:00", "23:59:60", "12:34:00"])
      expect(isValidTimeDraft(draft, "minute")).toBe(false);
    expect(isValidTimeDraft("23:59:60", "second")).toBe(false);
  });
});
