import { forwardRef, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { ButtonBaseProps, ButtonCommonProps, ButtonLinkProps } from "./types";
import {
  getButtonBaseClasses,
  getButtonColorClasses,
  getButtonDisplayClasses,
  getButtonFocusRing,
  getButtonSizeClasses,
} from "./utils";

const Spinner = () => (
  <svg
    className="animate-button-spinner size-button-spinner-small"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-button-spinner-track"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-button-spinner-head"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * 기본 버튼. `variant`(primary/secondary/tertiary/danger) × `appearance`(filled/outlined/transparent)
 * × `size`(mini/small/medium/large) 조합으로 표현한다.
 *
 * - 저장·정산·전송 같은 **비가역 async 액션**에는 `clickThrottleMs`로 더블클릭을 막는다.
 * - 모달 푸터·모바일 등 부모 폭을 채워야 하면 `display="block"`.
 * - 시각은 버튼이지만 실제 이동이 필요하면 `as="a"` + `href`(링크로 렌더, loading/disabled 동일 동작).
 * - `appearance="link"`는 문장 안에 배치하며 size와 display를 무시하고 부모 글자 크기·줄높이·글꼴을 상속한다.
 *   `font-[inherit]`는 font-family만 상속하며, 글자 굵기는 기본 CSS(preflight)의 폼 컨트롤 상속 규칙을 따른다.
 *   `as="a"`는 문장 사이에서 줄바꿈되며, 기본 button은 브라우저의 인라인 블록으로 배치된다.
 * - 크기와 색상은 `className`으로 덮어쓸 수 있다.
 *
 * @example
 * ```tsx
 * <Button onClick={save}>저장</Button>
 * <Button variant="danger" appearance="outlined" onClick={remove}>삭제</Button>
 * <Button display="block" loading={isSaving} clickThrottleMs={1000} onClick={submit}>제출</Button>
 * <Button as="a" href="/list">목록으로</Button>
 * ```
 */
export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonBaseProps | ButtonLinkProps
>((props, ref) => {
  const {
    variant = "primary",
    appearance = "filled",
    size = "medium",
    display = "inline",
    loading = false,
    clickThrottleMs = 0,
    leadingIcon,
    trailingIcon,
    className = "",
    children,
    ...restProps
  } = props;

  const [isThrottled, setIsThrottled] = useState(false);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startThrottle = () => {
    if (!clickThrottleMs) return;
    setIsThrottled(true);
    if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    throttleTimerRef.current = setTimeout(() => {
      setIsThrottled(false);
      throttleTimerRef.current = null;
    }, clickThrottleMs);
  };

  useEffect(
    () => () => {
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    },
    [],
  );

  const isLink = "as" in props && props.as === "a";
  const disabled = "disabled" in props ? props.disabled : false;
  const isDisabled = disabled || loading || isThrottled;

  const classes = cn(
    getButtonBaseClasses(appearance),
    getButtonColorClasses(variant, appearance),
    appearance === "link"
      ? "h-auto min-w-0 border-0 p-0 align-baseline text-start underline hover:decoration-2 hover:underline-offset-2 active:decoration-[3px] active:underline-offset-4 text-[length:inherit] leading-[inherit] font-[inherit]"
      : getButtonSizeClasses(size),
    appearance === "link" ? "inline" : getButtonDisplayClasses(display),
    getButtonFocusRing(variant, appearance),
    appearance === "link" && isDisabled && "no-underline",
    loading && "opacity-70 cursor-wait",
    isLink && isDisabled && "pointer-events-none",
    isLink && isDisabled && !loading && appearance !== "link" && "opacity-button-disabled",
    className,
  );

  if (isLink) {
    const linkProps = restProps as Omit<
      ButtonLinkProps,
      keyof ButtonCommonProps | "as"
    >;
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      startThrottle();
      linkProps.onClick?.(e);
    };
    return (
      <a
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        className={classes}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : linkProps.tabIndex}
        {...linkProps}
        onClick={handleLinkClick}
      >
        {appearance === "link" && (loading || leadingIcon) ? (
          <span className="inline-flex align-middle">{loading ? <Spinner /> : leadingIcon}</span>
        ) : loading ? <Spinner /> : leadingIcon}
        {children}
        {!loading && (appearance === "link" && trailingIcon ? (
          <span className="inline-flex align-middle">{trailingIcon}</span>
        ) : trailingIcon)}
      </a>
    );
  }

  const buttonProps = restProps as Omit<ButtonBaseProps, keyof ButtonCommonProps>;
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    startThrottle();
    buttonProps.onClick?.(e);
  };

  return (
    <button
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      className={classes}
      disabled={isDisabled}
      {...buttonProps}
      onClick={handleButtonClick}
    >
      {appearance === "link" && (loading || leadingIcon) ? (
        <span className="inline-flex align-middle">{loading ? <Spinner /> : leadingIcon}</span>
      ) : loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && (appearance === "link" && trailingIcon ? (
        <span className="inline-flex align-middle">{trailingIcon}</span>
      ) : trailingIcon)}
    </button>
  );
});

Button.displayName = "Button";
