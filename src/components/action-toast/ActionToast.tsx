import { AlertTriangle, CircleX, Info } from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import toast, { type Toast } from "react-hot-toast";

import { useIsMobile } from "@/hooks";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import {
  overlayStack,
  ACTION_TOAST_OVERLAY_ID,
  ACTION_TOAST_PRIORITY,
} from "@/lib/overlay-stack";
import { cn } from "@/lib/utils";

const ACTION_TOAST_ID = "action-toast-singleton";

/**
 * 액티브 상태를 모듈 플래그 + overlayStack 양쪽에 반영.
 * - 플래그(isActive): isActionToastActive() 조회용 (하위호환/명시적 체크)
 * - overlayStack: Modal/Drawer가 action-toast를 직접 import하지 않고도 "토스트가 top이면
 *   ESC/백드롭 양보"가 자동 성립하도록 하는 조정 채널. (레이어드 모달 회피)
 */
function setActionToastActive(active: boolean) {
  isActive = active;
  if (active) {
    overlayStack.push(ACTION_TOAST_OVERLAY_ID, ACTION_TOAST_PRIORITY);
  } else {
    overlayStack.pop(ACTION_TOAST_OVERLAY_ID);
  }
}

type ButtonVisualProps = Partial<
  Pick<
    ComponentProps<typeof Button>,
    "variant" | "appearance" | "size" | "leadingIcon" | "trailingIcon"
  >
>;

export interface ActionToastButton extends ButtonVisualProps {
  label: ReactNode;
  /**
   * 클릭 시 호출. 호출 후 토스트는 자동으로 닫힌다.
   * 닫지 않고 유지하려면 `closeOnClick: false`.
   *
   * 콜백이 입력값(prompt/textarea)을 인자로 받음. input이 없으면 빈 문자열.
   */
  onClick: (inputValue: string) => void;
  closeOnClick?: boolean;
  disabled?: boolean;
}

export type ActionToastInput =
  | { type: "text"; placeholder?: string; defaultValue?: string }
  | {
      type: "textarea";
      placeholder?: string;
      defaultValue?: string;
      rows?: number;
    };

interface ShowActionToastArgs {
  message: ReactNode;
  actions: ActionToastButton[];
  /** 톤. 좌측 아이콘 색상에만 반영(배경/텍스트는 일반 토스트와 동일한 다크 그레이). */
  tone?: "warning" | "info" | "danger";
  /** 좌측 아이콘 커스텀. 미지정 시 톤별 기본 아이콘. null이면 아이콘 숨김. */
  icon?: ReactNode | null;
  input?: ActionToastInput;
  /** 토스트 폭(px) 커스텀. 기본 680(일반 토스트와 동일). 모바일은 viewport-32px로 자동 fit. */
  widthPx?: number;
  /**
   * 백드롭 노출 여부. 기본 true(모달 위 결정 강제용).
   * 단순 알림(예: 새 버전 안내)처럼 사용자 동작을 막을 필요 없을 때 false.
   * false면 클릭-아웃 dismiss도 비활성.
   */
  backdrop?: boolean;
  /**
   * 시트(카드) 루트에 병합되는 클래스. `cn`(tailwind-merge)으로 병합된다. 백드롭에는 적용 안 됨.
   * 폭은 `widthPx`로 고정하는 것이 정책이므로 너비 클래스 대신 `widthPx`를 우선 쓸 것.
   */
  className?: string;
}

/**
 * 액션 토스트가 현재 떠 있는지 추적하는 모듈 플래그.
 * show/dismiss 시점에 갱신. Modal/Drawer가 ESC/백드롭 우선순위 결정에 사용.
 */
let isActive = false;

/**
 * 사용자 결정이 필요한 액션 토스트. 자동 dismiss 없음.
 * 위치는 전역 Toaster를 따름(데스크탑=bottom-center, 모바일=top-center).
 * 한 번에 최대 1개만 노출(같은 id로 덮어쓰기).
 *
 * 컨벤션: 다크 시트 위에서 outlined 버튼은 border가 묻혀 가독성이 떨어진다.
 * 액션 버튼은 `appearance: "filled"`로 통일할 것.
 *
 * 사용 전 앱 루트에 `react-hot-toast`의 `<Toaster />`가 마운트돼 있어야 한다.
 */
export function showActionToast({
  message,
  actions,
  tone = "warning",
  icon,
  input,
  widthPx,
  backdrop = true,
  className,
}: ShowActionToastArgs): string {
  setActionToastActive(true);
  return toast.custom(
    (t: Toast) => (
      <ActionToastView
        toastInstance={t}
        message={message}
        actions={actions}
        tone={tone}
        icon={icon}
        input={input}
        widthPx={widthPx}
        backdrop={backdrop}
        className={className}
      />
    ),
    {
      id: ACTION_TOAST_ID,
      duration: Infinity,
    },
  );
}

export function dismissActionToast() {
  toast.dismiss(ACTION_TOAST_ID);
  setActionToastActive(false);
}

export function isActionToastActive(): boolean {
  return isActive;
}

/**
 * 시트(bg-secondary-700) 위에서 tertiary filled의 다크 토큰 `dark:bg-secondary-700`이
 * 시트와 동색이라 묻혀버린다. 시트 위에서만 한 톤 밝은 배경으로 보강.
 *
 * Button color classes의 `dark:bg-secondary-700`이 cascade에서 일반 utility를 이기므로
 * override도 반드시 `dark:` variant로 명시해야 한다. 시트 자체에 `.dark` 클래스가 있어
 * `dark:` variant가 항상 활성.
 */
function variantOverrideClass(variant: ButtonVisualProps["variant"]) {
  if (variant !== "tertiary") return undefined;
  return "dark:bg-white/10 dark:hover:bg-white/15 dark:active:bg-white/20 dark:text-white";
}

interface ActionToastViewProps {
  toastInstance: Toast;
  message: ReactNode;
  actions: ActionToastButton[];
  tone: "warning" | "info" | "danger";
  icon?: ReactNode | null;
  input?: ActionToastInput;
  widthPx?: number;
  backdrop: boolean;
  className?: string;
}

const TONE_ICON_CLASSES: Record<ActionToastViewProps["tone"], string> = {
  warning: "text-amber-400",
  info: "text-blue-400",
  danger: "text-rose-400",
};

function defaultIconForTone(
  tone: ActionToastViewProps["tone"],
  sizeClass: string,
): ReactNode {
  const className = `${sizeClass} shrink-0 ${TONE_ICON_CLASSES[tone]}`;
  if (tone === "info") {
    return <Info className={className} strokeWidth={2} aria-hidden />;
  }
  return <AlertTriangle className={className} strokeWidth={2} aria-hidden />;
}

function ActionToastView({
  toastInstance,
  message,
  actions,
  tone,
  icon,
  input,
  widthPx = 680,
  backdrop,
  className,
}: ActionToastViewProps) {
  const isMobile = useIsMobile();

  // 모바일에서 사이즈를 한 단계 다운: 텍스트/아이콘/버튼/패딩.
  const iconSizeClass = isMobile ? "h-4 w-4" : "h-4.5 w-4.5";
  const textSizeClass = isMobile ? "text-xs" : "text-sm";
  const buttonSize = isMobile ? "mini" : "small";
  const containerPaddingClass = isMobile ? "px-3 py-2.5" : "px-4 py-3";
  const containerPaddingStackClass = isMobile ? "px-3 py-3" : "px-4 py-3.5";
  const gapClass = isMobile ? "gap-2" : "gap-3";

  const resolvedIcon =
    icon === undefined ? defaultIconForTone(tone, iconSizeClass) : icon;
  const [inputValue, setInputValue] = useState(input?.defaultValue ?? "");

  // ESC로 토스트 닫기. action-toast는 overlayStack에서 항상 최상위(priority)이므로
  // Modal/Drawer의 ESC 핸들러는 isTop 가드에 막혀 양보된다 — 여기서 직접 dismiss를 책임진다.
  // (레이어드 회피: 각 오버레이가 자기 dismiss를 소유)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!overlayStack.isTop(ACTION_TOAST_OVERLAY_ID)) return;
      toast.dismiss(toastInstance.id);
      setActionToastActive(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [toastInstance.id]);

  // 모바일 + 일반 모드에서 메시지가 한 줄을 넘어가면 세로 스택으로 전환.
  // 측정 전용 hidden 노드(가로 레이아웃 기준 폭)에 ref를 두고 라인 수 감지.
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);
  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const measure = () => {
      const cs = window.getComputedStyle(node);
      const lineHeight = parseFloat(cs.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
      // 1.5px 보정 — 서브픽셀 라운딩으로 인한 false positive 방지.
      setIsMultiLine(node.scrollHeight > lineHeight + 1.5);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [message]);
  const stackOnMobile = isMobile && isMultiLine && !input;

  // 같은 ACTION_TOAST_ID로 덮어쓰면 react-hot-toast가 동일 React 트리를 재사용해
  // useState 초기값이 갱신되지 않는다. defaultValue가 바뀌거나 input 자체가 추가/제거될 때 동기화.
  useEffect(() => {
    setInputValue(input?.defaultValue ?? "");
  }, [input?.defaultValue, input?.type]);

  const handleActionClick = (action: ActionToastButton) => {
    const close = action.closeOnClick ?? true;
    if (close) {
      toast.dismiss(toastInstance.id);
      setActionToastActive(false);
    }
    action.onClick(inputValue);
  };

  const handleClose = () => {
    toast.dismiss(toastInstance.id);
    setActionToastActive(false);
  };

  // backdrop이 없는 경우(단순 알림 류) 백드롭 클릭으로 닫을 수 없으니 X 버튼을 노출.
  const closeButton = !backdrop ? (
    <button
      type="button"
      onClick={handleClose}
      className="ml-1 shrink-0 text-white/70 hover:text-white transition-colors cursor-pointer"
      aria-label="닫기"
    >
      <CircleX
        className={iconSizeClass}
        fill="currentColor"
        stroke="var(--color-secondary-700)"
        strokeWidth={2}
      />
    </button>
  ) : null;

  // 4가지 레이아웃(input/세로 스택/일반 가로/측정 hidden)에서 액션 버튼 렌더가 동일. 헬퍼로 추출.
  const renderActions = (wrapperClassName: string, measureOnly = false) =>
    actions.length > 0 && (
      <div className={wrapperClassName}>
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant}
            appearance={action.appearance}
            size={action.size ?? buttonSize}
            leadingIcon={action.leadingIcon}
            trailingIcon={action.trailingIcon}
            disabled={measureOnly ? undefined : action.disabled}
            onClick={measureOnly ? undefined : () => handleActionClick(action)}
            tabIndex={measureOnly ? -1 : undefined}
            className={
              measureOnly ? undefined : variantOverrideClass(action.variant)
            }
          >
            {action.label}
          </Button>
        ))}
      </div>
    );

  // text input에서 Enter는 마지막 액션(=주 액션 컨벤션) 발화. textarea는 줄바꿈 유지.
  // IME 조합 중 Enter는 글자 확정용이므로 무시.
  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const primary = actions[actions.length - 1];
    if (!primary || primary.disabled) return;
    e.preventDefault();
    handleActionClick(primary);
  };

  return (
    <>
      {/*
        약한 백드롭. body로 portal해야 viewport 전체를 덮는다.
        visible=false일 때 pointer-events를 끊어 잔상 백드롭이 클릭을 가로채는 것을 방지.
      */}
      {backdrop &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: toastInstance.visible ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              toast.dismiss(toastInstance.id);
              setActionToastActive(false);
            }}
            className={`fixed inset-0 z-9998 bg-black/15 ${
              toastInstance.visible ? "" : "pointer-events-none"
            }`}
            aria-hidden
          />,
          document.body,
        )}
      {/*
        시트 본체. 전역 Toaster position을 따르므로 fade + scale 위주.
        시트도 visible=false 동안 pointer-events-none.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={
          toastInstance.visible
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.98 }
        }
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        // `dark` 클래스를 시트 자체에 박아, 내부 Input/Textarea/Button 같은 공용 컴포넌트가
        // 호스트 페이지의 라이트/다크 모드와 무관하게 항상 다크 톤으로 렌더되도록 강제.
        className={cn(
          "dark relative rounded-2xl bg-secondary-700 text-white shadow-lg",
          toastInstance.visible ? "" : "pointer-events-none",
          className,
        )}
        style={{ width: `min(${widthPx}px, calc(100vw - 32px))` }}
        role="alertdialog"
        aria-modal={backdrop ? "true" : undefined}
        aria-label="확인이 필요한 알림"
      >
        {input ? (
          // 입력 모드: 메시지(아이콘+텍스트) → 입력 → 입력 우측 하단에 액션 버튼
          <div className={`flex flex-col gap-2.5 ${containerPaddingStackClass}`}>
            <div className={`flex items-start ${gapClass}`}>
              {resolvedIcon}
              <div
                className={`min-w-0 flex-1 ${textSizeClass} leading-relaxed whitespace-pre-line break-keep wrap-break-word`}
              >
                {message}
              </div>
              {closeButton}
            </div>
            {input.type === "text" ? (
              <Input
                variant="box"
                inputSize={isMobile ? "mini" : "small"}
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleTextInputKeyDown}
                placeholder={input.placeholder}
              />
            ) : (
              <Textarea
                textareaSize={isMobile ? "mini" : "small"}
                rows={input.rows ?? 3}
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={input.placeholder}
              />
            )}
            {renderActions("flex justify-end gap-1.5")}
          </div>
        ) : (
          <>
            {/*
              측정 전용 hidden 노드. 가로 레이아웃의 메시지 영역과 동일한 구조로
              메시지 텍스트가 가로 모드에서 한 줄을 넘는지 판정.
            */}
            <div
              aria-hidden
              className={`invisible pointer-events-none absolute inset-0 flex items-center ${gapClass} ${containerPaddingClass}`}
            >
              <span className={`${iconSizeClass} shrink-0`} />
              <div
                ref={measureRef}
                className={`min-w-0 flex-1 ${textSizeClass} leading-relaxed whitespace-pre-line break-keep wrap-break-word`}
              >
                {message}
              </div>
              {renderActions("flex shrink-0 gap-1.5", true)}
            </div>
            {stackOnMobile ? (
              // 모바일 + 여러 줄 메시지: 아이콘(상단 중앙) → 텍스트 → 버튼(우측 정렬)
              <div
                className={`relative flex flex-col ${gapClass} ${containerPaddingStackClass}`}
              >
                {closeButton && (
                  <div className="absolute right-3 top-3">{closeButton}</div>
                )}
                <div className="flex justify-center">{resolvedIcon}</div>
                <div
                  className={`${textSizeClass} leading-relaxed text-center whitespace-pre-line break-keep wrap-break-word`}
                >
                  {message}
                </div>
                {renderActions("flex justify-end gap-1.5")}
              </div>
            ) : (
              // 일반 모드: 한 줄에 아이콘 + 메시지 + 우측 액션 버튼
              <div
                className={`flex items-center ${gapClass} ${containerPaddingClass}`}
              >
                {resolvedIcon}
                <div
                  className={`min-w-0 flex-1 ${textSizeClass} leading-relaxed whitespace-pre-line break-keep wrap-break-word`}
                >
                  {message}
                </div>
                {renderActions("flex shrink-0 gap-1.5")}
                {closeButton}
              </div>
            )}
          </>
        )}
      </motion.div>
    </>
  );
}
