import { createContext, useCallback, useMemo, useRef, useState } from "react";

import { overlayStack } from "@/lib/overlay-stack";

interface ModalFocusTrapContextValue {
  isOpen: boolean;
  trapFocus: boolean;
  registerSubView: (id: string) => () => void;
  isTopSubView: (id: string) => boolean;
}

export const defaultModalFocusTrapContext: ModalFocusTrapContextValue = {
  isOpen: true,
  trapFocus: true,
  registerSubView: () => () => {},
  isTopSubView: (id) => overlayStack.isTop(id),
};

export const ModalFocusTrapContext = createContext(defaultModalFocusTrapContext);

export function useModalSubViews(
  isOpen: boolean,
  trapFocus: boolean,
  overlayId: string,
) {
  const subViews = useRef(new Set<string>());
  const [hasOpenSubView, setHasOpenSubView] = useState(false);
  const registerSubView = useCallback((id: string) => {
    const registered = subViews.current;
    registered.add(id);
    setHasOpenSubView(true);
    return () => {
      registered.delete(id);
      setHasOpenSubView(registered.size > 0);
    };
  }, []);
  const isTopSubView = useCallback(
    (id: string) => {
      const registered = Array.from(subViews.current);
      return (
        registered[registered.length - 1] === id &&
        (overlayStack.isTop(id) || overlayStack.isTop(overlayId))
      );
    },
    [overlayId],
  );
  const context = useMemo(
    () => ({ isOpen, trapFocus, registerSubView, isTopSubView }),
    [isOpen, trapFocus, registerSubView, isTopSubView],
  );

  const isTop = useCallback(
    () => isOpen && subViews.current.size === 0 && overlayStack.isTop(overlayId),
    [isOpen, overlayId],
  );

  return { context, isTop, hasOpenSubView };
}
