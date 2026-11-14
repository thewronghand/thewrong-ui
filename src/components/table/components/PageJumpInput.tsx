import { useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

interface PageJumpInputProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  "data-testid"?: string;
}

/**
 * 페이지 번호 직접 입력 → Enter로 점프.
 *
 * - 입력 동안에는 로컬 state, Enter 시점에만 onPageChange 호출.
 * - 입력 시점에 totalPages를 초과하면 즉시 totalPages로 clamp.
 * - 빈 값 또는 숫자가 아닐 땐 무시.
 */
export function PageJumpInput({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  "data-testid": testId,
}: PageJumpInputProps) {
  const [draft, setDraft] = useState("");

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits === "") {
      setDraft("");
      return;
    }
    const n = Number(digits);
    // 0 입력은 무의미하므로 제거. totalPages 초과 입력은 즉시 totalPages로 clamp.
    if (n <= 0) {
      setDraft("");
      return;
    }
    setDraft(String(Math.min(totalPages, n)));
  };

  const commit = () => {
    if (draft === "") return;
    const n = Number(draft);
    const next = Math.max(1, Math.min(totalPages, Math.floor(n)));
    if (next !== currentPage) {
      onPageChange(next);
    }
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      setDraft("");
      (e.target as HTMLInputElement).blur();
    }
  };

  // 입력 폭은 totalPages 자릿수 기준 + 약간의 여유. (1자리: w-10, 2자리: w-12, 3자리+: ch 단위로 자라남)
  const maxDigits = String(totalPages).length;
  const widthClass = maxDigits <= 2 ? "w-12" : maxDigits === 3 ? "w-14" : "w-16";

  return (
    <label
      className={cn("flex items-center gap-1 text-sm text-fg-muted", className)}
    >
      <span className="text-fg-muted">이동</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxDigits}
        value={draft}
        placeholder={String(currentPage)}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        aria-label={`페이지 번호 입력 (1-${totalPages})`}
        data-testid={testId}
        className={cn(
          widthClass,
          "rounded-control-mini border border-border-subtle bg-bg-surface px-2 py-0.5 text-center tabular-nums text-fg-default transition-colors hover:border-primary-border focus:border-primary focus:outline-hidden focus-visible:ring-control focus-visible:ring-focus-primary",
        )}
      />
      <span className="text-fg-muted tabular-nums">/ {totalPages.toLocaleString()}</span>
    </label>
  );
}
