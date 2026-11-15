import type { ReactNode } from "react";
import type { SortDirection } from "@/components/table/types";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { useSortableHeaderKeyboardDrag } from "./SortableHeaderCell";

interface SortHeaderProps {
  children: ReactNode;
  current: SortDirection;
  label?: string;
  onSort: () => void;
}

export function SortHeader({ children, current, label, onSort }: SortHeaderProps) {
  const keyboardDrag = useSortableHeaderKeyboardDrag();
  const Icon =
    current === "asc" ? ArrowUp : current === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      ref={keyboardDrag?.setActivatorNodeRef}
      type="button"
      aria-label={label}
      aria-describedby={keyboardDrag?.descriptionId}
      aria-keyshortcuts={keyboardDrag ? "Shift+Space" : undefined}
      onKeyDown={keyboardDrag?.onKeyDown ?? ((event) => event.stopPropagation())}
      onClick={(event) => {
        event.stopPropagation();
        onSort();
      }}
      className="inline-flex items-center gap-1 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-control focus-visible:ring-focus-primary"
    >
      {children}
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
    </button>
  );
}
