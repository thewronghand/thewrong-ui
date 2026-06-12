import { useLayoutEffect, useState, type RefObject } from "react";

export type FillEmptyRowsRemainingMode = "sum-real-rows" | "tbody-height";

export interface UseFillEmptyRowsOptions {
  /** 활성 여부. false면 빈 행 0으로 고정. */
  enabled: boolean;
  /** 스크롤 컨테이너 ref — 가용 높이의 기준. */
  containerRef: RefObject<HTMLElement | null>;
  /** thead ref — 헤더 높이만큼 가용 영역에서 제외. */
  theadRef: RefObject<HTMLElement | null>;
  /** tbody ref — 평균 행 높이 측정 + 잔여 공간 계산. */
  tbodyRef: RefObject<HTMLElement | null>;
  /**
   * 평균 행 높이 측정에서 제외할 행을 가리키는 CSS selector.
   * 예: `"tr:not([data-empty-row])"`, `"tr:not([data-empty-row]):not([data-expanded-row])"`
   */
  excludeRowsSelector: string;
  /**
   * 잔여 공간 계산 방식.
   * - `sum-real-rows`: 측정 대상 행들의 높이 합을 뺀다 (펼침 없는 단순 테이블).
   * - `tbody-height`: tbody 전체 높이를 뺀다 (펼침 행이 있어 tbody가 동적으로 커지는 경우).
   */
  remainingMode: FillEmptyRowsRemainingMode;
  /**
   * tbody 자체도 ResizeObserver로 감시할지. 펼침 토글 등 tbody 높이가 변하는 경우 true.
   * @default false
   */
  observeTbody?: boolean;
  /**
   * effect deps에 함께 묶을 추가 값들. data/visibleColumns 등 측정에 영향 주는 외부 값.
   *
   * **중요**: 호출처에서 안정 참조로 넘겨야 한다. 매 렌더마다 새 배열/객체가 들어오면
   * effect가 매 렌더 재구독되어 ResizeObserver가 반복 생성/해제된다.
   * - 배열/객체: `useMemo`로 메모이즈
   * - 원시값(length, key 등): 그대로 전달 OK
   * - 펼침 토글 등 DOM 변화는 `observeTbody` ResizeObserver가 잡으므로 deps에 두지 말 것.
   */
  deps?: ReadonlyArray<unknown>;
}

export interface UseFillEmptyRowsReturn {
  /** 빈 행으로 채워야 할 개수. */
  emptyRowCount: number;
  /** 측정된 평균 행 높이(px). 빈 행의 height에 그대로 적용 가능. */
  measuredRowHeight: number | null;
}

/**
 * 컨테이너 잔여 공간만큼 빈 행을 채우기 위한 개수/높이를 계산한다.
 *
 * `Table`(단순)과 `AccordionTable`(펼침 포함) 모두에서 동일한 측정 흐름을 공유하되,
 * 측정 대상 행 셀렉터와 잔여 공간 계산 방식만 옵션으로 다르게 받는다.
 */
export function useFillEmptyRows({
  enabled,
  containerRef,
  theadRef,
  tbodyRef,
  excludeRowsSelector,
  remainingMode,
  observeTbody = false,
  deps = [],
}: UseFillEmptyRowsOptions): UseFillEmptyRowsReturn {
  const [emptyRowCount, setEmptyRowCount] = useState(0);
  const [measuredRowHeight, setMeasuredRowHeight] = useState<number | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!enabled) {
      setEmptyRowCount((prev) => (prev === 0 ? prev : 0));
      return;
    }
    const container = containerRef.current;
    const thead = theadRef.current;
    const tbody = tbodyRef.current;
    if (!container || !thead || !tbody) return;

    const recalc = () => {
      const containerH = container.clientHeight;
      const headH = thead.offsetHeight;
      const realRows =
        tbody.querySelectorAll<HTMLTableRowElement>(excludeRowsSelector);
      if (realRows.length === 0) {
        setEmptyRowCount(0);
        setMeasuredRowHeight(null);
        return;
      }
      let realRowsH = 0;
      realRows.forEach((tr) => {
        realRowsH += tr.offsetHeight;
      });
      const avgRowH = realRowsH / realRows.length;
      if (avgRowH <= 0) return;

      setMeasuredRowHeight((prev) => (prev === avgRowH ? prev : avgRowH));

      const occupied =
        remainingMode === "tbody-height" ? tbody.offsetHeight : realRowsH;
      const remaining = containerH - headH - occupied;
      const next = remaining > 0 ? Math.floor(remaining / avgRowH) : 0;
      setEmptyRowCount((prev) => (prev === next ? prev : next));
    };

    recalc();

    // ResizeObserver 콜백에서 setState 직접 호출 시 "loop completed" 경고 가능 → rAF throttle
    let frameId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
        recalc();
      });
    });
    ro.observe(container);
    if (observeTbody) {
      ro.observe(tbody);
    }
    return () => {
      ro.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, excludeRowsSelector, remainingMode, observeTbody, ...deps]);

  return { emptyRowCount, measuredRowHeight };
}
