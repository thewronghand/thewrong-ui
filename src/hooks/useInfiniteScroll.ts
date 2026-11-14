import { useCallback, useEffect, useRef, type RefObject } from "react";

interface CommonOptions {
  /** 감지 활성 여부. 기본 true. */
  enabled?: boolean;
  /** 경계보다 일찍 감지할 거리(px). 새 API의 기본값은 120, 기존 API는 100. */
  rootMarginPx?: number;
}

/** 콜백과 스크롤 컨테이너 ref를 받는 범용 옵션. */
export interface InfiniteScrollOptions extends CommonOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isFetching: boolean;
  /** 없거나 current가 null이면 뷰포트에서 감지한다. */
  scrollElementRef?: RefObject<HTMLElement | null>;
}

/** 기존 테이블 사용자와 호환되는 옵션. */
export interface LegacyInfiniteScrollOptions extends CommonOptions {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  scrollElement?: HTMLElement | null;
  /** 기존 API에서 실제로 사용되지 않았던 값. 선제 감지는 rootMarginPx를 쓴다. */
  threshold?: number;
}

export type UseInfiniteScrollOptions =
  | InfiniteScrollOptions
  | LegacyInfiniteScrollOptions;
export interface UseInfiniteScrollReturn {
  /** 스크롤 영역 끝에 렌더할 감지 요소의 ref. */
  sentinelRef: RefObject<HTMLDivElement | null>;
}

/**
 * IntersectionObserver로 스크롤 끝의 sentinel을 감지해 다음 데이터를 요청한다.
 * sentinel을 실제 스크롤 영역 끝에 렌더해야 감지되며, ref가 없으면 감시가 시작되지 않는다.
 * 컨테이너를 쓰면 scrollElementRef를 지정하고, 뷰포트 스크롤이면 생략한다.
 */
export function useInfiniteScroll(
  options: UseInfiniteScrollOptions,
): UseInfiniteScrollReturn {
  const isModern = "onLoadMore" in options;
  const onLoadMore = isModern ? options.onLoadMore : options.fetchNextPage;
  const hasMore = isModern ? options.hasMore : options.hasNextPage;
  const isFetching = isModern ? options.isFetching : options.isFetchingNextPage;
  const rootRef = isModern ? options.scrollElementRef : undefined;
  const rootElement = isModern ? undefined : options.scrollElement;
  const rootMarginPx = options.rootMarginPx ?? (isModern ? 120 : 100);
  const enabled = options.enabled ?? true;
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isFetching && enabled)
        onLoadMore();
    },
    [onLoadMore, hasMore, isFetching, enabled],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !hasMore || !sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, {
      root: rootRef?.current ?? rootElement ?? null,
      rootMargin: `${rootMarginPx}px`,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, rootRef, rootElement, rootMarginPx, enabled, hasMore]);

  return { sentinelRef };
}
