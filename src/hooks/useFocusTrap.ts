import { useEffect, useRef } from "react";

const TABBABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "iframe",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

function getTabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR))
    .filter((element) => {
      const style = window.getComputedStyle(element);
      return (
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        !element.hasAttribute("data-floating-ui-focus-guard") &&
        !element.closest("[hidden], [inert], [aria-hidden='true']") &&
        style.visibility !== "hidden" &&
        style.visibility !== "collapse" &&
        element.getClientRects().length > 0
      );
    })
    .sort((a, b) => {
      const aOrder = a.tabIndex > 0 ? a.tabIndex : Infinity;
      const bOrder = b.tabIndex > 0 ? b.tabIndex : Infinity;
      return aOrder - bOrder;
    });
}

/**
 * 열린 컨테이너 안에서 Tab 포커스를 순환하고 닫힐 때 이전 포커스를 복원한다.
 * Portal처럼 노드가 늦게 연결되면 `container`에 연결된 노드를 전달한다.
 * 이미 내부에 포커스가 있으면 유지하고, 대상이 없으면 컨테이너 자체에 포커스한다.
 * `canTrap`은 중첩 오버레이에서 현재 트랩이 Tab을 처리할 수 있는지 판정한다.
 *
 * @example
 * const [sheet, setSheet] = useState<HTMLDivElement | null>(null);
 * useFocusTrap(sheet, { enabled: open });
 * return <div ref={setSheet} tabIndex={-1}>...</div>;
 */
export function useFocusTrap(
  container: HTMLElement | null,
  { enabled, canTrap }: { enabled: boolean; canTrap?: () => boolean },
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const wasEnabledRef = useRef(false);
  const canTrapRef = useRef(canTrap);
  canTrapRef.current = canTrap;

  // 자식의 autoFocus가 커밋 중 실행되기 전에 열기 직전 포커스를 기억한다.
  if (enabled && !wasEnabledRef.current && typeof document !== "undefined") {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  wasEnabledRef.current = enabled;

  useEffect(() => {
    if (container) containerRef.current = container;
  }, [container]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      const previous = previousFocusRef.current;
      const active = document.activeElement;
      if (
        previous?.isConnected &&
        (!active || active === document.body || containerRef.current?.contains(active))
      ) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !container) return;

    if (!container.contains(document.activeElement)) {
      const first = getTabbableElements(container)[0];
      if (first) {
        first.focus({ preventScroll: true });
      } else {
        if (!container.hasAttribute("tabindex")) container.tabIndex = -1;
        container.focus({ preventScroll: true });
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || (canTrapRef.current && !canTrapRef.current()))
        return;

      const active = document.activeElement;
      if (active && active !== document.body && !container.contains(active))
        return;

      const tabbables = getTabbableElements(container);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (!first || !last) {
        event.preventDefault();
        container.focus({ preventScroll: true });
      } else if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === container)
      ) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [container, enabled]);
}
