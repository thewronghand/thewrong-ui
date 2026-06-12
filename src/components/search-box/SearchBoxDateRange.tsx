import { useContext, useMemo } from "react";

import { Button } from "@/components/button";
import { DateInput } from "@/components/date-input";

import { parseDateRangeValue, serializeDateRangeValue } from "./parseDateRange";
import { SearchBoxSheetContext } from "./SearchBoxSheetContext";
import type { DateRangePreset } from "./types";

interface Props {
  /** "from~to" CSV. 빈 문자열이면 양쪽 모두 비어있음. */
  value: string;
  onChange: (next: string) => void;
  presets?: DateRangePreset[];
  size: "mini" | "small";
}

/**
 * 날짜 범위 입력 — DateInput 2개 (직접 타이핑 + 캘린더 popover) + 프리셋 버튼.
 *
 * 레이아웃 그룹화:
 * - 인풋 묶음(from `~` to)은 절대 분리되지 않음. 좁아지면 한 묶음 통째로 다음 줄로.
 * - 프리셋 묶음도 통째로 유지(버튼 텍스트 nowrap).
 * - 두 묶음은 부모 flex-wrap이라 viewport에 따라 한 줄/두 줄 자동 전환.
 *
 * URL 직렬화: 단일 SearchValues 키에 `"from~to"`. 빈 값은 미입력.
 */
export function SearchBoxDateRange({ value, onChange, presets, size }: Props) {
  const { from, to } = parseDateRangeValue(value);
  const inSearchBoxSheet = useContext(SearchBoxSheetContext);
  // 부모 SearchBox 바텀시트 안이면 DatePicker가 자체 모바일 바텀시트를 띄우지 않게 차단.
  // 시트 두 개 겹침 회피 — popover로만 동작.

  // 프리셋 range는 호출 시점(현재 시각)에 계산. 한 렌더 내에선 모두 같은 시각이므로
  // useMemo로 한 번만 호출 — 매 버튼마다 호출하지 않게 한다.
  const presetRanges = useMemo(
    () => presets?.map((preset) => ({ preset, range: preset.range() })) ?? [],
    [presets],
  );

  const applyPreset = (preset: DateRangePreset) => {
    const range = preset.range();
    onChange(serializeDateRangeValue(range.from, range.to));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div className="flex items-center gap-1.5">
        <DateInput
          value={from}
          onChange={(next) => onChange(serializeDateRangeValue(next, to))}
          size={size}
          ariaLabel="시작일"
          disableMobileSheet={inSearchBoxSheet}
        />
        <span className="text-neutral-400">~</span>
        <DateInput
          value={to}
          onChange={(next) => onChange(serializeDateRangeValue(from, next))}
          size={size}
          ariaLabel="종료일"
          disableMobileSheet={inSearchBoxSheet}
        />
      </div>
      {presetRanges.length > 0 && (
        <div className="flex items-center gap-1">
          {presetRanges.map(({ preset, range }) => {
            const isActive = from === range.from && to === range.to;
            return (
              <Button
                key={preset.label}
                variant={isActive ? "primary" : "tertiary"}
                appearance={isActive ? "filled" : "outlined"}
                size={size}
                onClick={() => applyPreset(preset)}
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
