// ── 시맨틱 토큰 유틸리티만 사용. 프리미티브 직참조 금지. dark: variant 금지. ───

import { cn } from "@/lib/utils";
import type { ProgressProps, ProgressSize } from "./types";

// 리터럴 Record로만 — 템플릿 문자열 조합 금지 (Tailwind 스캔 불가).
const PROGRESS_TRACK_SIZE_CLASS: Record<ProgressSize, string> = {
  small: "h-1.5",
  medium: "h-2.5",
};

/**
 * Progress — 결정형 또는 불확정 진행률 바 원자.
 *
 * `value`는 0~100 스케일이다. 서버 계약이 0~1(비율)을 내려주는 도메인이
 * 있더라도 이 컴포넌트에는 항상 0~100으로 변환해 넘긴다 — 컴포넌트가
 * 스케일을 추측하지 않는다.
 *
 * 접근성: `role="progressbar"`를 유지한다. 결정형은 값과 범위를 알리고,
 * 불확정형은 값과 범위를 생략한다. 움직임 감소 설정에서는 정적으로 표시한다.
 */
export function Progress({
  value,
  size = "medium",
  className,
  ...rest
}: ProgressProps) {
  const clamped =
    value === undefined ? undefined : Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={clamped === undefined ? undefined : 0}
      aria-valuemax={clamped === undefined ? undefined : 100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-bg-subtle",
        PROGRESS_TRACK_SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary-fg",
          clamped === undefined
            ? "progress-indeterminate"
            : "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        )}
        style={clamped === undefined ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
