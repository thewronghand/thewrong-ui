import {
  FloatingFocusManager,
  FloatingPortal,
  type FloatingContext,
  type useInteractions,
} from "@floating-ui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useContext,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import {
  ModalFocusTrapContext,
  defaultModalFocusTrapContext,
} from "@/components/modal/ModalFocusTrapContext";
import { useBottomSheetDrag, useIsMobile, useScrollLock } from "@/hooks";

/** 명시된 설정이 없으면 Modal 안에서 popover로 표시한다. */
export function usePickerMobile(disableMobileSheet?: boolean) {
  const isMobile = useIsMobile();
  const modal = useContext(ModalFocusTrapContext);
  const disableSheet =
    disableMobileSheet ?? (modal !== defaultModalFocusTrapContext);
  return {
    isMobile,
    useSheet: isMobile && !disableSheet,
  };
}

interface PickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  useSheet: boolean;
  context: FloatingContext;
  setFloating: (node: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
  getFloatingProps: ReturnType<typeof useInteractions>["getFloatingProps"];
  desktopClassName: string;
  initialFocus?: number | RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** 피커의 floating 패널과 모바일 시트 표면. 내용과 선택 상태는 호출부가 소유한다. */
export function PickerSheet({
  isOpen,
  onClose,
  useSheet,
  context,
  setFloating,
  floatingStyles,
  getFloatingProps,
  desktopClassName,
  initialFocus = -1,
  children,
}: PickerSheetProps) {
  const reducedMotion = useReducedMotion();
  const { dragControls, handleDragEnd, startDrag } = useBottomSheetDrag({
    onDismiss: onClose,
  });
  useScrollLock(isOpen && useSheet);

  return (
    <FloatingPortal>
      {useSheet ? (
        <>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="picker-dimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="fixed inset-0 z-overlay bg-bg-overlay"
                onClick={onClose}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="picker-sheet"
                ref={setFloating}
                {...getFloatingProps()}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{
                  y: "100%",
                  transition: {
                    duration: reducedMotion ? 0 : 0.2,
                    ease: [0.4, 0, 1, 1],
                  },
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", damping: 30, stiffness: 320 }
                }
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={handleDragEnd}
                className="fixed inset-x-0 bottom-0 z-overlay flex flex-col gap-5 rounded-t-2xl bg-bg-surface text-fg-default p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-overlay"
              >
                <div
                  className="self-center h-1 w-10 rounded-full bg-bg-handle cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={startDrag}
                />
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        isOpen && (
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={initialFocus}
          >
            <div
              ref={setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              data-picker-panel=""
              className={desktopClassName}
            >
              {children}
            </div>
          </FloatingFocusManager>
        )
      )}
    </FloatingPortal>
  );
}
