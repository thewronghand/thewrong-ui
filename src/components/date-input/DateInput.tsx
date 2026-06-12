import { Calendar } from "lucide-react";

import { DatePicker } from "@/components/date-picker";

interface Props {
  /** yyyy-MM-dd 또는 빈 문자열. */
  value: string;
  onChange: (next: string) => void;
  size?: "mini" | "small";
  ariaLabel?: string;
  /**
   * SearchBox 플로팅 라벨 패턴을 적용한다. 지정하면 상단에 작은 라벨이 부유로 떠 다른 검색 필드와
   * 같은 톤. 값 없음 + 미포커스면 인풋 중앙 placeholder 위치, 포커스/값 있음이면 상단 보더 위.
   */
  label?: string;
  className?: string;
  /**
   * true면 trailing 캘린더 버튼이 모바일에서도 popover로만 떠 자체 바텀시트를 만들지 않는다.
   * 호출부가 이미 시트(예: SearchBox 모바일 바텀시트) 안에 있을 때 시트 두 개 겹침 회피.
   */
  disableMobileSheet?: boolean;
}

/**
 * 단일 날짜 입력 — `<input type="date">` + 우측 trailing 캘린더 버튼(DatePicker popover).
 *
 * 네이티브 캘린더 indicator는 `.search-box-date-input` 클래스 + globals CSS로 숨김.
 * 사용자는 직접 타이핑(브라우저가 yyyy-MM-dd 형식 강제) 또는 trailing 버튼으로 캘린더 선택.
 * value 빈 값일 땐 placeholder(브라우저 기본 "연도-월-일")가 회색으로 표기.
 */
export function DateInput({
  value,
  onChange,
  size = "small",
  ariaLabel,
  label,
  className = "",
  disableMobileSheet = false,
}: Props) {
  // size별 분기 — mini는 모바일/협소 영역, small은 데스크톱 폼.
  // small=h-10: SearchBox의 FloatingInput/Select와 정렬 (form-size-tokens과 별개로 SearchBox 영역 통일).
  const isMini = size === "mini";
  const inputHeight = isMini ? "h-8" : "h-10";
  const wrapperWidth = isMini ? "w-30" : "w-36";
  const wrapperPad = isMini ? "pl-2 pr-0.5" : "pl-2.5 pr-1";
  const inputTextSize = isMini ? "text-xs" : "text-sm";
  const calendarBtnSize = isMini ? "h-5 w-5" : "h-6 w-6";
  const calendarIconSize = isMini ? "h-3 w-3" : "h-3.5 w-3.5";

  // SearchBox 서치필드 토큰과 통일: rounded-lg, border-border-tertiary, bg-bg-white, focus는 primary-500.
  // focus-within으로 자식(input + 캘린더 트리거 버튼) 어느 쪽이 포커스 받든 보더 강조.
  // 라벨도 같은 group의 focus-within에 반응해 primary로 변색.
  const wrapperClass = `group relative ${inputHeight} ${wrapperWidth} ${wrapperPad} flex items-center gap-1 rounded-lg border border-border-tertiary dark:border-border-secondary bg-bg-white transition-colors focus-within:border-primary-500 ${className}`;
  // value 비어있으면 placeholder만 보이는 상태 — placeholder 색을 text-tertiary로 강제.
  const inputColor = value
    ? "text-text-primary"
    : "text-text-tertiary";

  // <input type="date">는 빈 값에서도 브라우저 placeholder("연도-월-일")가 보임 → label 있으면
  // 항상 floated 상태로 띄워서 SearchBox의 다른 플로팅 라벨과 톤 일치 (placeholder 위에 라벨이
  // 겹치는 어색함 회피).
  const showFloatingLabel = !!label;

  return (
    <div className={wrapperClass}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="1900-01-01"
        max="9999-12-31"
        aria-label={ariaLabel ?? label}
        className={`search-box-date-input flex-1 bg-transparent ${inputTextSize} outline-none ${inputColor}`}
      />
      <DatePicker
        value={value || null}
        onApply={(next) => onChange(next)}
        disableMobileSheet={disableMobileSheet}
      >
        <button
          type="button"
          aria-label="달력에서 날짜 선택"
          className={`flex ${calendarBtnSize} items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200`}
        >
          <Calendar className={calendarIconSize} />
        </button>
      </DatePicker>
      {showFloatingLabel && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-2 left-2 bg-bg-white px-1 text-text-secondary group-focus-within:text-primary-500 ${
            isMini ? "text-[10px]" : "text-xs"
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
