import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";
import type { SegmentedControlProps } from "./types";

/**
 * 알약형 컨테이너 하나 안에 칸으로 나뉜 세그먼트 컨트롤.
 *
 * 2~3택 짧은 선택지가 여러 줄 쌓이는 설정 화면에 적합하다. 원형 indicator
 * 없이 흰 바탕+테두리 컨테이너 안에서 칸이 폭을 균등 분배(2택=50%,
 * 3택=33%)하며, 선택 표시는 각 칸의 배경이 아니라 컨테이너 안에서
 * 미끄러지는 인디케이터 하나(`bg-bg-subtle`)가 담당한다.
 *
 * 네이티브 semantics(`role="radiogroup"` + sr-only `type="radio"` input)를
 * 유지해 방향키 roving focus·Space 선택·스크린리더 announcement가 그대로
 * 동작한다.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   aria-label="주기"
 *   value={period}
 *   onChange={setPeriod}
 *   options={[
 *     { value: "month", label: "월간" },
 *     { value: "year", label: "연간" },
 *   ]}
 * />
 * ```
 */
export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled,
  className,
}: SegmentedControlProps<V>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  const labelRefs = useRef(new Map<V, HTMLLabelElement>());
  const observerRef = useRef<ResizeObserver | null>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    // 첫 측정(마운트 직후 커밋)에는 transition을 꺼서 인디케이터가 width
    // 0에서 날아오는 모습이 보이지 않게 한다. state에 담아야 그 첫 커밋의
    // 렌더 결과물(className)에 실제로 반영된다 — ref는 리렌더를 트리거하지
    // 않으므로 첫 setIndicator가 유발하는 바로 그 리렌더 시점에는 이미 값이
    // 갱신돼 있어 무의미하다.
    animate: boolean;
  } | null>(null);

  const measure = useCallback(() => {
    const selectedLabel = labelRefs.current.get(value);
    if (!selectedLabel) {
      setIndicator(null);
      return;
    }
    setIndicator((previous) => ({
      left: selectedLabel.offsetLeft,
      width: selectedLabel.offsetWidth,
      animate: previous !== null,
    }));
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observerRef.current = observer;
    labelRefs.current.forEach((label) => observer.observe(label));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [measure]);

  const setLabelRef = useCallback(
    (optionValue: V) => (label: HTMLLabelElement | null) => {
      const previous = labelRefs.current.get(optionValue);
      if (previous) observerRef.current?.unobserve(previous);

      if (label) {
        labelRefs.current.set(optionValue, label);
        observerRef.current?.observe(label);
      } else {
        labelRefs.current.delete(optionValue);
      }
    },
    [],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "relative inline-flex items-stretch gap-1 rounded-control-medium border-control border-border-subtle bg-bg-surface p-1",
        className,
      )}
    >
      <span
        aria-hidden="true"
        data-segmented-control-indicator
        className={cn(
          "pointer-events-none absolute top-1 bottom-1 left-0 rounded-control-small bg-bg-subtle transition-[transform,width] duration-200 ease-out motion-reduce:transition-none",
          !indicator?.animate && "transition-none",
          !indicator && "hidden",
        )}
        style={{
          transform: `translateX(${indicator?.left ?? 0}px)`,
          width: `${indicator?.width ?? 0}px`,
        }}
      />
      {options.map((option) => {
        const checked = option.value === value;
        const itemDisabled = disabled || option.disabled;

        return (
          <label
            key={option.value}
            ref={setLabelRef(option.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center",
              itemDisabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <input
              type="radio"
              className="peer sr-only"
              name={groupName}
              value={option.value}
              checked={checked}
              disabled={itemDisabled}
              onChange={() => onChange(option.value)}
              onKeyDown={handleKeyDown}
            />
            {/* 세그먼트 칸 — 흰 바탕+테두리 컨테이너 안에서 칸이 폭을 균등
                분배(2택=50%, 3택=33%)한다. 선택 표시는 이 span의 배경이
                아니라 위 인디케이터(data-segmented-control-indicator)
                하나가 칸 사이를 미끄러지며 담당한다. 글자는 강조색 없이
                기본색·세미볼드로만 구분한다. */}
            <span
              className={cn(
                "relative z-10 flex h-full w-full min-w-0 items-center justify-center gap-slot-small rounded-control-small px-2 py-1.5 text-control-small font-control-field font-medium text-fg-muted outline-none transition-colors duration-control ease-control",
                !itemDisabled && "hover:text-fg-default",
                "peer-checked:font-semibold peer-checked:text-fg-default",
                "peer-focus:ring-control peer-focus:ring-focus-primary peer-focus:ring-offset-2 peer-focus:ring-offset-bg-surface",
                "peer-disabled:text-fg-disabled peer-disabled:hover:bg-transparent",
              )}
            >
              {option.icon ? (
                <span
                  aria-hidden="true"
                  data-segmented-control-leading
                  className="flex h-slot-icon-small w-slot-icon-small shrink-0 items-center justify-center [&>*]:h-slot-icon-small [&>*]:w-slot-icon-small"
                >
                  {option.icon}
                </span>
              ) : null}
              <span data-segmented-control-label className="min-w-0 truncate">
                {option.label}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
