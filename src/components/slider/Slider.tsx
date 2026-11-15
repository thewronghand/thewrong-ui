import { forwardRef, useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { SliderProps } from "./types";
import { normalizeSliderValue, sliderPercent } from "./utils";

/**
 * 단일 thumb 네이티브 범위 입력. aria-label 또는 연결된 label을 제공한다.
 * 범위 밖 controlled 값은 화면에서만 범위 내로 보정하며 그 자체로 onValueChange를 호출하지 않는다.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    onValueChange,
    formatValue,
    className,
    style,
    "aria-valuetext": ariaValueText,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = defaultValue ?? min + (max - min) / 2;
  const [internalValue, setInternalValue] = useState(initialValue);
  const current = normalizeSliderValue(value ?? internalValue, min, max, step);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || value !== undefined) return;
    const reset = () => setInternalValue(initialValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [value, initialValue]);

  return (
    <input
      {...rest}
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      aria-valuetext={formatValue ? formatValue(current) : ariaValueText}
      onChange={(event) => {
        const next = normalizeSliderValue(event.currentTarget.valueAsNumber, min, max, step);
        if (value === undefined) setInternalValue(next);
        onValueChange?.(next);
      }}
      className={cn("ui-slider", className)}
      style={{ ...style, "--slider-fill": `${sliderPercent(current, min, max)}%` } as CSSProperties}
    />
  );
});
