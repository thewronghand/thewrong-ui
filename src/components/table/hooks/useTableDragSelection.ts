import { useCallback, useEffect, useMemo, useRef } from "react";

interface Options<T> {
  /** 현재 표에 그려진 row들 (순서대로). */
  rows: T[];
  /** row의 안정 식별자. */
  getRowId: (row: T) => string | number;
  /** 어떤 row가 현재 선택되었는지 알려준다 — 드래그 시작 시 모드(check/uncheck)를 결정한다. */
  isSelected: (row: T) => boolean;
  /** 단일 row의 선택 상태를 next로 강제 설정. */
  setSelected: (row: T, next: boolean) => void;
  /** 훅을 활성화할지 여부. false면 window 리스너를 등록하지 않는다. */
  enabled?: boolean;
  /** 자동 스크롤 컨테이너 ref (window 리스너 + 좌표 비교). */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** 자동 스크롤 트리거 영역(컨테이너 상/하단 px). 기본 60. */
  edgeSize?: number;
  /** 자동 스크롤 최대 속도(px/frame). 기본 14. */
  maxSpeed?: number;
}

/**
 * 표의 다중 행을 드래그로 선택/해제한다 — 비스킷링크의 드래그 체크 패턴을 일반화.
 *
 * 동작:
 * - mouseDown(row 인덱스 i): 드래그 시작. row의 현재 선택 상태를 뒤집은 값을 모드로 잡고, 그 row를 그 모드로 적용
 * - mouseEnter(row 인덱스 j): 드래그 중이면 [lastIndex, j] 범위의 모든 row를 모드와 다른 항목만 토글
 * - mouseUp/mouseLeave(window): 드래그 종료
 * - 드래그 중 컨테이너 상/하 edgeSize 안에 마우스가 들어오면 매 프레임 자동 스크롤
 *
 * 드래그 도중 데이터가 refetch 등으로 흔들려도 마지막 식별자(lastIdRef)를 기준으로 인덱스를 다시 찾아
 * 어긋남 위험을 줄인다.
 */
export function useTableDragSelection<T>({
  rows,
  getRowId,
  isSelected,
  setSelected,
  enabled = true,
  scrollContainerRef,
  edgeSize = 60,
  maxSpeed = 14,
}: Options<T>) {
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef(true);
  /** 가장 최근에 통과한 row의 안정 식별자. 인덱스 대신 ID로 추적해 데이터 변경에도 안전. */
  const lastIdRef = useRef<string | number | null>(null);
  /** 가장 최근 마우스 Y 좌표 (자동 스크롤용). */
  const lastMouseYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // rows를 ref로 들고가서 콜백이 stale identity 안 되게 한다.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;
  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;
  const setSelectedRef = useRef(setSelected);
  setSelectedRef.current = setSelected;

  /** rows 변경 시 ID→index 캐시 재계산. mouseEnter당 O(1) lookup. */
  const idToIndex = useMemo(() => {
    const map = new Map<string | number, number>();
    for (let i = 0; i < rows.length; i++) {
      map.set(getRowId(rows[i]), i);
    }
    return map;
    // getRowId는 통상 안정적이지만 deps에 넣으면 재생성됨 — rows 식별자 변화에만 따라가도록 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const idToIndexRef = useRef(idToIndex);
  idToIndexRef.current = idToIndex;

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastMouseYRef.current = null;
  }, []);

  const tickAutoScroll = useCallback(() => {
    rafRef.current = null;
    if (!isDraggingRef.current) return;
    const container = scrollContainerRef?.current;
    const y = lastMouseYRef.current;
    if (!container || y == null) return;

    const rect = container.getBoundingClientRect();
    let delta = 0;
    if (y < rect.top + edgeSize) {
      const ratio = (rect.top + edgeSize - y) / edgeSize;
      delta = -Math.ceil(maxSpeed * Math.min(1, Math.max(0, ratio)));
    } else if (y > rect.bottom - edgeSize) {
      const ratio = (y - (rect.bottom - edgeSize)) / edgeSize;
      delta = Math.ceil(maxSpeed * Math.min(1, Math.max(0, ratio)));
    }
    if (delta !== 0) {
      container.scrollTop += delta;
    }
    rafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [edgeSize, maxSpeed, scrollContainerRef]);

  // 활성 상태에서만 window 리스너 등록.
  useEffect(() => {
    if (!enabled) return;
    const handleUp = () => {
      isDraggingRef.current = false;
      lastIdRef.current = null;
      stopAutoScroll();
    };
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      lastMouseYRef.current = e.clientY;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tickAutoScroll);
      }
    };
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("mousemove", handleMove);
      stopAutoScroll();
    };
  }, [enabled, stopAutoScroll, tickAutoScroll]);

  /** ID→index 캐시 lookup. 못 찾으면 -1. */
  const indexOfId = (id: string | number | null): number => {
    if (id == null) return -1;
    return idToIndexRef.current.get(id) ?? -1;
  };

  const onRowMouseDown = useCallback((index: number) => {
    if (!enabled) return;
    const rowsNow = rowsRef.current;
    const row = rowsNow[index];
    if (!row) return;
    isDraggingRef.current = true;
    lastIdRef.current = getRowIdRef.current(row);
    dragModeRef.current = !isSelectedRef.current(row);
    setSelectedRef.current(row, dragModeRef.current);
  }, [enabled]);

  const onRowMouseEnter = useCallback((index: number) => {
    if (!enabled || !isDraggingRef.current) return;
    const rowsNow = rowsRef.current;
    const row = rowsNow[index];
    if (!row) return;
    const enterId = getRowIdRef.current(row);
    if (enterId === lastIdRef.current) return;
    // 마지막 ID의 현재 인덱스를 동적으로 탐색 — 데이터가 바뀌어도 안전.
    const lastIndex = indexOfId(lastIdRef.current);
    const fromIndex = lastIndex === -1 ? index : lastIndex;
    const from = Math.min(fromIndex, index);
    const to = Math.max(fromIndex, index);
    for (let i = from; i <= to; i++) {
      const r = rowsNow[i];
      if (!r) continue;
      const cur = isSelectedRef.current(r);
      if (cur !== dragModeRef.current) {
        setSelectedRef.current(r, dragModeRef.current);
      }
    }
    lastIdRef.current = enterId;
  }, [enabled]);

  return {
    onRowMouseDown,
    onRowMouseEnter,
  };
}
