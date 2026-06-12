import type { ReactNode } from "react";

export interface CollapsibleProps {
  /** true면 펼침, false면 접힘. */
  open: boolean;
  /** 접힘 → 펼침/그 반대 모션 시간. 기본 200ms. */
  durationMs?: number;
  /** ease. 기본 ease-out. */
  ease?: string;
  /**
   * 접힘 상태에서 콘텐츠를 DOM에서 제거할지 여부. 기본 false(렌더 유지 + height 0).
   * true면 unmount하면서 모션은 사라진다(다음 펼침 때 처음부터).
   */
  unmountWhenClosed?: boolean;
  /** 접힘 상태에서 opacity 0으로 만들지 여부. 기본 true. */
  fade?: boolean;
  /** 추가 className(외부 wrapper에 적용). */
  className?: string;
  children: ReactNode;
}

/**
 * 자식 콘텐츠 높이를 부드럽게 펼치고 접는 컴포넌트.
 *
 * 구현은 CSS grid의 `grid-template-rows: 0fr ↔ 1fr` 트릭이라 JS 측정 없이도 height auto
 * 트랜지션이 동작한다 (Chrome 117+ / Safari 17.4+ / Firefox 117+).
 *
 * 모달 안에서 영역을 부드럽게 늘리고 줄일 때 사용. 모달 외곽 자체는 Collapsible로 감싸지 말 것
 * (시트 위치/스크롤 컨테이너 동작과 충돌 가능). 모달 안의 내용 블록을 감싸는 용도.
 *
 * @example
 * ```tsx
 * <Collapsible open={showDetail}>
 *   <div className="px-4 py-3">상세 정보</div>
 * </Collapsible>
 * ```
 */
export function Collapsible({
  open,
  durationMs = 200,
  ease = "cubic-bezier(0.16, 1, 0.3, 1)",
  unmountWhenClosed = false,
  fade = true,
  className = "",
  children,
}: CollapsibleProps) {
  if (unmountWhenClosed && !open) return null;

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: fade ? (open ? 1 : 0) : undefined,
        transition: [
          `grid-template-rows ${durationMs}ms ${ease}`,
          fade ? `opacity ${durationMs}ms ${ease}` : null,
        ]
          .filter(Boolean)
          .join(", "),
      }}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
