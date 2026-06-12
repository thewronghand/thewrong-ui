import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface AnimatedHeightProps {
  children: ReactNode;
  /** 트랜지션 시간(ms). 기본 220. */
  durationMs?: number;
  /** cubic-bezier 커브(motion). 기본 ease-out. */
  ease?: [number, number, number, number];
  /** 외부 wrapper 추가 className. */
  className?: string;
}

/**
 * 자식 콘텐츠 높이가 변할 때 부드럽게 이행시키는 wrapper.
 *
 * 모드 토글이나 행 추가/삭제 같은 가벼운 변화에 부드러운 트랜지션으로 UX 품질을 높인다.
 * 구현은 ResizeObserver로 자식 높이를 측정해 motion height로 이행. **첫 측정은 transition 0**으로
 * 적용해 진입 시점 점프를 방지한다 (motion-discussions#1884의 표준 패턴).
 *
 * 모달 외곽이 아니라 **모달 안의 콘텐츠 영역**을 감싸야 한다. 외곽 모달에 직접 적용하면 진입/퇴장
 * 모션과 충돌한다.
 *
 * @example
 * ```tsx
 * <AnimatedHeight>
 *   <ModeToggle />
 *   {showAdvanced && <AdvancedOptions />}
 *   <RowList rows={rows} />
 * </AnimatedHeight>
 * ```
 */
export function AnimatedHeight({
  children,
  durationMs = 220,
  ease = [0.16, 1, 0.3, 1],
  className = "",
}: AnimatedHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  // 첫 ResizeObserver 콜백은 transition 없이 즉시 적용 — 진입 시점 점프 방지.
  const isFirstMeasureRef = useRef(true);
  const [animateEnabled, setAnimateEnabled] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = entry.contentRect.height;
      setHeight(next);
      if (isFirstMeasureRef.current) {
        isFirstMeasureRef.current = false;
        // 다음 프레임부터 transition 활성. 첫 측정값은 즉시 반영.
        requestAnimationFrame(() => setAnimateEnabled(true));
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height }}
      transition={
        animateEnabled ? { duration: durationMs / 1000, ease } : { duration: 0 }
      }
      style={{ overflow: "hidden" }}
      className={className}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}
