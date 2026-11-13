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

function getTabbableElements(
  container: HTMLElement,
  floatingLayer = false,
): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  );
  if (floatingLayer && container.matches(TABBABLE_SELECTOR)) {
    elements.unshift(container);
  }
  // Floating UI가 포털 밖으로 나갈 때 저장한 원래 순서를 사용한다.
  const tabIndex = (element: HTMLElement) => {
    const original = floatingLayer ? element.getAttribute("data-tabindex") : null;
    if (original === null) return element.tabIndex;
    return original === "" ? 0 : Number(original);
  };
  return elements
    .filter((element) => {
      const style = window.getComputedStyle(element);
      return (
        tabIndex(element) >= 0 &&
        !element.matches(":disabled") &&
        !element.hasAttribute("data-floating-ui-focus-guard") &&
        !element.closest("[hidden], [inert], [aria-hidden='true']") &&
        style.visibility !== "hidden" &&
        style.visibility !== "collapse" &&
        element.getClientRects().length > 0
      );
    })
    .sort((a, b) => {
      const aOrder = tabIndex(a) > 0 ? tabIndex(a) : Infinity;
      const bOrder = tabIndex(b) > 0 ? tabIndex(b) : Infinity;
      return aOrder - bOrder;
    });
}

const FLOATING_PORTAL = "[data-floating-ui-portal]";
const MARKED_LAYER = "[data-focus-trap-layer]";
const FOCUS_GUARD = "[data-floating-ui-focus-guard]";
const MODAL_DIALOG = '[role="dialog"][aria-modal="true"]';

function getFloatingLayers(container: HTMLElement): HTMLElement[] {
  const layers: HTMLElement[] = [];
  const roots: HTMLElement[] = [container];

  for (const layer of document.querySelectorAll<HTMLElement>(MARKED_LAYER)) {
    if (!layer.closest(MODAL_DIALOG) && !layer.querySelector(MODAL_DIALOG)) {
      layers.push(layer);
      roots.push(layer);
    }
  }
  // 트리거의 aria-controls로 현재 시트에서 연 포털만 연결한다.
  for (const root of roots) {
    for (const reference of root.querySelectorAll<HTMLElement>(
      "[aria-controls]",
    )) {
      for (const id of (reference.getAttribute("aria-controls") ?? "").split(
        /\s+/,
      )) {
        const panel = document.getElementById(id);
        const portal = panel?.closest<HTMLElement>(FLOATING_PORTAL);
        if (
          portal &&
          !layers.includes(portal) &&
          !portal.closest(MODAL_DIALOG) &&
          !portal.querySelector(MODAL_DIALOG)
        ) {
          layers.push(portal);
          roots.push(portal);
        }
      }
    }
  }
  return layers.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

function getLayerTrigger(
  container: HTMLElement,
  layer: HTMLElement,
): HTMLElement | null {
  const roots = [container, ...getFloatingLayers(container)];
  for (const root of roots) {
    for (const reference of root.querySelectorAll<HTMLElement>(
      "[aria-controls]",
    )) {
      const ids = (reference.getAttribute("aria-controls") ?? "").split(/\s+/);
      if (
        ids.some(
          (id) => document.getElementById(id)?.closest(FLOATING_PORTAL) === layer,
        )
      ) {
        return reference.tabIndex >= 0
          ? reference
          : getTabbableElements(reference)[0] ?? null;
      }
    }
  }
  return null;
}

function isFloatingLayer(element: Element): boolean {
  const portal = element.closest(`${FLOATING_PORTAL}, ${MARKED_LAYER}`);
  return !!(
    element.closest("[data-ui-action-toast]") ||
    (portal && !element.closest(MODAL_DIALOG))
  );
}

/**
 * 열린 컨테이너 안에서 Tab 포커스를 순환하고 닫힐 때 이전 포커스를 복원한다.
 * Portal처럼 노드가 늦게 연결되면 `container`에 연결된 노드를 전달한다.
 * 이미 내부에 포커스가 있으면 유지하고, 대상이 없으면 컨테이너 자체에 포커스한다.
 * 열리면 첫 tabbable(제목과 활성 닫기 버튼이 있으면 닫기 버튼)에 포커스하며, 다른 필드는 `autoFocus`를 준다.
 * `canTrap`은 중첩 오버레이에서 현재 트랩이 Tab을 처리할 수 있는지 판정한다.
 * `trapFocus`가 false여도 열릴 때의 초기 포커스와 닫힐 때의 이전 포커스 복원은 유지한다.
 * 부유 레이어는 `aria-controls`로 연결된 Floating UI 포털 또는 `data-focus-trap-layer`가
 * 붙은 포털만 인정한다. 연결을 알 수 없는 포털의 Tab은 컨테이너로 돌아오므로 해당 포털에
 * 표식을 붙이거나 `trapFocus: false`를 사용한다. 액션 토스트가 top이면 트랩은 양보한다.
 * 표식은 문서 전체에서 찾으므로 현재 트랩에 편입할 포털에만 붙인다.
 *
 * @example
 * const [sheet, setSheet] = useState<HTMLDivElement | null>(null);
 * useFocusTrap(sheet, { enabled: open });
 * return <div ref={setSheet} tabIndex={-1}>...</div>;
 */
export function useFocusTrap(
  container: HTMLElement | null,
  {
    enabled,
    canTrap,
    trapFocus = true,
  }: {
    enabled: boolean;
    canTrap?: () => boolean;
    trapFocus?: boolean;
  },
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const parentDialogRef = useRef<HTMLElement | null>(null);
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
    if (container) {
      containerRef.current = container;
      parentDialogRef.current =
        container.parentElement?.closest<HTMLElement>(MODAL_DIALOG) ?? null;
    }
  }, [container]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      const previous = previousFocusRef.current;
      const active = document.activeElement;
      const current = containerRef.current;
      if (
        active &&
        active !== document.body &&
        active.isConnected &&
        !current?.contains(active) &&
        !isFloatingLayer(active)
      ) {
        return;
      }

      const parentDialog = parentDialogRef.current;
      if (
        parentDialog?.isConnected &&
        (!previous?.isConnected || !parentDialog.contains(previous))
      ) {
        const first = getTabbableElements(parentDialog).find(
          (element) => !current?.contains(element),
        );
        (first ?? parentDialog).focus({ preventScroll: true });
      } else if (previous?.isConnected) {
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
  }, [container, enabled]);

  useEffect(() => {
    if (!enabled || !container || !trapFocus) return;

    let lastContainerFocus =
      container.contains(document.activeElement) &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    let lostFocus: { element: HTMLElement; restore: HTMLElement | null } | null =
      null;
    // 포커스된 레이어나 토스트가 제거되어 body로 유실된 경우만 복원한다.
    const observer = new MutationObserver(() => {
      if (
        lostFocus &&
        !lostFocus.element.isConnected &&
        document.activeElement === document.body &&
        (!canTrapRef.current || canTrapRef.current())
      ) {
        const restore = lostFocus.restore;
        lostFocus = null;
        observer.disconnect();
        if (
          restore?.isConnected &&
          !restore.matches(":disabled") &&
          restore.getClientRects().length
        ) {
          restore.focus({ preventScroll: true });
        }
      }
    });
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (container.contains(target)) {
        lastContainerFocus = target;
        lostFocus = null;
      } else if (target.closest("[data-ui-action-toast]")) {
        lostFocus = { element: target, restore: lastContainerFocus };
      } else {
        const layer = getFloatingLayers(container).find((item) =>
          item.contains(target),
        );
        lostFocus = layer
          ? { element: target, restore: getLayerTrigger(container, layer) }
          : null;
      }
      if (lostFocus?.restore) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        observer.disconnect();
      }
    };
    document.addEventListener("focusin", handleFocusIn);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || (canTrapRef.current && !canTrapRef.current()))
        return;

      const active = document.activeElement;
      const tabbables = getTabbableElements(container);
      const layers = getFloatingLayers(container);
      const activeLayer = layers.find(
        (layer) => active && layer.contains(active),
      );
      if (activeLayer?.querySelector(FOCUS_GUARD)) return;

      const groups = [tabbables];
      const seen = new Set(tabbables);
      for (const layer of layers) {
        if (layer.querySelector(FOCUS_GUARD)) continue;
        const elements = getTabbableElements(layer, true).filter((element) => {
          if (seen.has(element)) return false;
          seen.add(element);
          return true;
        });
        if (elements.length) groups.push(elements);
      }
      const ring = groups.flat();
      const first = ring[0];
      const last = ring[ring.length - 1];

      if (!first || !last) {
        event.preventDefault();
        container.focus({ preventScroll: true });
      } else if (!container.contains(active) && !activeLayer) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else {
        const groupIndex = groups.findIndex((group) =>
          group.some((element) => element === active),
        );
        const group = groups[groupIndex];
        if (event.shiftKey && (active === container || active === group?.[0])) {
          event.preventDefault();
          const previous =
            groups[(groupIndex <= 0 ? groups.length : groupIndex) - 1];
          (previous[previous.length - 1] ?? last).focus({ preventScroll: true });
        } else if (!event.shiftKey && active === group?.[group.length - 1]) {
          event.preventDefault();
          const next = groups[(groupIndex + 1) % groups.length];
          (next[0] ?? first).focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      observer.disconnect();
    };
  }, [container, enabled, trapFocus]);
}
