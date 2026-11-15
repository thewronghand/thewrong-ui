import {
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "motion/react";

import { overlayStack } from "@/lib/overlay-stack";
import { Portal } from "@/lib/Portal";
import { cn } from "@/lib/utils";
import { useFocusTrap, useIsMobile, useScrollLock } from "@/hooks";
import {
  ModalFocusTrapContext,
  useModalSubViews,
} from "@/components/modal/ModalFocusTrapContext";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 열릴 때 우선 포커스할 드로어 내부 요소. 없거나 포커스할 수 없으면 기존 규칙을 따른다. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** 설명할 요소의 id. 기본은 연결하지 않으며 서브뷰가 열린 동안에는 해제한다. */
  describedBy?: string;
  /** false면 ESC, 백드롭, 닫기 버튼과 바텀시트 드래그로 닫히지 않는다. @default true */
  dismissible?: boolean;
  /**
   * false면 Tab 가두기, 배경 포커스 복귀와 레이어·토스트 제거로 body에 유실된 포커스 복구를 끈다.
   * 초기 포커스와 닫힐 때의 복원 규칙은 유지한다 —
   * 닫는 시점에 포커스가 시트·부유 레이어 안이거나 body이면 열기 직전 요소로 복원하고,
   * 소비자가 배경의 다른 요소로 옮겨 둔 포커스는 그대로 둔다.
   * 안에 둔 ModalSubView에도 같은 설정이 적용된다. @default true
   */
  trapFocus?: boolean;
  /** 닫힘 모션이 끝난 뒤 호출한다. open을 false로 바꾸지 않고 컴포넌트를 언마운트하면 호출되지 않는다. */
  onExitComplete?: () => void;
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
 * 열리면 `initialFocus`를 우선하며, 미지정 시 기존 autoFocus 또는 첫 tabbable에 포커스한다.
 *
 * 모바일 분기·드래그-다운 닫기·바텀시트 하단 틈 방지 패턴은 Modal과 동일.
 *
 * **레이어드 오버레이**: ESC/백드롭은 `overlayStack`에서 자신이 top일 때만 반응한다.
 * ActionToast나 열린 ModalSubView가 위에 떠 있으면 자동으로 양보된다.
 *
 * **포커스 트랩**: `aria-controls`로 연결된 Floating UI 포털 또는 `data-focus-trap-layer`가
 * 붙은 포털만 부유 레이어로 인정한다. 연결을 알 수 없는 포털의 Tab은 드로어로 돌아오므로
 * 해당 포털에 표식을 붙이거나 `trapFocus={false}`를 사용한다. 표식은 문서 전체에서 찾으므로
 * 현재 트랩에 편입할 포털에만 붙인다. `role="dialog"` + `aria-modal="true"`인 포털(서드파티
 * 다이얼로그 등)은 표식이 있어도 편입하지 않으므로 `trapFocus={false}`를 사용한다.
 * 액션 토스트가 top이면 트랩은 양보하며, 그동안에는 Tab이 드로어 밖으로 나갈 수 있다
 * (`backdrop: false` 알림성 토스트 포함). Tab으로 드로어 밖에 떨어진 포커스는 고리로 되돌리고,
 * 마우스로 옮긴 포커스는 건드리지 않는다.
 */
export function Drawer({
  open,
  onClose,
  title,
  initialFocus,
  describedBy,
  dismissible = true,
  trapFocus = true,
  onExitComplete,
  widthPx = 480,
  className,
  children,
}: DrawerProps) {
  const isMobile = useIsMobile();
  const desktopStyle: React.CSSProperties = {
    width: widthPx,
    maxWidth: "100vw",
  };

  const overlayId = useId();
  const titleId = useId();
  const dragControls = useDragControls();
  const prefersReducedMotion = useReducedMotion();
  const [sheet, setSheet] = useState<HTMLDivElement | null>(null);
  const { context, isTop, hasOpenSubView } = useModalSubViews(
    open,
    trapFocus,
    overlayId,
  );

  // 퇴장 모션으로 남은 시트가 브라우저의 기본 Tab 순서에 다시 들어가지 않게 한다.
  useLayoutEffect(() => {
    if (sheet) sheet.inert = !open;
  }, [sheet, open]);

  // 모바일 바텀시트 스와이프-다운 닫기. 100px 이상 끌거나 빠르게 튕기면 close.
  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (dismissible && (info.offset.y > 100 || info.velocity.y > 500)) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    overlayStack.push(overlayId);
    return () => {
      overlayStack.pop(overlayId);
    };
  }, [open, overlayId]);

  useScrollLock(open);
  useFocusTrap(sheet, {
    enabled: open,
    trapFocus,
    canTrap: isTop,
    initialFocus,
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !dismissible) return;
      // 가장 위 오버레이만 처리. ActionToast가 떠 있으면 그게 top(priority)이라 자동 양보.
      if (!isTop()) return;
      onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, dismissible, isTop]);

  const content = (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={() => {
              // 자신이 top일 때만 닫힘. ActionToast가 위에 있으면 그쪽이 백드롭을 받는다.
              if (!dismissible || !isTop()) return;
              onClose();
            }}
            className="fixed inset-0 z-overlay bg-bg-overlay"
          />
        )}
      </AnimatePresence>
      <AnimatePresence onExitComplete={onExitComplete}>
        {open && (
          <motion.div
            key="drawer-sheet"
            ref={setSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={hasOpenSubView ? undefined : describedBy}
            tabIndex={-1}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={
              isMobile
                ? {
                    y: "100%",
                    transition: {
                      duration: prefersReducedMotion ? 0 : 0.2,
                      ease: [0.4, 0, 1, 1],
                    },
                  }
                : { x: "100%" }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : isMobile
                  ? // damping 38(임계감쇠 이상)로 오버슈트 제거 — 진입 시 시트가 목표를 지나쳐
                    // 들렸다 돌아오며 하단에 백드롭이 비치는 현상 방지. (Modal과 동일 정책)
                    { type: "spring", damping: 38, stiffness: 320 }
                  : { type: "spring", damping: 30, stiffness: 280 }
            }
            // 모바일에서만 스와이프-다운 닫기. 핸들 영역에서만 드래그 시작(콘텐츠 스크롤과 충돌 방지).
            drag={isMobile && dismissible ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            // 모바일 바텀시트 하단 틈 방지: 시트를 화면 바닥보다 32px 아래에서 시작(-bottom-8)하고
            // 같은 양만큼 하단 패딩(pb-8)을 줘 오버슈트/드래그 시에도 바닥 틈을 메운다. (Modal과 동일)
            className={cn(
              "fixed z-overlay flex flex-col overflow-x-hidden bg-bg-surface text-fg-default outline-none -bottom-8 left-0 right-0 max-h-[88vh] w-full rounded-t-sheet pb-8 sm:bottom-0 sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:h-full sm:w-auto sm:rounded-none sm:pb-0",
              className,
            )}
            style={!isMobile ? desktopStyle : undefined}
          >
            <div
              className={cn(
                "flex justify-center pt-2 pb-1 cursor-grab touch-none active:cursor-grabbing sm:hidden",
                !dismissible && "pointer-events-none opacity-0",
              )}
              onPointerDown={(e) => {
                if (dismissible) dragControls.start(e);
              }}
            >
              <div className="h-1 w-10 rounded-full bg-bg-handle" />
            </div>

            {title && (
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                <h3
                  id={titleId}
                  className="text-base font-semibold text-fg-default sm:text-lg"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={!dismissible}
                  className={cn(
                    "rounded-control-medium p-1 text-fg-muted hover:text-fg-default",
                    !dismissible && "pointer-events-none opacity-0",
                  )}
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

  // 안에 둔 ModalSubView가 드로어의 trapFocus 설정을 따르게 한다.
  return (
    <ModalFocusTrapContext.Provider value={context}>
      {content}
    </ModalFocusTrapContext.Provider>
  );
}
