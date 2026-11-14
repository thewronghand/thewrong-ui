/* eslint-disable no-restricted-imports -- 이관 지시에 따라 @/ 별칭 대신 상대 경로를 사용한다. */
import { Check, Copy } from "lucide-react";
import { toast } from "../toast";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";

export interface CopyableTextProps {
  /** 클립보드에 복사할 실제 값. */
  value: string;
  /**
   * 화면에 렌더할 내용. 생략하면 `value`를 그대로 보여준다.
   * 값과 표시 텍스트가 다른 소비처(예: 코드 + 부가 라벨)를 위한 옵션.
   */
  children?: React.ReactNode;
  /**
   * 토스트·aria-label에 쓰는 항목 이름(예: "코드"). 생략하면 일반 문구를 쓴다.
   * packages는 도메인 단어를 소유하지 않으므로 호출부가 넘긴 문자열을 그대로 쓴다.
   */
  label?: string;
  className?: string;
  /** 값 옆이 아닌 폼 컨트롤의 trailing slot에 놓을 때 아이콘만 표시한다. */
  iconOnly?: boolean;
  /** 복사 성공 상태(아이콘 전환)를 유지하는 시간(ms). 기본 1500. */
  feedbackDurationMs?: number;
}

const DEFAULT_FEEDBACK_DURATION_MS = 1500;

/** 클립보드 복사 결과를 아이콘과 토스트로 알린다. 보안 컨텍스트와 clipboard 권한이 필요하며,
 * 앱 루트에 ToastProvider를 둔다. 표시 텍스트가 복사 값과 다르면 children을 지정한다. */
export function CopyableText({
  value,
  children,
  label,
  className,
  iconOnly = false,
  feedbackDurationMs = DEFAULT_FEEDBACK_DURATION_MS,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  // `window.setTimeout`은 브라우저 오버로드가 number를 반환하지만, 이
  // 패키지의 tsconfig가 Node 타입도 include해 `ReturnType<typeof
  // setTimeout>`이 Node의 Timeout으로 추론될 수 있다 — 명시적으로 number.
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(label ? `${label}을(를) 복사했습니다.` : "복사했습니다.");
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, feedbackDurationMs);
    } catch {
      toast.error(
        label ? `${label} 복사에 실패했습니다.` : "복사에 실패했습니다.",
      );
    }
  };

  const icon = copied ? (
    <Check
      aria-hidden="true"
      className={iconOnly ? "size-4" : "size-3.5 shrink-0"}
    />
  ) : (
    <Copy
      aria-hidden="true"
      className={iconOnly ? "size-4" : "size-3.5 shrink-0 opacity-60"}
    />
  );

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="secondary"
        appearance="transparent"
        aria-label={label ? `${label} 복사` : "복사"}
        title={label ? `클릭하여 ${label} 복사` : "클릭하여 복사"}
        size="mini"
        className={cn(
          "w-control-mini px-0",
          copied && "text-success-fg",
          className,
        )}
        onClick={() => void handleCopy()}
      >
        {icon}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label ? `${label} 복사` : "복사"}
      title={label ? `클릭하여 ${label} 복사` : "클릭하여 복사"}
      className={cn(
        "inline-flex items-center gap-1 rounded-control-mini text-fg-accent underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current focus-visible:outline-none focus-visible:ring-control focus-visible:ring-focus-primary-soft",
        copied && "text-success-fg",
        className,
      )}
    >
      <span>{children ?? value}</span>
      {icon}
    </button>
  );
}
