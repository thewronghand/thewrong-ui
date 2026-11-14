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
  // 같은 이름의 라디오 그룹은 체크된 하나만 Tab 정지점이다. 체크된 것이 없으면 모두 남긴다.
  const isRadioStop = (element: HTMLElement) => {
    if (
      !(element instanceof HTMLInputElement) ||
      element.type !== "radio" ||
      !element.name ||
      element.checked
    )
      return true;
    const group = (element.form ?? document).querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${CSS.escape(element.name)}"]`,
    );
    return !Array.from(group).some(
      (radio) => radio.checked && radio.form === element.form,
    );
  };
  return elements
    .filter((element) => {
      const style = window.getComputedStyle(element);
      return (
        tabIndex(element) >= 0 &&
        isRadioStop(element) &&
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
      // Infinity - Infinity는 NaN이므로 같은 순서는 명시적으로 0을 돌려 DOM 순서를 유지한다.
      return aOrder === bOrder ? 0 : aOrder - bOrder;
    });
}

const FLOATING_PORTAL = "[data-floating-ui-portal]";
const MARKED_LAYER = "[data-focus-trap-layer]";
const FOCUS_GUARD = "[data-floating-ui-focus-guard]";
const MODAL_DIALOG = '[role="dialog"][aria-modal="true"]';
const MODIFIER_KEYS = ["Shift", "Alt", "Control", "Meta"];

function getFloatingLayers(
  container: HTMLElement,
  inScope: (element: Element) => boolean = () => true,
): HTMLElement[] {
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
      if (root === container && !inScope(reference)) continue;
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
  inScope: (element: Element) => boolean,
): HTMLElement | null {
  const roots = [container, ...getFloatingLayers(container, inScope)];
  for (const root of roots) {
    for (const reference of root.querySelectorAll<HTMLElement>(
      "[aria-controls]",
    )) {
      if (root === container && !inScope(reference)) continue;
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

type TrapScope = { parent: HTMLElement; covered: HTMLElement } | null;

export interface UseFocusTrapOptions {
  enabled: boolean;
  canTrap?: () => boolean;
  trapFocus?: boolean;
  cover?: HTMLElement | null;
}

/** 고리에서 `reference` 다음(backward면 이전) DOM 위치의 요소. 그 방향에 없으면 처음·끝으로 감는다. */
function stepFrom(
  ring: HTMLElement[],
  reference: Node,
  backward: boolean,
): HTMLElement | undefined {
  const bit = backward
    ? Node.DOCUMENT_POSITION_PRECEDING
    : Node.DOCUMENT_POSITION_FOLLOWING;
  const isTarget = (element: HTMLElement) =>
    element !== reference &&
    !!(reference.compareDocumentPosition(element) & bit);
  if (!backward) return ring.find(isTarget) ?? ring[0];
  for (let index = ring.length - 1; index >= 0; index--) {
    if (isTarget(ring[index])) return ring[index];
  }
  return ring[ring.length - 1];
}

/**
 * 열린 컨테이너 안에서 Tab 포커스를 순환하고 닫힐 때 이전 포커스를 복원한다.
 * Portal처럼 노드가 늦게 연결되면 `container`에 연결된 노드를 전달한다.
 * 열리면 첫 tabbable에 포커스한다. 이미 내부에 포커스가 있으면 유지하고, 대상이 없으면 컨테이너 자체에 포커스한다.
 * `canTrap`은 중첩 오버레이에서 현재 트랩이 Tab을 처리할 수 있는지 판정한다.
 * 닫힐 때 포커스가 컨테이너·부유 레이어 안이거나 body이면 열기 직전 요소로 복원하고,
 * 소비자가 배경의 다른 요소로 옮겨 둔 포커스는 그대로 둔다. 컨테이너가 부모 dialog 안에 있고
 * 열기 직전 요소가 그 부모 밖이면(부모와 함께 열린 서브뷰 등) 부모의 첫 tabbable로 복원한다.
 * `trapFocus`가 false여도 초기 포커스와 이 복원 규칙은 유지한다.
 * `cover`는 부모 dialog 시트의 일부만 덮는 서브뷰용이다. 덮는 요소를 전달하면 Tab 고리는
 * 부모 시트에서 덮인 영역을 뺀 나머지(헤더·footer 등)와 컨테이너를 DOM 순서로 잇는다.
 * 덮인 영역은 `cover`의 offsetParent(없으면 부모 요소)로 판정한다 — 절대 위치로 덮는 범위가
 * 곧 그 기준 요소이기 때문이다.
 * 부유 레이어는 `aria-controls`로 연결된 Floating UI 포털 또는 `data-focus-trap-layer`가
 * 붙은 포털만 인정한다. 연결을 알 수 없는 포털의 Tab은 컨테이너로 돌아오므로 해당 포털에
 * 표식을 붙이거나 `trapFocus: false`를 사용한다. 표식은 문서 전체에서 찾으므로 현재 트랩에
 * 편입할 포털에만 붙인다. `role="dialog"` + `aria-modal="true"`인 포털(서드파티 다이얼로그 등)은
 * 자기 트랩을 가진 별도 모달로 보고 표식이 있어도 편입하지 않는다 — 그 위에서 조작해야 하면
 * `trapFocus: false`를 사용한다.
 * 가드 없는 부유 레이어(Popover·표식 포털)는 트리거 바로 뒤가 아닌 컨테이너의
 * 모든 tabbable 뒤에 붙는다. 포털 DOM 위치와 무관하게 순환을 일정하게 하기 위해 트리거에서
 * Tab을 누르면 다음 필드로 가고, 패널은 한 바퀴의 마지막에 지난다. 열자마자 패널을 조작하려면
 * 패널 안으로 바로 포커스를 옮기는 컴포넌트나 Select·DatePicker처럼 floating-ui 포커스 관리가 있는 패널을 쓴다.
 * 액션 토스트가 top이면 트랩은 양보한다. 그동안에는 Tab이 컨테이너 밖으로 나갈 수 있다
 * (`backdrop: false` 알림성 토스트 포함).
 * Tab 이동으로 범위·편입 레이어·토스트 밖(배경, 서브뷰에 덮인 본문 등)에 떨어진 포커스는
 * 진행 방향의 다음 고리 요소로 되돌린다 — 라디오 그룹·스크롤 컨테이너처럼 브라우저의 Tab 순서를
 * 미리 알 수 없는 경로도 고리를 벗어나지 않게 하기 위해서다. Tab 키가 일으킨 이동(브라우저 UI로
 * 나갔다 키보드로 돌아오는 경우 포함)에만 반응하고, 클릭·터치, 다른 키, 프로그램 `focus()`로 옮긴
 * 포커스(Enter로 연 포털, 닫는 핸들러의 `focus()` 등)는 건드리지 않는다 — 연결·표식 없는 포털도
 * 클릭하면 조작할 수 있다. 그 포털을 Tab으로도 오가야 하면 표식을 붙인다.
 * 포커스가 있던 레이어나 토스트가 사라져 포커스가 body로 유실되면 연결 트리거, 컨테이너에서
 * 마지막으로 포커스됐던 요소, 컨테이너 첫 tabbable 순으로 되돌린다. 포커스 이동 도중에는
 * 잠시 body가 활성 요소가 되므로, 복구는 다음 태스크에서도 body일 때만 한다.
 *
 * @example
 * const [sheet, setSheet] = useState<HTMLDivElement | null>(null);
 * useFocusTrap(sheet, { enabled: open });
 * return <div ref={setSheet} tabIndex={-1}>...</div>;
 */
export function useFocusTrap(
  container: HTMLElement | null,
  { enabled, canTrap, trapFocus = true, cover }: UseFocusTrapOptions,
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
    // 컨테이너가 빠지면 함께 비워 분리된 시트 DOM을 다음 열림까지 쥐고 있지 않는다.
    // 닫힘 복원은 enabled cleanup에서 먼저 끝나므로 그 뒤에 비워도 된다.
    containerRef.current = container;
    parentDialogRef.current =
      container?.parentElement?.closest<HTMLElement>(MODAL_DIALOG) ?? null;
    // 열기 직전 요소도 닫힌 컨테이너가 사라질 때 놓는다. 열린 동안 컨테이너가 아직 없을 때는
    // 렌더 단계에서 기억한 값이므로 지우지 않는다.
    if (!container && !enabled) previousFocusRef.current = null;
  }, [container, enabled]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      // 여기서 비우지 않는다 — StrictMode(dev)의 이중 effect가 가짜 cleanup을 먼저 부르고
      // 렌더 단계 기억은 다시 돌지 않으므로, 비우면 실제로 닫힐 때 복원할 요소가 없다.
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

    const parentDialog =
      container.parentElement?.closest<HTMLElement>(MODAL_DIALOG) ?? null;
    const getScope = (): TrapScope => {
      if (!cover || !parentDialog?.isConnected || !parentDialog.contains(cover))
        return null;
      const offsetParent = cover.offsetParent;
      const covered =
        offsetParent instanceof HTMLElement && parentDialog.contains(offsetParent)
          ? offsetParent
          : cover.parentElement;
      return covered ? { parent: parentDialog, covered } : null;
    };
    // 컨테이너 또는 부모 시트에서 덮이지 않은 영역이면 트랩 범위다.
    const makeInScope = (scope: TrapScope) => (element: Element) =>
      container.contains(element) ||
      (!!scope &&
        scope.parent.contains(element) &&
        !scope.covered.contains(element));

    // Tab 고리: 범위 tabbable 뒤에 가드 없는 편입 레이어를 잇는다.
    const getRing = (
      scope: TrapScope,
      inScope: (element: Element) => boolean,
    ) => {
      const root = scope?.parent ?? container;
      const tabbables = scope
        ? getTabbableElements(root).filter(inScope)
        : getTabbableElements(container);
      const layers = getFloatingLayers(root, inScope);
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
      return { tabbables, layers, groups, ring: groups.flat() };
    };
    // Tab 키가 일으킨 포커스 이동인지와 그 방향. 브라우저의 Tab 이동은 keydown과 같은 태스크에서
    // 끝나므로 다음 태스크에 지운다 — 그 뒤의 프로그램 focus()는 Tab 이동으로 보지 않는다.
    let tabIntent: { backward: boolean } | null = null;
    // Tab으로 문서 밖(브라우저 UI)에 나갔다가 키보드로 돌아오는 중인지. 다른 입력이 있으면 지운다.
    let reentry = false;
    let redirecting = false;
    let intentTimer: ReturnType<typeof setTimeout> | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    const isTrapping = () =>
      container.isConnected && !(canTrapRef.current && !canTrapRef.current());
    const redirect = (element: HTMLElement) => {
      redirecting = true;
      try {
        element.focus({ preventScroll: true });
      } finally {
        redirecting = false;
      }
    };

    let lastContainerFocus =
      document.activeElement instanceof HTMLElement &&
      makeInScope(getScope())(document.activeElement)
        ? document.activeElement
        : null;
    let lostFocus: { element: HTMLElement; restore: HTMLElement | null } | null =
      null;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    const canFocus = (element: HTMLElement | null): element is HTMLElement =>
      !!element &&
      element.isConnected &&
      !element.matches(":disabled") &&
      element.getClientRects().length > 0;
    // 포커스된 레이어나 토스트가 제거되어 body로 유실된 경우만 복원한다.
    const observer = new MutationObserver(() => {
      if (!lostFocus || lostFocus.element.isConnected) return;
      const restore = lostFocus.restore;
      lostFocus = null;
      observer.disconnect();
      // focusout과 focusin 사이에는 activeElement가 잠시 body라 다음 태스크에서 다시 확인한다.
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        const active = document.activeElement;
        if (
          !container.isConnected ||
          (active && active !== document.body && active.isConnected) ||
          (canTrapRef.current && !canTrapRef.current())
        )
          return;
        const fallback =
          lastContainerFocus && makeInScope(getScope())(lastContainerFocus)
            ? lastContainerFocus
            : null;
        const target = [restore, fallback].find(canFocus);
        (target ?? getTabbableElements(container)[0] ?? container).focus({
          preventScroll: true,
        });
      });
    });
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      // 다른 focusin 처리 중에 포커스가 다시 옮겨졌으면 이 이벤트는 지난 상태다.
      if (!(target instanceof HTMLElement) || target !== document.activeElement)
        return;
      const scope = getScope();
      const inScope = makeInScope(scope);
      if (inScope(target)) {
        lastContainerFocus = target;
        lostFocus = null;
        if (document.hasFocus()) reentry = false;
      } else if (target.closest("[data-ui-action-toast]")) {
        lostFocus = { element: target, restore: lastContainerFocus };
      } else {
        const root = scope?.parent ?? container;
        const layer = getFloatingLayers(root, inScope).find((item) =>
          item.contains(target),
        );
        lostFocus = layer
          ? { element: target, restore: getLayerTrigger(root, layer, inScope) }
          : null;
        // Tab 이동이 범위·편입 레이어 밖(배경, 덮인 본문 등)에 떨어졌으면 고리로 되돌린다.
        // keydown 예측이 빗나가는 경로(라디오 그룹, 스크롤 컨테이너 등)를 여기서 받는다.
        if (!layer && (tabIntent || reentry) && !redirecting && isTrapping()) {
          // 문서 밖에서 돌아온 경우는 방향 대신 떨어진 위치로 판단한다(컨테이너 뒤면 역방향).
          const backward = tabIntent
            ? tabIntent.backward
            : !!(
                container.compareDocumentPosition(target) &
                Node.DOCUMENT_POSITION_FOLLOWING
              );
          reentry = false;
          const { ring } = getRing(scope, inScope);
          redirect(
            stepFrom(ring, target, backward) ?? lastContainerFocus ?? container,
          );
          return;
        }
      }
      if (lostFocus) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        observer.disconnect();
      }
    };
    document.addEventListener("focusin", handleFocusIn);

    // Tab이 문서 밖(브라우저 UI)으로 나가면 focusin이 없으므로 고리의 처음·끝에 포커스를 둔다.
    // 창 전환은 activeElement가 그대로라 건드리지 않는다. 제거로 인한 유실은 observer가 맡는다.
    const handleFocusOut = (event: FocusEvent) => {
      if (
        !tabIntent ||
        event.relatedTarget !== null ||
        !(event.target instanceof Node) ||
        !event.target.isConnected
      )
        return;
      const backward = tabIntent.backward;
      reentry = true;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        const active = document.activeElement;
        if (!reentry || (active && active !== document.body) || !isTrapping())
          return;
        const scope = getScope();
        const { ring } = getRing(scope, makeInScope(scope));
        redirect((backward ? ring[ring.length - 1] : ring[0]) ?? container);
      });
    };
    document.addEventListener("focusout", handleFocusOut);

    const trackKey = (event: KeyboardEvent) => {
      if (MODIFIER_KEYS.includes(event.key)) return;
      reentry = false;
      tabIntent =
        event.key === "Tab" && !event.ctrlKey && !event.metaKey
          ? { backward: event.shiftKey }
          : null;
      clearTimeout(intentTimer);
      if (tabIntent) {
        intentTimer = setTimeout(() => {
          tabIntent = null;
        });
      }
    };
    const clearIntent = () => {
      tabIntent = null;
      reentry = false;
    };
    // 안쪽 위젯이 전파를 멈춰도 입력 종류는 알아야 하므로 capture 단계에서 기록한다.
    document.addEventListener("keydown", trackKey, true);
    document.addEventListener("pointerdown", clearIntent, true);

    const handleKeyDown = (event: KeyboardEvent) => {
      // 안쪽 위젯이 Tab을 직접 처리했거나 Ctrl·Meta 조합(탭 전환 등)이면 관여하지 않는다.
      // Alt+Tab은 일반 Tab과 같이 다룬다 — macOS Safari의 Option+Tab은 모든 요소를 순회한다.
      if (
        event.key !== "Tab" ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        (canTrapRef.current && !canTrapRef.current())
      )
        return;

      const active = document.activeElement;
      const scope = getScope();
      const inScope = makeInScope(scope);
      const { tabbables, layers, groups, ring } = getRing(scope, inScope);
      const activeLayer = layers.find(
        (layer) => active && layer.contains(active),
      );
      const first = ring[0];
      const last = ring[ring.length - 1];

      if (activeLayer?.querySelector(FOCUS_GUARD)) {
        const root = scope?.parent ?? container;
        const layerItems = getTabbableElements(activeLayer, true);
        // 마지막 트리거 뒤에 다음 필드가 없으면 포털 가드가 포커스를 옮길 곳이 없다.
        if (
          !event.shiftKey &&
          first &&
          active === layerItems[layerItems.length - 1] &&
          getLayerTrigger(root, activeLayer, inScope) === last
        ) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
        return;
      }

      // 마지막 트리거의 포털 가드는 고리에서 제외되지만, 그 가드로 패널에 드나들어야 한다.
      // 경계에서 트랩이 곧장 처음/끝으로 감으면 floating-ui가 패널을 순회할 기회를 잃는다.
      if (
        first &&
        last &&
        ((!event.shiftKey && active === last) ||
          (event.shiftKey && active === first))
      ) {
        const root = scope?.parent ?? container;
        const layer = layers.find(
          (item) =>
            item.querySelector(FOCUS_GUARD) &&
            getLayerTrigger(root, item, inScope) === last,
        );
        const owner = layer?.id
          ? root.querySelector<HTMLElement>(
              `[aria-owns="${CSS.escape(layer.id)}"]`,
            )
          : null;
        const guard = event.shiftKey
          ? owner?.nextElementSibling
          : owner?.previousElementSibling;
        if (guard instanceof HTMLElement && guard.matches(FOCUS_GUARD)) {
          event.preventDefault();
          guard.focus({ preventScroll: true });
          return;
        }
      }

      // 덮인 영역이 고리 중간에 끼면 브라우저 기본 이동이 그리로 가므로 다음 범위 요소로 건너뛴다.
      if (scope && active instanceof HTMLElement) {
        const step = event.shiftKey ? -1 : 1;
        const all = getTabbableElements(scope.parent);
        const nativeNext = all[all.indexOf(active) + step];
        const index = tabbables.indexOf(active);
        const target = index >= 0 ? tabbables[index + step] : undefined;
        if (target && nativeNext && !inScope(nativeNext)) {
          event.preventDefault();
          target.focus({ preventScroll: true });
          return;
        }
      }

      if (!first || !last) {
        event.preventDefault();
        container.focus({ preventScroll: true });
      } else if (!(active && inScope(active)) && !activeLayer) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (
        active instanceof HTMLElement &&
        !active.shadowRoot &&
        !ring.includes(active)
      ) {
        // 범위 안이지만 고리에 없는 요소(컨테이너·부모 시트 자체, tabindex=-1 요소)는
        // 브라우저 기본 이동이 고리 밖으로 갈 수 있으므로 DOM 순서상 다음 고리 요소로 옮긴다.
        // shadow DOM 호스트는 내부 순서를 알 수 없어 기본 이동에 맡기고 focusin 폴백이 받는다.
        event.preventDefault();
        stepFrom(ring, active, event.shiftKey)?.focus({ preventScroll: true });
      } else {
        const groupIndex = groups.findIndex((group) =>
          group.some((element) => element === active),
        );
        const group = groups[groupIndex];
        if (event.shiftKey && active === group?.[0]) {
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
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("keydown", trackKey, true);
      document.removeEventListener("pointerdown", clearIntent, true);
      observer.disconnect();
      clearTimeout(restoreTimer);
      clearTimeout(leaveTimer);
      clearTimeout(intentTimer);
    };
  }, [container, enabled, trapFocus, cover]);
}
