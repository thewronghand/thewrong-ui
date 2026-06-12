import { Check } from "lucide-react";

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
  size: "mini" | "small";
}

/**
 * SearchBox "완전일치" 토글.
 *
 * 시안(`완전일치.png`): 박스 없는 인라인 체크 아이콘 + 라벨.
 * - 비활성: 회색 체크 + 회색 라벨
 * - 활성: 파란 체크 + 파란 라벨
 */
export function ExactMatchToggle({ value, onChange, size }: Props) {
  const isMini = size === "mini";
  const labelText = isMini ? "text-xs" : "text-sm";
  const iconSize = isMini ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <label className="inline-flex cursor-pointer items-center gap-1 select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <Check
        className={`${iconSize} stroke-3 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-primary-500 peer-focus-visible:outline-offset-1 ${
          value ? "text-primary-500" : "text-icon-tertiary"
        }`}
        aria-hidden="true"
      />
      <span
        className={`${labelText} font-medium transition-colors ${
          value ? "text-primary-500" : "text-text-tertiary"
        }`}
      >
        완전일치
      </span>
    </label>
  );
}
