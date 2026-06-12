import { type ReactNode } from "react";

import { Button } from "@/components/button";
import type { ButtonAppearance, ButtonVariant } from "@/components/button";
import { useIsMobile } from "@/hooks";
import { Modal } from "./Modal";

export interface StandardModalAction {
  label: ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  /** 좌측에 아이콘. 우측 액션엔 거의 안 쓰지만 leftAction(예: 변경이력)에선 자주 사용. */
  leadingIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  widthPx?: number;
  /** 우측 슬라이드 서브뷰. ModalSubView 그대로 전달. */
  subView?: ReactNode;
  /**
   * 우측 주 액션. 보통 "저장" / "확인" 등. variant 기본 primary.
   * 미지정이면 footer 자체가 안 그려진다 (단순 알림성 모달은 base Modal로).
   */
  primaryAction?: StandardModalAction;
  /** 우측 보조 액션. 보통 "취소" / "닫기". variant 기본 secondary, appearance 기본 outlined. */
  secondaryAction?: StandardModalAction;
  /**
   * 좌측 보조 액션. 비대칭 footer (예: 좌측 "변경이력", 우측 "닫기/저장")가 필요할 때.
   * 일반 모달에서는 미지정.
   */
  leftAction?: StandardModalAction;
  /**
   * 본문 자동 padding(`px-4 py-5`)을 끄고 호출부가 직접 padding 책임진다.
   * 본문이 카드/테이블/이미지처럼 자체 가장자리까지 가야 하는 경우.
   */
  bodyNoPadding?: boolean;
  children: ReactNode;
}

/**
 * 표준 폼 모달 — Modal 위에 표준 footer + 본문 padding을 강제로 입힌 고수준 컴포넌트.
 *
 * 80% 폼 모달 케이스를 한 번에 표준화한다. 비대칭 액션도 `leftAction` 으로 커버.
 * 자유도가 더 필요한 케이스(footer 자체 자유 배치, 본문에 다른 인터랙션 영역)는
 * base `Modal`로 직접 내려가서 footer/bodyPadded prop을 자유롭게 쓸 것.
 *
 * @example
 * ```tsx
 * <StandardModal
 *   isOpen={open}
 *   onClose={onClose}
 *   title="역할 수정"
 *   primaryAction={{ label: "저장", onClick: handleSave, loading: isSaving }}
 *   secondaryAction={{ label: "닫기", onClick: onClose }}
 * >
 *   <Input ... />
 * </StandardModal>
 * ```
 */
export function StandardModal({
  isOpen,
  onClose,
  title,
  widthPx,
  subView,
  primaryAction,
  secondaryAction,
  leftAction,
  bodyNoPadding,
  children,
}: StandardModalProps) {
  // 모바일에서는 footer 버튼을 mini 사이즈로 분기 — 좁은 viewport에서 폭/높이 절약.
  const isMobile = useIsMobile();

  const hasFooter = primaryAction || secondaryAction || leftAction;
  const buttonSize = isMobile ? "mini" : "small";

  const renderActionButton = (
    action: StandardModalAction,
    defaults: { variant: ButtonVariant; appearance?: ButtonAppearance },
  ) => (
    <Button
      variant={action.variant ?? defaults.variant}
      appearance={action.appearance ?? defaults.appearance}
      size={buttonSize}
      display="block"
      leadingIcon={action.leadingIcon}
      onClick={action.onClick}
      loading={action.loading}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      widthPx={widthPx}
      bodyPadded
      subView={subView}
      footer={
        hasFooter ? (
          // 모바일에선 px-4·py-3 + 버튼 좁게 / 데스크탑에선 px-5·py-4 + 버튼 넓게.
          <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-neutral-700">
            <div>
              {leftAction && (
                <div className="w-[88px] sm:w-28">
                  {renderActionButton(leftAction, {
                    variant: "tertiary",
                    appearance: "outlined",
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {secondaryAction && (
                <div className="w-16 sm:w-24">
                  {renderActionButton(secondaryAction, {
                    variant: "secondary",
                    appearance: "outlined",
                  })}
                </div>
              )}
              {primaryAction && (
                <div className="w-16 sm:w-24">
                  {renderActionButton(primaryAction, { variant: "primary" })}
                </div>
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      {bodyNoPadding ? (
        children
      ) : (
        <div className="px-2 py-3 sm:px-4 sm:py-5">{children}</div>
      )}
    </Modal>
  );
}
