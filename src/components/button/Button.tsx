import { forwardRef, useEffect, useRef, useState } from "react";

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
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
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

  const classes = [
    getButtonBaseClasses(),
    getButtonColorClasses(variant, appearance),
    getButtonSizeClasses(size),
    getButtonDisplayClasses(display),
    getButtonFocusRing(variant),
    loading ? "opacity-70 cursor-wait" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isLink = "as" in props && props.as === "a";
  const disabled = "disabled" in props ? props.disabled : false;
  const isDisabled = disabled || loading || isThrottled;

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
        className={`${classes} ${
          isDisabled ? "pointer-events-none opacity-60" : ""
        }`.trim()}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : linkProps.tabIndex}
        {...linkProps}
        onClick={handleLinkClick}
      >
        {loading ? <Spinner /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
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
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

Button.displayName = "Button";
