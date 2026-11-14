import { CheckCircle2, CircleX, Info, Loader2 } from "lucide-react";
import { ToastBar, Toaster, toast } from "react-hot-toast";

import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";

export interface ToastProviderProps {
  children?: React.ReactNode;
}

/**
 * ToastProvider — 토스트 디자인이 적용된 react-hot-toast Toaster 래퍼.
 *
 * 앱 루트(또는 Storybook preview)에 한 번 마운트하면, 이후 `toast.success()` / `toast.error()` /
 * `toast.loading()` / `toast()`(blank=info) 호출이 이 디자인으로 렌더된다.
 * ActionToast(`showActionToast`)도 같은 Toaster를 공유한다.
 *
 * - 데스크탑: bottom-center / 모바일: top-center (safe-area-inset-top 반영)
 * - 다크 그레이 배경 + lucide 아이콘 + 닫기 버튼
 *
 * @example
 * ```tsx
 * // 앱 루트
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // 어디서든
 * import toast from "react-hot-toast";
 * toast.success("저장됐어요");
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const isMobile = useIsMobile();
  const position = isMobile ? "top-center" : "bottom-center";

  return (
    <>
      {children}
      <Toaster
        position={position}
        containerStyle={{
          zIndex: "var(--z-toast)",
          ...(isMobile ? { top: "calc(16px + env(safe-area-inset-top))" } : {}),
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--color-bg-toast)",
            color: "var(--color-fg-toast)",
            borderRadius: "var(--radius-toast)",
            padding: 0,
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: 500,
            width: "min(680px, calc(100vw - 32px))",
            maxWidth: "none",
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ ...t.style, padding: 0, width: "100%" }}>
            {({ message }) => {
              const iconSizeClass = isMobile ? "w-4 h-4" : "w-4.5 h-4.5";
              const containerPaddingClass = isMobile
                ? "px-3 py-3"
                : "px-3 py-3.5";
              const messageSizeClass = isMobile ? "text-xs" : "text-sm";
              return (
                <div
                  className={cn(
                    "flex items-center w-full",
                    containerPaddingClass,
                  )}
                >
                  <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
                    <span className="shrink-0 flex items-center">
                      {t.type === "success" && (
                        <CheckCircle2
                          className={cn(
                            iconSizeClass,
                            "text-toast-tone-success",
                          )}
                          strokeWidth={2}
                        />
                      )}
                      {t.type === "error" && (
                        <CircleX
                          className={cn(iconSizeClass, "text-toast-tone-danger")}
                          strokeWidth={2}
                        />
                      )}
                      {t.type === "loading" && (
                        <Loader2
                          className={cn(
                            iconSizeClass,
                            "animate-spin text-fg-toast",
                          )}
                          strokeWidth={2}
                        />
                      )}
                      {t.type === "blank" && (
                        <Info
                          className={cn(iconSizeClass, "text-toast-tone-info")}
                          strokeWidth={2}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        messageSizeClass,
                        "text-fg-toast whitespace-pre-line min-w-0 break-keep wrap-break-word",
                      )}
                    >
                      {message}
                    </span>
                  </div>
                  {t.type !== "loading" && (
                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      className="ml-2 shrink-0 text-fg-toast-muted hover:text-fg-toast-hover transition-colors cursor-pointer"
                      aria-label="닫기"
                    >
                      <CircleX
                        className={iconSizeClass}
                        fill="currentColor"
                        stroke="var(--color-bg-toast)"
                        strokeWidth={2}
                      />
                    </button>
                  )}
                </div>
              );
            }}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
