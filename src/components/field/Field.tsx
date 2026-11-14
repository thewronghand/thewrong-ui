import { cn } from "@/lib/utils";
import type { FieldProps } from "./types";

// ── 시맨틱 토큰 유틸리티만 사용. 프리미티브 직참조 금지. ─────────────────────
//
// 사이즈 토큰 적용 범위:
//   라벨 텍스트: text-xs — 폼 컨트롤 사이즈 표(text-control-*) 밖의 라벨 전용 크기.
//   라벨 행 높이: h-4(16px) — 컨트롤 표 밖 간격. "독자 축" raw 유지.
//   스택 간격:   space-y-1.5 — 라벨↔컨트롤 간격. 컨트롤 표 밖 간격. "독자 축" raw 유지.
//   rightLabel inline lineHeight: 16px — Tailwind leading-4가 일부 케이스에서 캐싱 문제로
//     적용 안 되는 경우를 대비한 인라인 고정값.

/**
 * 라벨 + 우측 보조 텍스트 + 컨트롤을 묶는 폼 필드 래퍼.
 * 모달 폼 및 일반 폼에서 공통 사용.
 *
 * @example
 * <Field label="이름" required>
 *   <Input variant="box" placeholder="이름을 입력하세요" />
 * </Field>
 *
 * @example
 * <Field label="금액" rightLabel="최대 100만원">
 *   <Input variant="box" suffix="원" />
 * </Field>
 */
export function Field({
  label,
  htmlFor,
  rightLabel,
  className,
  required,
  optional,
  children,
}: FieldProps) {
  // ReactNode rightLabel은 자체 사이즈를 가진 요소(버튼·뱃지 등)일 수 있어 행 높이를 강제하면 잘린다.
  // string rightLabel일 때만 행 높이를 h-4(16px)로 고정해 라벨 행 시프트를 막는다.
  // rightLabel 없을 때도 동일하게 고정해 일관된 라벨 행 높이를 보장.
  const hasNodeRight = rightLabel != null && typeof rightLabel !== "string";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-between",
          !hasNodeRight && "h-4",
        )}
      >
        <label
          htmlFor={htmlFor}
          className="block text-xs leading-4 font-medium text-fg-muted"
        >
          {label}
          {required && (
            // 필수 여부는 실제 input의 required 또는 aria-required로도 표시한다.
            <span aria-hidden="true" className="ml-1 text-fg-danger">
              *
            </span>
          )}
          {!required && optional && (
            // fg-subtle: 라벨보다 한 단계 옅음 — "보조 정보" 위계.
            <span className="ml-1 text-fg-subtle">(선택)</span>
          )}
        </label>
        {typeof rightLabel === "string" ? (
          // inline style — Tailwind v4의 text-[11px] arbitrary value는 line-height 매핑이
          // 자동으로 안 들어가고, leading-4 utility도 캐싱 이슈로 적용 안 되는 케이스가 있어
          // inline lineHeight 16px로 고정한다. 행 높이 16px 보장.
          <span
            style={{ lineHeight: "16px" }}
            className="text-[11px] text-fg-subtle"
          >
            {rightLabel}
          </span>
        ) : (
          rightLabel
        )}
      </div>
      {children}
    </div>
  );
}
