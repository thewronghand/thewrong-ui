import { describe, expect, it } from "vitest";
import { normalizeCode, pasteCode } from "./code-utils";

describe("분할 코드 입력", () => {
  it("숫자만 슬롯 수까지 남긴다", () => {
    expect(normalizeCode("1a2b3c456789", 6)).toBe("123456");
    expect(normalizeCode("", 4)).toBe("");
  });
  it("선택 구간을 숫자만으로 대체하고 길이를 제한한다", () => {
    expect(pasteCode("1234", "a56-78", 1, 3, 6)).toBe("156784");
    expect(pasteCode("", "12-34-567", 0, 0, 6)).toBe("123456");
  });
});
