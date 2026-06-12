import { useState, type ReactNode } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { motion, AnimatePresence } from "motion/react";

export interface PopoverProps {
  trigger: ReactNode;
  /**
   * 팝오버 내용. 함수로 주면 `close` 콜백을 주입받아 내부에서 팝오버를 닫을 수 있다
   * (예: 메뉴 항목 클릭 후 닫기). ReactNode를 그대로 줘도 된다.
   */
  content: ReactNode | ((close: () => void) => ReactNode);
  /** 배치 방향. floating-ui 기반이라 공간 부족 시 자동 flip된다. 기본 bottom. */
  placement?: "top" | "bottom" | "left" | "right";
  /** 열림/닫힘 변화 콜백. 호출처가 open 상태에 따라 폴링 등을 제어할 때 사용. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Popover — `@floating-ui/react` 기반.
 *
 * - **클릭 토글** + 외부 클릭/ESC 자동 닫힘(useDismiss)
 * - **자동 flip / shift**: 공간 부족하면 반대편으로, viewport 경계로 clamp
 * - **스크롤/resize 자동 추적**(autoUpdate)
 * - **Portal 렌더**: 부모 overflow:hidden에 잘리지 않음
 */
export function Popover({
  trigger,
  content,
  placement = "bottom",
  onOpenChange,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const close = () => handleOpenChange(false);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex cursor-pointer select-none"
      >
        {trigger}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="z-9999"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-border-tertiary dark:border-border-secondary p-4 min-w-60 max-w-[320px]">
                {typeof content === "function" ? content(close) : content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
