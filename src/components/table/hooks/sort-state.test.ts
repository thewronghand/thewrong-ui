import { describe, expect, it } from "vitest";
import { ariaSort, nextSort, sortDirectionFor } from "./sort-state";

describe("테이블 정렬 순환", () => {
  it("기본 세 단계 순환과 다른 컬럼 선택", () => {
    const asc = nextSort(null, "name");
    const desc = nextSort(asc, "name");
    expect(asc).toEqual({ key: "name", direction: "asc" });
    expect(desc).toEqual({ key: "name", direction: "desc" });
    expect(nextSort(desc, "name")).toBeNull();
    expect(nextSort(desc, "rate")).toEqual({ key: "rate", direction: "asc" });
  });
  it("toggle은 내림차순 다음에 오름차순으로 돌아간다", () => {
    const asc = nextSort(null, "rate", "toggle");
    const desc = nextSort(asc, "rate", "toggle");
    expect(nextSort(desc, "rate", "toggle")).toEqual(asc);
  });
  it("선택된 열만 정렬 방향을 표시한다", () => {
    const sort = { key: "name", direction: "asc" } as const;
    expect(ariaSort(sortDirectionFor(sort, "name"))).toBe("ascending");
    expect(ariaSort(sortDirectionFor(sort, "rate"))).toBe("none");
    expect(ariaSort("desc")).toBe("descending");
  });
});
