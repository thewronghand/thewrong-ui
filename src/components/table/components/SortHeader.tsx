import type { ReactNode } from "react";
import type { SortDirection } from "@/components/table/types";

interface SortHeaderProps {
  children: ReactNode;
  current: SortDirection;
  next: SortDirection;
  label?: string;
  onSort: () => void;
}

const directionText: Record<"asc" | "desc" | "none", string> = {
  asc: "오름차순",
  desc: "내림차순",
  none: "정렬 없음",
};

export function SortHeader({ children, current, next, label, onSort }: SortHeaderProps) {
  const status = `현재 ${directionText[current ?? "none"]}, 다음 ${directionText[next ?? "none"]}`;
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onSort();
      }}
      className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-control focus-visible:ring-focus-primary"
    >
      {children}
      {!label && <span className="sr-only">, {status}</span>}
    </button>
  );
}
