import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { type ReactNode, useState } from "react";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  /** hover/focus 후 노출까지 딜레이(ms). 기본 100. */
  delayMs?: number;
}

/**
 * 툴팁 — `@floating-ui/react` 기반.
 *
 * - **자동 flip**: 위 공간 부족하면 아래로 자동 전환
 * - **viewport boundary clamp**: 화면 끝에 닿으면 자동 shift
 * - **스크롤/resize 자동 추적**: trigger가 움직여도 따라감
 * - **Portal 렌더**: 부모 overflow:hidden에 잘리지 않음
 * - **focus/keyboard 접근성** 내장
 *
 * hover/focus로 뜨는 짧은 텍스트 힌트(`content`는 string)에 쓴다. 강조·줄바꿈이 필요한
 * 도움말은 `InfoTooltip`(ReactNode), 클릭으로 여는 자유 콘텐츠는 `Popover`를 쓸 것.
 *
 * @example
 * ```tsx
 * <Tooltip content="최근 30일 기준">
 *   <InfoIcon />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  content,
  position = "top",
  delayMs = 100,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: position,
    // hover/scroll 시 위치 자동 갱신.
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      // 공간 부족 시 반대편으로 flip.
      flip({ fallbackAxisSideDirection: "start" }),
      // viewport 경계로 shift, 8px 여백.
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, { delay: { open: delayMs, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex"
      >
        {children}
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-9999 pointer-events-none rounded bg-neutral-800 px-2 py-1 text-xs whitespace-nowrap text-white dark:bg-neutral-700"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
