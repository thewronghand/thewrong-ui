import { X } from "lucide-react";

import { Tooltip } from "@/components/tooltip";

interface ChipData {
  key: string;
  label: string;
  valueLabel: string;
}

interface Props {
  chips: ChipData[];
  onRemove: (key: string) => void;
}

/** 적용된 select 필드를 칩으로 표시. 칩 클릭 시 해당 필터 제거. hover 시 전체 텍스트 툴팁. */
export function SearchBoxChips({ chips, onRemove }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Tooltip
          key={chip.key}
          content={`${chip.label} | ${chip.valueLabel}`}
          position="top"
        >
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            // 길어지면 max-w로 자르고 valueLabel에서 truncate. multi-select가 많이 선택될 때
            // 한 칩이 너비 독점하지 않게. 전체 텍스트는 Tooltip으로 hover 시 노출.
            className="inline-flex max-w-65 items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
            aria-label={`${chip.label} 필터 제거`}
          >
            <span className="shrink-0 text-text-tertiary">{chip.label}</span>
            <span className="text-primary-300 dark:text-primary-700">|</span>
            <span className="truncate font-medium">{chip.valueLabel}</span>
            <X className="h-3 w-3 shrink-0" />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
