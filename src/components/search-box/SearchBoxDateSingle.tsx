import { useContext, useMemo } from "react";

import { Button } from "@/components/button";
import { DateInput } from "@/components/date-input";

import { SearchBoxSheetContext } from "./SearchBoxSheetContext";
import type { DateSinglePreset } from "./types";

interface Props {
  /** yyyy-MM-dd 또는 빈 문자열. */
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  presets?: DateSinglePreset[];
  size: "mini" | "small";
}

/**
 * 단일 날짜 입력 — DateInput 1개 + 옵션 프리셋 버튼.
 *
 * SearchBoxDateRange의 단일 버전. 단일 SearchValues 키에 yyyy-MM-dd 직접 저장.
 * 다른 필드 없이 dateSingle만 있는 페이지에서 SearchBox flex-wrap에 자연스럽게 배치된다.
 */
export function SearchBoxDateSingle({
  value,
  onChange,
  ariaLabel,
  presets,
  size,
}: Props) {
  const inSearchBoxSheet = useContext(SearchBoxSheetContext);

  // 프리셋 date는 호출 시점에 계산. 한 렌더 내에선 모두 같은 시각이므로 useMemo로 한 번만.
  const presetDates = useMemo(
    () => presets?.map((preset) => ({ preset, date: preset.date() })) ?? [],
    [presets],
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <DateInput
        value={value}
        onChange={onChange}
        size={size}
        ariaLabel={ariaLabel}
        disableMobileSheet={inSearchBoxSheet}
      />
      {presetDates.length > 0 && (
        <div className="flex items-center gap-1">
          {presetDates.map(({ preset, date }) => {
            const isActive = value === date;
            return (
              <Button
                key={preset.label}
                variant={isActive ? "primary" : "tertiary"}
                appearance={isActive ? "filled" : "outlined"}
                size={size}
                onClick={() => onChange(date)}
                className={`whitespace-nowrap ${
                  size === "small" ? "h-10" : ""
                } ${
                  isActive
                    ? ""
                    : "border-border-tertiary! dark:border-border-secondary!"
                }`}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
