import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";
import type { RadioGroupProps, RadioItemProps } from "./types";

interface RadioGroupContextValue {
  equalizeLabelWidth: boolean;
  registerLabel: (label: HTMLElement) => () => void;
  maxLabelWidth: number | null;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Radio.Item의 배치만 담당하는 그룹입니다. 선택 semantics는 바깥 fieldset과 각
 * Item의 동일한 name이 담당하므로 legend 등 도메인 마크업을 강제하지 않습니다.
 */
export function RadioGroup({
  equalizeLabelWidth = false,
  className,
  style,
  children,
  ...props
}: RadioGroupProps) {
  const labelsRef = useRef(new Set<HTMLElement>());
  const observerRef = useRef<ResizeObserver | null>(null);
  const equalizeRef = useRef(equalizeLabelWidth);
  const [maxLabelWidth, setMaxLabelWidth] = useState<number | null>(null);

  equalizeRef.current = equalizeLabelWidth;

  const measureLabels = useCallback(() => {
    if (!equalizeRef.current) return;

    const widths = Array.from(
      labelsRef.current,
      (label) => label.getBoundingClientRect().width,
    );
    const nextWidth = widths.length > 0 ? Math.ceil(Math.max(...widths)) : null;
    setMaxLabelWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  const registerLabel = useCallback(
    (label: HTMLElement) => {
      labelsRef.current.add(label);
      if (equalizeRef.current) {
        observerRef.current?.observe(label);
        measureLabels();
      }

      return () => {
        observerRef.current?.unobserve(label);
        labelsRef.current.delete(label);
        measureLabels();
      };
    },
    [measureLabels],
  );

  useLayoutEffect(() => {
    if (!equalizeLabelWidth) {
      setMaxLabelWidth(null);
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      measureLabels();
      return;
    }

    const observer = new ResizeObserver(measureLabels);
    observerRef.current = observer;
    labelsRef.current.forEach((label) => observer.observe(label));
    measureLabels();

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [equalizeLabelWidth, measureLabels]);

  const contextValue = useMemo<RadioGroupContextValue>(
    () => ({ equalizeLabelWidth, registerLabel, maxLabelWidth }),
    [equalizeLabelWidth, registerLabel, maxLabelWidth],
  );

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={className} style={style} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

/**
 * 전체 행을 클릭할 수 있는 네이티브 radio 항목.
 *
 * 선택 semantics는 `fieldset`/`legend`와 동일한 `name`으로 구성합니다.
 * Radio.Group은 선택 동작을 바꾸지 않고 항목 간 레이아웃만 조율합니다.
 *
 * @example
 * ```tsx
 * <fieldset>
 *   <legend>알림 방식</legend>
 *   <Radio.Group equalizeLabelWidth>
 *     <Radio.Item name="notification" value="email" checked={value === "email"}>
 *       E-mail
 *     </Radio.Item>
 *   </Radio.Group>
 * </fieldset>
 * ```
 */
export const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(
  (
    {
      children,
      leadingIcon,
      contentAlignment = "start",
      className,
      disabled,
      onKeyDown,
      ...inputProps
    },
    ref,
  ) => {
    const group = useContext(RadioGroupContext);
    const equalizeLabelWidth = group?.equalizeLabelWidth;
    const registerLabel = group?.registerLabel;
    const labelCleanupRef = useRef<(() => void) | null>(null);
    const setLabelTextRef = useCallback(
      (label: HTMLSpanElement | null) => {
        labelCleanupRef.current?.();
        labelCleanupRef.current =
          label && equalizeLabelWidth && registerLabel
            ? registerLabel(label)
            : null;
      },
      [equalizeLabelWidth, registerLabel],
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const offset =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (offset === 0) return;

      const current = event.currentTarget;
      const group = Array.from(
        current.ownerDocument.getElementsByName(current.name),
      ).filter(
        (element): element is HTMLInputElement =>
          element instanceof HTMLInputElement &&
          element.type === "radio" &&
          element.form === current.form &&
          !element.disabled,
      );
      const currentIndex = group.indexOf(current);
      if (currentIndex < 0 || group.length < 2) return;

      event.preventDefault();
      const nextIndex = (currentIndex + offset + group.length) % group.length;
      const next = group[nextIndex];
      next?.focus();
      next?.click();
    };

    return (
      <label
        className={cn(
          "relative block",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        <input
          ref={ref}
          type="radio"
          className="peer sr-only"
          disabled={disabled}
          onKeyDown={handleKeyDown}
          {...inputProps}
        />
        <span
          className={cn(
            "min-h-control-medium w-full items-center gap-slot-medium py-2 rounded-control-medium border-control border-border-subtle bg-bg-surface px-control-pad-medium text-fg-default outline-none transition-colors duration-control ease-control",
            contentAlignment === "center"
              ? "grid grid-cols-[auto_minmax(0,1fr)_auto]"
              : "flex",
            !disabled && "hover:border-border-default hover:bg-bg-subtle",
            "peer-checked:border-primary peer-checked:bg-primary-subtle",
            "peer-checked:hover:bg-primary-subtle",
            "peer-focus:ring-control peer-focus:ring-focus-primary peer-focus:ring-offset-2 peer-focus:ring-offset-bg-surface",
            "peer-disabled:border-border-subtle peer-disabled:bg-bg-disabled peer-disabled:text-fg-disabled",
            "peer-disabled:[&_[data-radio-indicator]]:border-border-default peer-disabled:[&_[data-radio-indicator]]:bg-bg-radio-disabled-indicator",
            "peer-disabled:[&_[data-radio-dot]]:bg-icon-disabled peer-disabled:[&_[data-radio-leading]]:text-icon-disabled",
            "peer-checked:[&_[data-radio-dot]]:scale-50 peer-checked:[&_[data-radio-indicator]]:border-primary",
          )}
        >
          <span
            aria-hidden="true"
            data-radio-indicator
            className="flex h-slot-icon-medium w-slot-icon-medium shrink-0 items-center justify-center rounded-full border-2 border-border-default bg-bg-surface transition-colors duration-control ease-control"
          >
            <span
              data-radio-dot
              className="h-slot-icon-medium w-slot-icon-medium scale-0 rounded-full bg-primary transition-transform duration-control ease-control"
            />
          </span>
          <span
            data-radio-content
            className={cn(
              "flex min-w-0 items-center gap-slot-medium",
              contentAlignment === "center" && "justify-self-center",
            )}
          >
            {leadingIcon ? (
              <span
                aria-hidden="true"
                data-radio-leading
                className="flex h-slot-icon-medium w-slot-icon-medium shrink-0 items-center justify-center text-icon-secondary [&>*]:h-slot-icon-medium [&>*]:w-slot-icon-medium"
              >
                {leadingIcon}
              </span>
            ) : null}
            <span
              data-radio-label
              className="min-w-0 text-left text-control-medium font-control-field"
              style={
                group?.equalizeLabelWidth
                  ? {
                      width:
                        group.maxLabelWidth === null
                          ? undefined
                          : `${group.maxLabelWidth}px`,
                    }
                  : undefined
              }
            >
              <span
                ref={setLabelTextRef}
                data-radio-label-text
                className="inline-block whitespace-nowrap"
              >
                {children}
              </span>
            </span>
          </span>
          {contentAlignment === "center" ? (
            <span
              aria-hidden="true"
              data-radio-balance
              className="h-slot-icon-medium w-slot-icon-medium"
            />
          ) : null}
        </span>
      </label>
    );
  },
);

RadioItem.displayName = "Radio.Item";

export const Radio = {
  Group: RadioGroup,
  Item: RadioItem,
};
