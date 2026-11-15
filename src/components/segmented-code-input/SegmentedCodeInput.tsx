import { Eye, EyeOff } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { normalizeCode, pasteCode } from "./code-utils";

export interface SegmentedCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  hasError?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  /**
   * 숨겨진 실제 input의 keydown 핸들러. `<form>` 안에 놓이면 Enter가 자동으로
   * submit되지만, 모달처럼 제출 버튼이 폼 밖에 있는 경우엔 Enter가 갈 곳이
   * 없다. 그런 호출부가 Enter를 직접 처리할 수 있게 열어둔다.
   */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** 숨겨진 실제 input의 `id`. 같은 화면에 여러 인스턴스(코드·코드 확인 등)가
   * 있을 수 있으므로 호출부가 고유값을 넘긴다. */
  id: string;
  /** 숨겨진 실제 input의 접근성 라벨. */
  "aria-label": string;
  /**
   * 값 마스킹 여부. 기본값 `true`(마스킹 + 눈 토글).
   *
   * 영구 비밀값(예: PIN)은 가려야 하지만, 1회용 인증번호(OTP·SMS·이메일)는
   * 사용자가 다른 앱·문자를 보며 옮겨 적는 값이라 가리면 대조하기만
   * 불편해진다(GitHub·Slack·Stripe 등 주요 서비스도 1회용 코드를 마스킹하지
   * 않는다). `masked={false}`면 마스킹도 눈 토글 버튼도 렌더하지 않는다.
   */
  masked?: boolean;
  /**
   * 슬롯 외형. 기본값 `"box"`(사방 테두리 + 라운드).
   *
   * `"line"`은 아래 보더만 남긴 얇은 형태다. 자릿수가 적을 때 상자가
   * 과하게 무거워 보이는 자리에 쓴다.
   */
  variant?: "box" | "line";
  /** true면 입력을 막는다(예: 코드 만료). 기본값 `false`. */
  disabled?: boolean;
  /** 마스킹 해제 토글 버튼의 접근성 라벨. 기본값 "인증번호 표시"/"인증번호 숨기기". */
  maskToggleLabels?: { show: string; hide: string };
}

const DEFAULT_MASK_TOGGLE_LABELS = {
  show: "인증번호 표시",
  hide: "인증번호 숨기기",
};

/**
 * 브라우저의 OTP 자동 완성·붙여넣기는 단일 input에 맡기고,
 * 화면에서는 각 자리를 분리된 슬롯으로 표현한다. 숫자만 허용하며 length는 1 이상의 정수로 지정한다.
 * 값과 onChange는 호출부에서 관리하고, 일회용 코드는 masked={false}로 표시할 수 있다.
 */
export function SegmentedCodeInput({
  onKeyDown,
  value,
  onChange,
  length = 6,
  hasError = false,
  describedBy,
  autoFocus = false,
  masked = true,
  variant = "box",
  disabled = false,
  id,
  "aria-label": ariaLabel,
  maskToggleLabels = DEFAULT_MASK_TOGGLE_LABELS,
}: SegmentedCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  // `masked=false`면 토글 자체가 없으므로 항상 평문이다. 토글이 있는
  // 경우에만(masked=true) 사용자가 눈 아이콘으로 보이기/가리기를 바꾼다.
  const [isToggledVisible, setIsToggledVisible] = useState(false);
  const isMasked = masked && !isToggledVisible;
  const activeIndex = Math.min(value.length, length - 1);

  const moveCaretToEnd = () => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input)
        input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  return (
    <div className="relative flex w-full items-center justify-center">
      <div className={cn("relative isolate w-full max-w-[320px]", masked && "mx-12")}>
        <input
          ref={inputRef}
          id={id}
          type={isMasked ? "password" : "text"}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          aria-label={ariaLabel}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          value={value}
          maxLength={length}
          autoFocus={autoFocus}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
          onFocus={() => {
            setIsFocused(true);
            moveCaretToEnd();
          }}
          onKeyDown={onKeyDown}
          onClick={moveCaretToEnd}
          onBlur={() => setIsFocused(false)}
          onPaste={(event) => {
            event.preventDefault();
            const target = event.currentTarget;
            onChange(
              pasteCode(
                value,
                event.clipboardData.getData("text"),
                target.selectionStart ?? value.length,
                target.selectionEnd ?? value.length,
                length,
              ),
            );
            moveCaretToEnd();
          }}
          onChange={(event) => {
            onChange(normalizeCode(event.target.value, length));
          }}
        />
        {/* 칸 폭은 고정하고 남는 폭은 간격이 흡수한다 — `flex-1`로 늘리면
            자릿수가 적을 때 칸이 넓적해져 자릿수가 많은 화면과 두께가 달라 보인다. */}
        <div className="flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length }, (_, index) => {
            const isActive = isFocused && index === activeIndex;
            const digit = value[index];
            return (
              <span
                key={index}
                data-code-slot
                data-active={isActive || undefined}
                className={cn(
                  "flex h-control-large w-11 min-w-0 max-w-11 flex-1 items-center justify-center text-lg font-semibold text-fg-default transition-colors duration-control ease-control motion-reduce:transition-none",
                  variant === "line"
                    ? // 밑줄 끝을 둥글게 — `border-b`는 각지므로 rounded와
                      // overflow로 흉내내지 않고 아래쪽만 라운드를 준다.
                      "rounded-control-mini border-b-2 pb-1"
                    : "rounded-control-large border-control bg-bg-surface",
                  hasError
                    ? "border-border-danger text-fg-danger"
                    : isActive
                      ? variant === "line"
                        ? "border-primary"
                        : "border-primary ring-control ring-inset ring-focus-primary"
                      : "border-border-subtle",
                )}
              >
                {digit === undefined ? null : isMasked ? (
                  <span
                    data-code-mask
                    className={cn(
                      "size-2.5 rounded-circle",
                      hasError ? "bg-error" : "bg-fg-default",
                    )}
                  />
                ) : (
                  digit
                )}
              </span>
            );
          })}
        </div>
      </div>
      {/* 절대배치로 흐름에서 빼낸다 — flex 항목으로 두면 버튼 폭만큼 칸들이
          왼쪽으로 밀려 "중앙이 아닌 느낌"이 된다(자릿수가 적을 때 특히 두드러짐). */}
      {masked ? (
        <Button
          type="button"
          variant="secondary"
          appearance="transparent"
          disabled={disabled}
          aria-label={isMasked ? maskToggleLabels.show : maskToggleLabels.hide}
          aria-pressed={!isMasked}
          size="large"
          className="absolute right-0 top-1/2 w-control-large -translate-y-1/2 px-0"
          onClick={() => setIsToggledVisible((current) => !current)}
        >
          {isMasked ? (
            <Eye aria-hidden="true" className="size-5" />
          ) : (
            <EyeOff aria-hidden="true" className="size-5" />
          )}
        </Button>
      ) : null}
    </div>
  );
}
