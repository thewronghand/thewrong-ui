import { useEffect, useId } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  type PanInfo,
} from "motion/react";

import { overlayStack } from "@/lib/overlay-stack";
import { Portal } from "@/lib/Portal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 데스크탑(sm+) 드로어 폭(px). 기본 480. 모바일은 무관 (바텀시트). */
  widthPx?: number;
  /**
   * 시트(패널) 루트에 병합되는 클래스. 인스턴스별로 배경·여백 등을 덮을 때 쓴다.
   * `cn`(tailwind-merge)으로 병합되어 같은 속성은 이 값이 이긴다. 백드롭에는 적용되지 않는다.
   */
  className?: string;
  children: React.ReactNode;
}

/**
 * 데스크탑(`sm`+)에서는 화면 우측에서 슬라이드 인 하는 사이드 드로어,
 * 모바일에서는 화면 하단에서 올라오는 bottom-sheet으로 동작.
 *
 * 모바일 분기·드래그-다운 닫기·바텀시트 하단 틈 방지 패턴은 Modal과 동일.
 *
 * **레이어드 오버레이**: ESC/백드롭은 `overlayStack`에서 자신이 top일 때만 반응한다.
 * ActionToast가 위에 떠 있으면(priority) 자동으로 양보된다.
 */
export function Drawer({
  open,
  onClose,
  title,
  widthPx = 480,
  className,
  children,
}: DrawerProps) {
  const isMobile = useIsMobile();
  const desktopStyle: React.CSSProperties = { width: widthPx, maxWidth: "100vw" };

  const overlayId = useId();
  const dragControls = useDragControls();

  // 모바일 바텀시트 스와이프-다운 닫기. 100px 이상 끌거나 빠르게 튕기면 close.
  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    overlayStack.push(overlayId);
    document.body.style.overflow = "hidden";
    return () => {
      overlayStack.pop(overlayId);
      // 마지막 오버레이가 닫힐 때만 body lock 해제. 레이어드 시 안쪽 닫혀도 바깥 lock 유지.
      if (overlayStack.isEmpty()) {
        document.body.style.overflow = "";
      }
    };
  }, [open, overlayId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 가장 위 오버레이만 처리. ActionToast가 떠 있으면 그게 top(priority)이라 자동 양보.
      if (!overlayStack.isTop(overlayId)) return;
      onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, overlayId]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              // 자신이 top일 때만 닫힘. ActionToast가 위에 있으면 그쪽이 백드롭을 받는다.
              if (!overlayStack.isTop(overlayId)) return;
              onClose();
            }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer-sheet"
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={
              isMobile
                ? {
                    y: "100%",
                    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                  }
                : { x: "100%" }
            }
            transition={
              isMobile
                ? // damping 38(임계감쇠 이상)로 오버슈트 제거 — 진입 시 시트가 목표를 지나쳐
                  // 들렸다 돌아오며 하단에 백드롭이 비치는 현상 방지. (Modal과 동일 정책)
                  { type: "spring", damping: 38, stiffness: 320 }
                : { type: "spring", damping: 30, stiffness: 280 }
            }
            // 모바일에서만 스와이프-다운 닫기. 핸들 영역에서만 드래그 시작(콘텐츠 스크롤과 충돌 방지).
            drag={isMobile ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            // 모바일 바텀시트 하단 틈 방지: 시트를 화면 바닥보다 32px 아래에서 시작(-bottom-8)하고
            // 같은 양만큼 하단 패딩(pb-8)을 줘 오버슈트/드래그 시에도 바닥 틈을 메운다. (Modal과 동일)
            className={cn(
              "fixed z-50 flex flex-col overflow-x-hidden bg-bg-white dark:bg-neutral-800 -bottom-8 left-0 right-0 max-h-[88vh] w-full rounded-t-2xl pb-8 sm:bottom-0 sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:h-full sm:w-auto sm:rounded-none sm:pb-0",
              className,
            )}
            style={!isMobile ? desktopStyle : undefined}
          >
            <div
              className="flex justify-center pt-2 pb-1 cursor-grab touch-none active:cursor-grabbing sm:hidden"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {title && (
              <div className="flex items-center justify-between border-b border-border-tertiary px-4 py-3 dark:border-neutral-700">
                <h3 className="text-base font-semibold text-text-primary sm:text-lg dark:text-white">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded p-1 text-text-tertiary hover:text-text-secondary dark:hover:text-neutral-300"
                  aria-label="닫기"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
