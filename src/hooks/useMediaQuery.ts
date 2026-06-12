import { useEffect, useState } from "react";

/**
 * 미디어 쿼리 매칭 여부를 추적하는 훅.
 *
 * SSR 안전: window가 없으면 false 반환.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 639px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/**
 * Tailwind sm 브레이크포인트(640px) 미만 여부.
 * 모바일 분기에 일관되게 사용.
 */
export const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
