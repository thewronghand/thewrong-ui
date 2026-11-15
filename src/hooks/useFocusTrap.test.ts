import { afterEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", () => ({
  useRef: (value: unknown) => ({ current: value }),
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
}));

import { useFocusTrap } from "./useFocusTrap";

class FocusElement {
  isConnected = true;
  tabIndex = 0;
  disabled = false;
  hidden = false;
  noRect = false;
  children: FocusElement[] = [];
  parentElement: FocusElement | null = null;
  contains(element: FocusElement) { return this === element || this.children.includes(element); }
  matches(selector: string) { return selector === ":disabled" && this.disabled; }
  closest() { return this.hidden ? this : null; }
  getClientRects() { return this.hidden || this.noRect ? [] : [{}]; }
  hasAttribute() { return false; }
  querySelectorAll() { return this.children; }
  focus() { Object.assign(document, { activeElement: this }); }
}

function setup() {
  const opener = new FocusElement();
  const container = new FocusElement();
  const close = new FocusElement();
  const action = new FocusElement();
  container.children = [close, action];
  vi.stubGlobal("HTMLElement", FocusElement);
  vi.stubGlobal("HTMLInputElement", class extends FocusElement {});
  vi.stubGlobal("document", { activeElement: opener, body: new FocusElement() });
  vi.stubGlobal("window", { getComputedStyle: () => ({ visibility: "visible" }) });
  return { opener, container, close, action };
}

function runInitialEffects() {
  effects[0]?.();
  const cleanup = effects[1]?.();
  effects[2]?.();
  return cleanup;
}

afterEach(() => { effects.length = 0; vi.unstubAllGlobals(); });

describe("포커스 트랩 초기 포커스", () => {
  it("지정한 내부 대상에 포커스하고 닫을 때 열기 전 요소로 복원한다", () => {
    const { opener, container, action } = setup();
    useFocusTrap(container as unknown as HTMLElement, {
      enabled: true,
      initialFocus: { current: action as unknown as HTMLElement },
    });
    const cleanup = runInitialEffects();
    expect(document.activeElement === (action as unknown as Element)).toBe(true);
    cleanup?.();
    expect(document.activeElement === (opener as unknown as Element)).toBe(true);
  });

  it.each([null, "disabled", "outside"] as const)("%s 대상은 기존 첫 요소로 되돌린다", (target) => {
    const { container, close, action } = setup();
    action.disabled = target === "disabled";
    const element = target === "outside" ? new FocusElement() : target ? action : null;
    useFocusTrap(container as unknown as HTMLElement, {
      enabled: true,
      initialFocus: { current: element as unknown as HTMLElement | null },
    });
    runInitialEffects();
    expect(document.activeElement === (close as unknown as Element)).toBe(true);
  });

  it("상위 레이어가 포커스를 소유하면 지정 대상으로 빼앗지 않는다", () => {
    const { container, close, action } = setup();
    Object.assign(document, { activeElement: close });
    useFocusTrap(container as unknown as HTMLElement, {
      enabled: true,
      canTrap: () => false,
      initialFocus: { current: action as unknown as HTMLElement },
    });
    runInitialEffects();
    expect(document.activeElement === (close as unknown as Element)).toBe(true);
  });

  it("레이아웃 상자가 없는 initialFocus는 건너뛴다", () => {
    const { container, close, action } = setup();
    action.noRect = true;
    useFocusTrap(container as unknown as HTMLElement, {
      enabled: true,
      initialFocus: { current: action as unknown as HTMLElement },
    });
    runInitialEffects();
    expect(document.activeElement === (close as unknown as Element)).toBe(true);
  });

  it("첫 tabbable도 레이아웃 상자가 없으면 건너뛴다", () => {
    const { container, close, action } = setup();
    close.noRect = true;
    useFocusTrap(container as unknown as HTMLElement, { enabled: true });
    runInitialEffects();
    expect(document.activeElement === (action as unknown as Element)).toBe(true);
  });
});
