import { useState, useRef, type KeyboardEvent } from "react";

interface Props {
  /** 라벨 — 비어 있을 땐 placeholder처럼 인풋 안에 위치, 포커스/값 있을 땐 상단 보더로 부유. */
  label: string;
  value: string;
  onChange: (next: string) => void;
  onEnter?: () => void;
  size: "mini" | "small";
  inputMode?: "text" | "numeric";
  /** 우측 슬롯 — 검색 아이콘/액션 등. 키보드 포커스 색에 영향 X. */
  trailing?: React.ReactNode;
}

/**
 * SearchBox 전용 플로팅 라벨 인풋 (MUI outlined TextField 패턴).
 *
 * 동작:
 * - 값 없음 + 미포커스: 라벨이 인풋 중앙 (placeholder 역할)
 * - 포커스 OR 값 있음: 라벨이 상단 보더로 올라가며 작아짐
 * - 보더는 라벨 부유 위치에 노치(틈)를 두지 않고 단순 white 배경으로 라벨이 덮어 가리는 방식.
 *   (배경이 투명/이미지일 땐 시안과 차이날 수 있지만 SearchBox 컨테이너는 페이지 배경 위라 OK.)
 *
 * 공용 Input을 건드리지 않기 위해 SearchBox 전용 wrapper로 격리.
 */
export function SearchBoxFloatingInput({
  label,
  value,
  onChange,
  onEnter,
  size,
  inputMode,
  trailing,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filled = value.length > 0;
  const floated = isFocused || filled;

  const heightClass = size === "mini" ? "h-8" : "h-10";
  const inputTextClass = size === "mini" ? "text-xs" : "text-sm";
  const paddingX = size === "mini" ? "px-2.5" : "px-3";

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div
      className={`relative ${heightClass} w-full cursor-text rounded-lg border bg-bg-white transition-colors ${
        isFocused
          ? "border-primary-500"
          : "border-border-tertiary dark:border-border-secondary"
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        inputMode={inputMode}
        aria-label={label}
        className={`peer h-full w-full bg-transparent ${paddingX} ${inputTextClass} text-text-primary placeholder-transparent focus:outline-hidden`}
        placeholder={label}
      />
      {/*
        라벨 배경 — 인풋 배경(white)과 같은 색을 써서 보더 위에 노치처럼 보이게.
      */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-2 px-1 transition-all bg-bg-white ${
          floated
            ? `-top-2 ${size === "mini" ? "text-[10px]" : "text-xs"} ${
                isFocused ? "text-primary-500" : "text-text-secondary"
              }`
            : `top-1/2 -translate-y-1/2 ${inputTextClass} text-text-tertiary`
        }`}
      >
        {label}
      </span>
      {trailing && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          {trailing}
        </div>
      )}
    </div>
  );
}
