import type { HTMLAttributes, ReactNode } from "react";

import { AnimatedHeight } from "@/components/animated-height";

export interface FieldMessageProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?: ReactNode;
  /** 메시지가 나타나고 사라질 때 높이를 부드럽게 전환한다. */
  animated?: boolean;
}

/**
 * 폼 컨트롤 아래의 도움말·검증 메시지 영역.
 *
 * 조건부 메시지를 애니메이션하려면 컴포넌트 자체는 유지하고 children만 바꾼다.
 *
 * @example
 * ```tsx
 * <FieldMessage animated className="mt-1 text-xs text-fg-danger">
 *   {errorMessage}
 * </FieldMessage>
 * ```
 */
export function FieldMessage({
  children,
  animated = false,
  ...messageProps
}: FieldMessageProps) {
  const message = children ? <div {...messageProps}>{children}</div> : null;

  if (!animated) return message;

  return <AnimatedHeight>{message}</AnimatedHeight>;
}
