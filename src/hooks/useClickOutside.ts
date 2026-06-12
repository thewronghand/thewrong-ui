import { useEffect, type RefObject } from "react";

/**
 * 외부 클릭 감지 훅
 *
 * 특정 요소 외부를 클릭했을 때 핸들러를 실행해요.
 * 모달, 드롭다운, 사이드바 등에서 사용할 수 있어요.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => {
 *   console.log("외부 클릭됨");
 * });
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // ref가 없거나, 클릭한 요소가 ref 내부에 있으면 무시
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      handler(event);
    };

    // mousedown과 touchstart 이벤트 모두 처리 (모바일 지원)
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [ref, handler, enabled]);
}
