import type { ColumnSort, SortDirection } from "@/components/table/types";

export type SortCycle = "tri" | "toggle";

export function nextSort(
  current: ColumnSort | null,
  key: string,
  cycle: SortCycle = "tri",
): ColumnSort | null {
  if (current?.key !== key || current.direction === null) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") return { key, direction: "desc" };
  return cycle === "toggle" ? { key, direction: "asc" } : null;
}

export function sortDirectionFor(sort: ColumnSort | null, key: string): SortDirection {
  return sort?.key === key ? sort.direction : null;
}

export function ariaSort(direction: SortDirection): "ascending" | "descending" | "none" {
  return direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";
}
