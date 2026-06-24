export interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-primary-500 dark:text-primary-400`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * 영역 중앙에 스피너 + 메시지를 표시하는 로딩 표시. 데이터 페칭 중 컨테이너에 채워 쓴다.
 * 텍스트 줄 안에 인라인으로 넣을 작은 스피너는 `InlineSpinner`, 스피너 단독은 `Spinner`.
 *
 * @example
 * ```tsx
 * {isLoading ? <LoadingSpinner /> : <Table ... />}
 * <LoadingSpinner message="정산 내역을 불러오는 중이에요..." size="lg" />
 * ```
 */
export function LoadingSpinner({
  message = "데이터를 불러오는 중이에요...",
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center h-full min-h-[200px] ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner size={size} />
        {message && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

/** 인라인(작은) 스피너 — 리스트 하단 더보기 로딩 등. */
export function InlineSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex items-center justify-center py-3">
      <Spinner size={size} />
    </div>
  );
}
