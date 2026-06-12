/**
 * 동시에 열린 dismissable 오버레이(Modal / Drawer / ActionToast 등) ID 스택.
 *
 * ESC 키 입력 시 가장 마지막에 열린(top) 오버레이만 닫혀야 자연스럽다.
 * 모든 listener가 keydown을 받으면 바깥/안쪽 모달이 동시에 닫혀버리는 문제를 해결한다.
 *
 * 백드롭 클릭은 z-index 또는 DOM 마운트 순서로 자연스럽게 가장 위 백드롭이 클릭을 받기 때문에
 * 별도 처리가 필요 없다.
 *
 * **우선순위(priority)**: ActionToast처럼 "다른 모든 오버레이보다 항상 위"여야 하는 것은
 * 높은 priority로 push한다. priority가 같으면 push 순서(나중이 위)로 top을 정한다.
 * 이 덕분에 Modal/Drawer는 ActionToast의 존재를 직접 알 필요 없이 `isTop` 가드만으로
 * "토스트가 떠 있으면 ESC를 양보"하는 동작이 자동으로 성립한다(레이어드 모달 회피).
 */
interface OverlayEntry {
  id: string;
  priority: number;
}

const stack: OverlayEntry[] = [];

/** top = priority가 가장 높은 것 중 가장 나중에 push된 것. */
function topEntry(): OverlayEntry | undefined {
  if (stack.length === 0) return undefined;
  let top = stack[0];
  for (const entry of stack) {
    // priority가 더 높거나, 같으면 더 나중(뒤)에 온 것이 top.
    if (entry.priority >= top.priority) top = entry;
  }
  return top;
}

export const overlayStack = {
  /**
   * @param id 오버레이 식별자
   * @param priority 높을수록 위. 기본 0. ActionToast 등 항상 최상위가 필요한 것은 양수로.
   */
  push(id: string, priority = 0) {
    // StrictMode 더블 마운트나 useEffect 재실행 등으로 같은 ID가 두 번 push되면 pop이 한 쪽만
    // 제거해 스택이 영구적으로 어긋남. 중복 등록 자체를 막아 idempotent하게.
    if (stack.some((e) => e.id === id)) return;
    stack.push({ id, priority });
  },
  pop(id: string) {
    const idx = stack.map((e) => e.id).lastIndexOf(id);
    if (idx >= 0) stack.splice(idx, 1);
  },
  isTop(id: string): boolean {
    return topEntry()?.id === id;
  },
  isEmpty(): boolean {
    return stack.length === 0;
  },
};

/** ActionToast가 overlayStack에 자신을 등록할 때 쓰는 고정 ID / 우선순위. */
export const ACTION_TOAST_OVERLAY_ID = "action-toast-overlay";
export const ACTION_TOAST_PRIORITY = 1000;
