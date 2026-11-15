import { describe, expect, it } from "vitest";
import { validateDecimalDraft } from "./decimal-validation";

const defaults = { decimalPlaces: 2, allowNegative: false };
describe("소수 입력 검증", () => {
  it("잘못된 문자, 선행 0, 초과 자릿수를 거부한다", () => {
    for (const value of ["abc", "00", "1.234", "-1"])
      expect(validateDecimalDraft(value, defaults)).toBe("reject");
    expect(validateDecimalDraft("1.", defaults)).toBe("draft");
    expect(validateDecimalDraft("", defaults)).toBe("empty");
    expect(validateDecimalDraft("1.", { ...defaults, decimalPlaces: 0 })).toBe(
      "reject",
    );
  });
  it("범위 내로 완성 가능한 접두사만 임시로 허용한다", () => {
    const options = { ...defaults, min: 50, max: 55 };
    expect(validateDecimalDraft("5", options)).toBe("draft");
    expect(validateDecimalDraft("6", options)).toBe("reject");
    expect(validateDecimalDraft("50", options)).toBe("value");
    expect(validateDecimalDraft("0.", { ...defaults, min: 0.5 })).toBe("draft");
    expect(
      validateDecimalDraft("-0.", {
        ...defaults,
        allowNegative: true,
        max: -0.5,
      }),
    ).toBe("draft");
    expect(
      validateDecimalDraft("-0.5", {
        ...defaults,
        allowNegative: true,
        min: -0.45,
      }),
    ).toBe("reject");
  });
  it("소수 경계를 이진 반올림 오차 없이 비교한다", () => {
    expect(validateDecimalDraft("0.29", { ...defaults, min: 0, max: 1 })).toBe(
      "value",
    );
    expect(
      validateDecimalDraft("1.001", {
        ...defaults,
        decimalPlaces: 3,
        max: 99.999,
      }),
    ).toBe("value");
    expect(
      validateDecimalDraft("100.000", {
        ...defaults,
        decimalPlaces: 3,
        max: 99.999,
      }),
    ).toBe("reject");
    expect(validateDecimalDraft("0.5", { ...defaults, max: 0.45 })).toBe(
      "reject",
    );
  });
});
