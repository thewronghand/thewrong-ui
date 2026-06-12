import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";

import { overlayStack } from "@/lib/overlay-stack";

export interface ModalSubViewProps {
  open: boolean;
  /** 뒤로가기 버튼 / ESC 키로 트리거됨. */
  onBack: () => void;
  title?: ReactNode;
  /** 헤더 우측에 추가 액션. 예: 새로고침 버튼. */
  headerRight?: ReactNode;
  /**
   * 바디 스크롤 컨테이너에 좌우 margin(mx-4)을 부여해 스크롤바가 시트 가장자리가 아닌 안쪽에
   * 떠 있는 모양을 만든다. 본 Modal의 bodyPadded와 동일 정책. 디폴트 true.
   * 본문이 카드/테이블처럼 가장자리까지 가야 하면 false로 끄고 호출부가 padding 책임.
   */
  bodyPadded?: boolean;
  /**
   * children을 px-4 py-5 wrapper로 자동 감싼다 (StandardModal과 동일 정책).
   * 호출부가 자체 padding을 가지면 false로 끌 것. 디폴트 true.
   */
  contentPadded?: boolean;
  /**
   * 표시 방식.
   * - "full" (기본): 부모 시트를 통째로 덮으며 우측에서 슬라이드 인.
   * - "drawer": 백드롭 + 우측 일부 영역만 차지하는 사이드 드로어. 부모 본문이 백드롭 뒤로 흐릿하게
   *   보이며 드로어는 우측에서 슬라이드 인.
   */
  variant?: "full" | "drawer";
  children: ReactNode;
}

/**
 * 모달 본문 위에 우측에서 슬라이드 인 하는 서브뷰.
 *
 * 데스크탑/모바일 동일하게 부모 Modal의 영역을 `absolute inset-0`로 덮어 한 번에 한 화면만
 * 보이게 한다. 모바일 바텀시트에서 두 시트를 겹치는 어색함 없이 자연스러운 푸시 네비.
 * (레이어드 모달 회피)
 *
 * **부모 Modal 요구사항**: 자식이 `absolute inset-0`로 자리 잡으려면 어딘가에 `position: relative`가
 * 있어야 한다. Modal 컴포넌트 자체가 `relative` 시트라 별도 처리 불필요.
 *
 * **높이 정책 — 서브뷰 콘텐츠 ≤ 부모 모달 콘텐츠**: 서브뷰는 부모 시트 영역을 `absolute inset-0`로
 * 덮으므로 부모 시트의 높이를 그대로 물려받는다. 모달 너비를 애니메이션하지 않는 것과 같은 이유로
 * 시트 높이도 서브뷰 진입 때마다 출렁이게 하지 않는다. 따라서 **서브뷰 콘텐츠 높이는 부모 모달
 * 본문 높이와 같거나 작게** 설계하는 것을 권장한다. "작은 모달인데 서브뷰에만 아주 긴 내용"이
 * 들어가면 서브뷰 안에서만 스크롤이 생겨 부모와 높이가 어긋나 보인다. 긴 목록은 부모 모달 자체를
 * 그만큼 키우거나(`widthPx`/콘텐츠 양 조정), 별도 페이지/Drawer로 분리할 것.
 *
 * **ESC 동작**: SubView가 열려있는 동안 ESC는 SubView의 `onBack`을 부르고 모달은 유지된다.
 * `overlayStack`을 push해 Modal보다 위 layer로 등록 — Modal의 ESC 핸들러는 자기가 top일 때만 실행.
 *
 * @example
 * ```tsx
 * const [subOpen, setSubOpen] = useState(false);
 *
 * <Modal isOpen={open} onClose={onClose} title="한도 수정">
 *   <button onClick={() => setSubOpen(true)}>변경 이력 보기</button>
 *   <ModalSubView open={subOpen} onBack={() => setSubOpen(false)} title="변경 이력">
 *     <AuditLogList ... />
 *   </ModalSubView>
 * </Modal>
 * ```
 */
export function ModalSubView({
  open,
  onBack,
  title,
  headerRight,
  bodyPadded = true,
  contentPadded = true,
  variant = "full",
  children,
}: ModalSubViewProps) {
  const overlayId = useId();

  useEffect(() => {
    if (!open) return;
    overlayStack.push(overlayId);
    return () => {
      overlayStack.pop(overlayId);
    };
  }, [open, overlayId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 자기가 top일 때만 onBack. 부모 Modal/Drawer도 같은 window listener에 등록돼 있지만
      // 각자 isTop 가드로 자신이 top이 아니면 무시하기 때문에 별도 stopPropagation 불필요.
      if (!overlayStack.isTop(overlayId)) return;
      onBack();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onBack, overlayId]);

  const header = (
    <div className="flex items-center gap-2 border-b border-border-tertiary px-4 py-3 dark:border-neutral-700">
      <button
        type="button"
        onClick={onBack}
        className="rounded p-1 text-text-tertiary transition-colors hover:bg-bg-base-secondary hover:text-text-secondary dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
        aria-label="뒤로 가기"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      {title && (
        <div className="flex-1 text-sm font-semibold text-text-primary dark:text-white">
          {title}
        </div>
      )}
      {headerRight}
    </div>
  );

  // 바디. bodyPadded면 mx-4로 스크롤바를 시트 가장자리에서 떼어 본 Modal과 일관된 모양.
  // contentPadded면 children을 px-4 py-5 wrapper로 감싸 콘텐츠 가장자리 여백 확보.
  const body = (
    <div
      className={`flex-1 overflow-y-auto overflow-x-hidden${
        bodyPadded ? " mx-1 sm:mx-4" : ""
      }`}
    >
      {contentPadded ? (
        <div className="px-2 py-3 sm:px-4 sm:py-5">{children}</div>
      ) : (
        children
      )}
    </div>
  );

  if (variant === "drawer") {
    // Drawer 변형 — 부모 시트 우측에서 슬라이드 인 하는 사이드 드로어 + 백드롭.
    return (
      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 z-10">
            <motion.div
              key="subview-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onBack}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              key="subview-drawer-sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{
                x: "100%",
                transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
              }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute right-0 top-0 bottom-0 flex w-[85%] max-w-md flex-col bg-bg-white shadow-xl dark:bg-neutral-800"
            >
              {header}
              {body}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0 z-10 flex flex-col bg-bg-white dark:bg-neutral-800"
        >
          {header}
          {body}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
