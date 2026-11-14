import { describe, expect, it } from "vitest";
import { inputFormats } from "./format";
import { applyInputFormat } from "./use-input-format";

describe("입력 포맷", () => {
  it("전화번호와 금액의 표시 및 원본 값을 계산한다", () => {
    expect(applyInputFormat("01012345678", inputFormats.phoneNumber)).toEqual({
      display: "010-1234-5678",
      raw: "01012345678",
    });
    expect(applyInputFormat("1a234567", inputFormats.price)).toEqual({
      display: "1,234,567",
      raw: "1234567",
    });
    expect(applyInputFormat("", inputFormats.price)).toEqual({
      display: "",
      raw: "",
    });
  });
  it("사업자등록번호를 자르고 원본 숫자로 되돌린다", () => {
    expect(
      applyInputFormat("12a345678901", inputFormats.businessNumber),
    ).toEqual({ display: "12-345-67890", raw: "1234567890" });
    expect(inputFormats.businessNumber.transform("123")).toBe("12-3");
  });
  it("입력 종류를 변환기에 전달하고 reset이 없으면 표시 값을 사용한다", () => {
    const format = {
      transform: (value: string | number, kind?: string) => `${kind}:${value}`,
    };
    expect(applyInputFormat("abc", format, "insertText")).toEqual({
      display: "insertText:abc",
      raw: "insertText:abc",
    });
  });
});
