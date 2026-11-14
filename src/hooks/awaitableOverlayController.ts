import type { AwaitableOverlayResult } from "./useAwaitableOverlay";

/** 한 번에 하나의 응답만 기다리고 이전 요청은 취소로 끝낸다. */
export function createAwaitableOverlayController<TResult>() {
  let resolver: ((result: AwaitableOverlayResult<TResult>) => void) | null =
    null;
  const settle = (result: AwaitableOverlayResult<TResult>): boolean => {
    if (!resolver) return false;
    const pending = resolver;
    resolver = null;
    pending(result);
    return true;
  };
  return {
    open(): Promise<AwaitableOverlayResult<TResult>> {
      settle({ type: "cancel" });
      return new Promise((resolve) => {
        resolver = resolve;
      });
    },
    settle,
  };
}
