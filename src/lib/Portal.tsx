import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

/**
 * Portal 컴포넌트
 *
 * DOM 트리의 다른 위치(기본값은 document.body)에 자식 컴포넌트를 렌더링해요.
 * 드롭다운, 모달, 툴팁 등이 부모 요소의 overflow: hidden에 가려지는 문제를 해결할 때 사용해요.
 */
export function Portal({ children, containerId }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const container = containerId
    ? document.getElementById(containerId)
    : document.body;

  if (!container) return null;

  return createPortal(children, container);
}
