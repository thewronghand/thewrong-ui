import { SearchBoxDateRange } from "./SearchBoxDateRange";
import { SearchBoxDateSingle } from "./SearchBoxDateSingle";
import { SearchBoxFloatingInput } from "./SearchBoxFloatingInput";
import { SearchBoxFloatingSelect } from "./SearchBoxFloatingSelect";
import { SearchBoxMonth } from "./SearchBoxMonth";
import { SearchBoxMultiSelect } from "./SearchBoxMultiSelect";
import type { SearchField } from "./types";

interface Props {
  field: SearchField;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  size: "mini" | "small";
}

/** 단일 필드 렌더. type별 컴포넌트 분기. SearchBox 본체에서 분리해 갓 컴포넌트 회피. */
export function SearchBoxField({
  field,
  value,
  onChange,
  onEnter,
  size,
}: Props) {
  if (field.type === "text") {
    return (
      <SearchBoxFloatingInput
        label={field.label}
        value={value}
        onChange={onChange}
        onEnter={onEnter}
        size={size}
        inputMode={field.inputMode}
      />
    );
  }

  if (field.type === "multiSelect") {
    return (
      <SearchBoxMultiSelect
        label={field.label}
        options={field.options}
        value={value}
        onChange={onChange}
        size={size}
      />
    );
  }

  if (field.type === "dateRange") {
    return (
      <SearchBoxDateRange
        value={value}
        onChange={onChange}
        presets={field.presets}
        size={size}
      />
    );
  }

  if (field.type === "dateSingle") {
    return (
      <SearchBoxDateSingle
        value={value}
        onChange={onChange}
        ariaLabel={field.label}
        presets={field.presets}
        size={size}
      />
    );
  }

  if (field.type === "month") {
    return (
      <SearchBoxMonth
        value={value}
        onChange={onChange}
        ariaLabel={field.label}
        size={size}
      />
    );
  }

  // select (단일) — placeholder는 플로팅 라벨이 대체하므로 prop으로 받지 않는다.
  return (
    <SearchBoxFloatingSelect
      label={field.label}
      options={field.options}
      value={value}
      onChange={onChange}
      size={size}
    />
  );
}
