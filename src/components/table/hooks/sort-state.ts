import type { ColumnSort, SortDirection, TableColumn } from "@/components/table/types";

export type SortCycle = "tri" | "toggle";

export function columnSortValue<T>(row: T, key: string, columns: TableColumn<T>[]): unknown {
  const column = columns.find((item) => item.key === key);
  if (column?.sortValue) return column.sortValue(row);
  if (column?.accessor) {
    const value = column.accessor(row);
    if (typeof value === "string" || typeof value === "number") return value;
  }
  return (row as Record<string, unknown>)[key];
}

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

export function ariaSort(direction: SortDirection): "ascending" | "descending" | undefined {
  return direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;
}
