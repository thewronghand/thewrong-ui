import { describe, expect, it, vi } from "vitest";

import { useTableSort } from "./useTableSort";

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useCallback: (callback: unknown) => callback,
    useState: (initial: unknown) => [initial, vi.fn()],
  };
});

describe("서버 정렬 해제", () => {
  it("내림차순 다음에 서버 콜백으로 null을 전달한다", () => {
    const onSort = vi.fn();
    const { handleSort } = useTableSort({
      initialSort: { key: "name", direction: "desc" },
      serverSide: true,
      onSort,
    });
    handleSort("name");
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith(null);
  });

  it("클라이언트 정렬에서는 서버 콜백을 호출하지 않는다", () => {
    const onSort = vi.fn();
    const { handleSort } = useTableSort({
      initialSort: { key: "name", direction: "desc" },
      onSort,
    });
    handleSort("name");
    expect(onSort).not.toHaveBeenCalled();
  });
});
