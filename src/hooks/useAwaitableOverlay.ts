import { useCallback, useEffect, useRef, useState } from "react";
import { createAwaitableOverlayController } from "./awaitableOverlayController";

export type AwaitableOverlayResult<TResult = void> =
  { type: "confirm"; value: TResult } | { type: "cancel" };

/**
 * 오버레이 응답을 Promise로 기다린다. 내용과 표시 방식은 호출부가 관리한다.
 * 중복 open과 언마운트는 이전 요청을 cancel로 완료한다. ESC·백드롭 등 모든 닫기 경로에서
 * settle({ type: "cancel" })을 호출해야 열린 Promise가 남지 않는다.
 */
export function useAwaitableOverlay<TResult = void>(): {
  isOpen: boolean;
  open: () => Promise<AwaitableOverlayResult<TResult>>;
  settle: (result: AwaitableOverlayResult<TResult>) => void;
} {
  const [isOpen, setIsOpen] = useState(false);
  const controllerRef = useRef<ReturnType<
    typeof createAwaitableOverlayController<TResult>
  > | null>(null);
  if (!controllerRef.current)
    controllerRef.current = createAwaitableOverlayController<TResult>();
  const controller = controllerRef.current;

  useEffect(
    () => () => {
      controller.settle({ type: "cancel" });
    },
    [controller],
  );
  const open = useCallback(() => {
    const result = controller.open();
    setIsOpen(true);
    return result;
  }, [controller]);
  const settle = useCallback(
    (result: AwaitableOverlayResult<TResult>) => {
      if (controller.settle(result)) setIsOpen(false);
    },
    [controller],
  );
  return { isOpen, open, settle };
}
