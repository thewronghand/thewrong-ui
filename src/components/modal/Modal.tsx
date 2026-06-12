import { useEffect, useId } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  type PanInfo,
} from "motion/react";

import { overlayStack } from "@/lib/overlay-stack";
import { Portal } from "@/lib/Portal";
import { useIsMobile } from "@/hooks";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /**
   * 데스크탑(sm+) 모달의 고정 폭(px). 지정하지 않으면 콘텐츠 폭에 fit (`sm:w-auto`).
   *
   * 모달은 너비를 애니메이션하지 않는 것이 정책이다(컴포넌트 설명 참고). 따라서 콘텐츠 폭이
   * 인터랙션으로 변할 수 있는 모달은 `widthPx`로 폭을 고정해 폭 변동에 따른 시각적 흔들림을 막는다.
   * 폭이 변하지 않는 단순 모달은 생략해 콘텐츠 폭에 맞춰도 된다.
   * 모바일은 무조건 w-full (이 값 무시).
   */
  widthPx?: number;
  /**
   * 푸터 영역. 지정하면 헤더-바디-푸터 3단 구조로 동작 — 푸터는 스크롤 영역 밖에 고정되고
   * children(=바디)만 자체 스크롤된다. 미지정이면 children 전체가 한 영역에서 스크롤(기본).
   */
  footer?: React.ReactNode;
  /**
   * 바디 스크롤 컨테이너 자체에 좌우 패딩을 부여해 스크롤바가 시트 가장자리가 아니라 안쪽에
   * 떠 있는 모양을 만든다. 이 옵션을 켜면 사용처 본문에서는 좌우 패딩을 제거하고 세로만 둘 것.
   */
  bodyPadded?: boolean;
  /**
   * 모달 바디 위에 우측에서 슬라이드 인 하는 서브뷰. ModalSubView 컴포넌트를 그대로 넘기면 된다.
   * 별도 wrapper(scroll-isolated)에 두어 본문 스크롤과 무관하게 viewport 100% 덮음.
   * subView가 있으면 시트 높이가 자동으로 viewport 기준으로 강제된다 (콘텐츠 따라 자라지 않음).
   */
  subView?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 데스크탑(`sm`+)에서는 중앙 정렬 모달, 모바일에서는 화면 하단에서 올라오는 bottom-sheet으로 동작.
 *
 * - 모바일: 시트가 화면 하단에 붙고 상단 모서리만 둥글다. 핸들 바 표시.
 *   진입/퇴장 모션은 화면 밖에서 슬라이드 (`y: "100%" → 0 → "100%"`).
 * - 데스크탑: 중앙 카드. 살짝 위로 올라오면서 페이드 인/아웃.
 *
 * **높이 변화**: 콘텐츠 높이가 변하는 인터랙션(토글/조건부 영역)은 본문을 `<AnimatedHeight>`로
 * 감싸면 시트 높이가 부드럽게 이행된다. 미적용 시 instant jump.
 *
 * **너비는 고정한다**: 동적 너비 트랜지션은 데스크탑 중앙 정렬(`translateX(-50%)`)의 기준점과
 * 함께 움직여 한쪽으로 밀리는 부자연스러운 모션이 된다(framer-motion `layout`도 transform 정렬과
 * 충돌). 그래서 높이만 애니메이션하고 너비는 고정하는 것을 정책으로 한다. 콘텐츠 폭이 모드 전환
 * 등으로 변할 수 있으면 `widthPx`로 고정해 시트가 흔들리지 않게 할 것.
 *
 * **레이어드 오버레이**: ESC/백드롭은 `overlayStack`에서 자신이 top일 때만 반응한다.
 * ActionToast나 ModalSubView가 위에 떠 있으면(더 높은 priority/나중 push) 자동으로 양보된다.
 * 모달 위에 또 모달을 쌓는 대신 ModalSubView(푸시 네비)나 ActionToast(재확인)로 푸는 것을 권장.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  widthPx,
  footer,
  bodyPadded = false,
  subView,
  children,
}: ModalProps) {
  const isMobile = useIsMobile();

  const overlayId = useId();
  const dragControls = useDragControls();

  // 모바일 바텀시트 스와이프-다운 닫기. 100px 이상 끌거나 빠르게 튕기면 close.
  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    overlayStack.push(overlayId);
    document.body.style.overflow = "hidden";
    return () => {
      overlayStack.pop(overlayId);
      // 마지막 오버레이가 닫혔을 때만 lock 해제. 레이어드 모달에서 안쪽 닫힐 때 바깥의 lock 유지.
      if (overlayStack.isEmpty()) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, overlayId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 가장 위 오버레이만 처리. ActionToast가 떠 있으면 그게 top(priority)이라 자동으로 양보된다.
      if (!overlayStack.isTop(overlayId)) return;
      onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, overlayId]);

  return (
    <Portal>
      {/* 백드롭 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              // 자신이 top일 때만 닫힘. ActionToast/SubView가 위에 있으면 그쪽이 백드롭을 받는다.
              if (!overlayStack.isTop(overlayId)) return;
              onClose();
            }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        )}
      </AnimatePresence>
      {/* 시트 — AnimatePresence의 직접 자식이 motion.div여야 exit 동작 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-sheet"
            initial={
              isMobile ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.96 }
            }
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            // exit transition 명시 — 사용자가 드래그로 시트를 살짝 내린 상태에서 백드롭 클릭 시
            // spring이 현재 위치 기준으로 길어지는 문제를 짧은 tween으로 일정하게 맞춤.
            exit={
              isMobile
                ? {
                    y: "100%",
                    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                  }
                : { opacity: 0, y: 24, scale: 0.96 }
            }
            transition={
              isMobile
                ? // damping을 임계감쇠 이상(>= 2*sqrt(stiffness) ≈ 35.8)으로 올려 오버슈트 제거.
                  // 기존 damping 30은 과소감쇠라 진입 시 시트가 목표(y:0)를 지나쳐 위로 들렸다
                  // 돌아오며 하단에 백드롭이 비쳤다. 38이면 오버슈트 없이 부드럽게 정착.
                  { type: "spring", damping: 38, stiffness: 320 }
                : { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
            }
            // 모바일 한정 스와이프-다운 닫기. 데스크탑에선 translate -50%/-50% 정렬과 충돌하므로 비활성.
            drag={isMobile ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            // 위로는 못 끌게(top 0), 아래로만 elastic. dragElastic의 top을 0으로 둬도 motion이
            // 미세 오버드래그를 허용하므로 아래 '하단 연장(pb + -bottom)'으로 틈을 원천 차단한다.
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            // 모바일 바텀시트 하단 틈 방지:
            // spring 진입 오버슈트(0을 지나쳐 위로 들림)나 위로 드래그 시 시트 하단과 화면 바닥
            // 사이에 백드롭이 비치는 현상을 막기 위해, 시트를 화면 바닥보다 32px 아래에서 시작(-bottom-8)하고
            // 같은 양만큼 하단 패딩(pb-8)을 줘 콘텐츠는 그대로 두면서 바닥 틈을 항상 메운다.
            className="fixed -bottom-8 left-0 right-0 z-50 mx-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-8 shadow-xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[90vh] sm:w-auto sm:min-w-[320px] sm:max-w-[90vw] sm:rounded-lg sm:pb-0 dark:bg-neutral-800"
            style={
              !isMobile
                ? {
                    translateX: "-50%",
                    translateY: "-50%",
                    ...(widthPx ? { width: widthPx } : {}),
                  }
                : undefined
            }
          >
            {/* 모바일 핸들 바 — 드래그-다운 닫기 트리거 */}
            <div
              className="flex justify-center pt-2 pb-1 cursor-grab touch-none active:cursor-grabbing sm:hidden"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
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
            {/*
              바디 영역 — 통합 구조.
              wrapper(relative flex min-h-0 flex-1 flex-col overflow-hidden)
                ├ scroll layer(flex-1 overflow-y-auto overflow-x-hidden): 자연 흐름.
                └ subView(absolute inset-0): wrapper 기준이라 스크롤 위치 무관하게 viewport 전체 덮음.
            */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={`flex-1 overflow-y-auto overflow-x-hidden${bodyPadded ? " mx-1 sm:mx-4" : ""}`}
              >
                {children}
              </div>
              {subView}
            </div>
            {footer && <div className="shrink-0">{footer}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
