import { describe, expect, it } from "vitest";
import { inputFormats } from "./format";
import { applyInputFormat, getFormattedCursorPosition } from "./use-input-format";

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

describe("포맷 입력의 커서 위치", () => {
  it("쉼표 삽입과 삭제 뒤에도 커서 앞의 숫자 개수를 유지한다", () => {
    expect(getFormattedCursorPosition("12300", "12,300", 3)).toBe(4);
    expect(getFormattedCursorPosition("1,2345", "12,345", 3)).toBe(2);
  });
  it("끝에 입력하면 포맷이 바뀌어도 끝에 남는다", () => {
    expect(getFormattedCursorPosition("1,0002", "10,002", 6)).toBe(6);
    expect(getFormattedCursorPosition("9999", "9,999", 4)).toBe(5);
    expect(getFormattedCursorPosition("000123", "123", 6)).toBe(3);
  });
  it("쉼표 바로 뒤에서 지우면 다시 삽입된 쉼표 앞에 남는다", () => {
    expect(getFormattedCursorPosition("1000", "1,000", 1)).toBe(1);
  });
  it("전체 선택 후 입력하면 새 값의 끝에 남는다", () => {
    expect(getFormattedCursorPosition("2", "2", 1)).toBe(1);
  });
  it("커서 앞에 쉼표가 삽입되면 숫자 개수를 보존한다", () => {
    expect(getFormattedCursorPosition("1234", "1,234", 2)).toBe(3);
    expect(getFormattedCursorPosition("1234", "1,234", 3)).toBe(4);
  });
  it("숫자가 없는 사용자 정의 포맷은 가능한 한 기존 위치를 유지한다", () => {
    expect(getFormattedCursorPosition("abcd", "ABC", 2)).toBe(2);
  });
  it("숫자 앞 문자가 바뀌어도 길이가 같으면 커서를 유지한다", () => {
    expect(getFormattedCursorPosition("a123", "A123", 1)).toBe(1);
    expect(getFormattedCursorPosition("-123", "+123", 1)).toBe(1);
    expect(getFormattedCursorPosition(".a12", ".A12", 2)).toBe(2);
    expect(getFormattedCursorPosition("a123", "123", 1)).toBe(0);
  });
});
