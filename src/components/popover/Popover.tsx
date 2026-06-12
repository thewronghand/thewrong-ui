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
  /**
   * 팝오버를 여는 트리거. **비대화형 노드(텍스트·아이콘·span 등)를 권장한다.**
   * 래퍼 span이 `role="button"` + `tabIndex`로 버튼 시맨틱과 키보드 포커스를 부여하기 때문에,
   * 이미 대화형인 요소(`<button>`/`<a>`)를 넘기면 포커스가 중첩되고 role이 겹친다.
   * 대화형 트리거가 꼭 필요하면 그 요소를 직접 쓰지 말고 비대화형 콘텐츠로 감싸 전달할 것.
   */
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
      {/* 트리거 래퍼 — 임의 ReactNode를 받으므로 span으로 감싼다.
          키보드 사용자가 포커스/Enter/Space로 열 수 있도록 tabIndex+role 부여.
          (useClick의 keyboardHandlers가 focusable한 reference에서 Enter/Space를 click으로 발화) */}
      <span
        ref={refs.setReference}
        tabIndex={0}
        role="button"
        {...getReferenceProps()}
        className="inline-flex cursor-pointer select-none"
      >
        {trigger}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            // 바깥 div: floating-ui가 위치(position/transform) 담당.
            // 안쪽 motion.div: scale/opacity 애니메이션 담당.
            // 한 요소에 둘을 합치면 motion이 floating-ui의 transform을 덮어써 위치가 (0,0)으로 깨진다.
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-9999"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-border-tertiary dark:border-border-secondary p-4 min-w-60 max-w-[320px]"
              >
                {typeof content === "function" ? content(close) : content}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
