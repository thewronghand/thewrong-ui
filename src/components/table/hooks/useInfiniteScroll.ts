import { useEffect, useRef, useCallback } from "react";

/**
 * 무한스크롤 훅 옵션
 */
export interface UseInfiniteScrollOptions {
  /**
   * 다음 페이지 로드 함수
   */
  fetchNextPage: () => void;
  /**
   * 다음 페이지 존재 여부
   */
  hasNextPage: boolean;
  /**
   * 다음 페이지 로딩 중 여부
   */
  isFetchingNextPage: boolean;
  /**
   * 스크롤 컨테이너 ref (없으면 window 사용)
   */
  scrollElement?: HTMLElement | null;
  /**
   * 스크롤 임계값 (하단에서 얼마나 떨어진 위치에서 로드할지, %)
   * @default 80
   */
  threshold?: number;
  /**
   * 활성화 여부
   * @default true
   */
  enabled?: boolean;
}

/**
 * 무한스크롤 훅
 *
 * 스크롤이 하단에 도달하면 자동으로 다음 페이지를 로드해요.
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useApiInfiniteQuery({ ... });
 *
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * useInfiniteScroll({
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   scrollElement: containerRef.current,
 * });
 * ```
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  scrollElement,
  threshold = 80,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        enabled
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const options: IntersectionObserverInit = {
      root: scrollElement || null,
      // 양수 rootMargin: 센티넬이 화면 아래 100px에 있어도 감지됨
      // 사용자가 끝까지 스크롤하기 전에 미리 다음 페이지 로드
      rootMargin: "100px",
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    const sentinel = sentinelRef.current;
    if (sentinel && observerRef.current) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current && sentinel) {
        observerRef.current.unobserve(sentinel);
      }
    };
  }, [handleIntersect, scrollElement, threshold, enabled]);

  return {
    sentinelRef,
  };
}
