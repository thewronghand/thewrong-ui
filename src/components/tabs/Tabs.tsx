import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { nextTabIndex } from "./navigation";
import type { TabsProps } from "./types";

/**
 * 가로 탭. SegmentedControl처럼 항목 배열을 받으며 패널 내용은 선택된 경우에만 마운트한다.
 * 자동 활성화는 패널 내용이 즉시 준비될 때 적합하다. 지연이 있으면 manual을 사용한다.
 * 탭 목록의 접근성 이름은 aria-label 또는 aria-labelledby로 지정한다.
 * value가 활성 항목에 없으면 첫 활성 탭을 표시하며 onValueChange는 호출하지 않는다. 부모에서 값을 맞춘다.
 */
export function Tabs<V extends string>({
  items,
  value,
  defaultValue,
  onValueChange,
  activation = "auto",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
}: TabsProps<V>) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [internalValue, setInternalValue] = useState<V | undefined>(defaultValue);
  const [focused, setFocused] = useState<V | undefined>();
  const requested = value ?? internalValue;
  const selected = items.find((item) => item.value === requested && !item.disabled)?.value
    ?? items.find((item) => !item.disabled)?.value;
  const focusedValue = items.find((item) => item.value === focused && !item.disabled)?.value ?? selected;

  const select = (next: V) => {
    if (next === selected) return;
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // Alt+← (뒤로 가기)·Cmd/Ctrl+Home 등 브라우저 단축키는 가로채지 않는다
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = nextTabIndex(items.map((item) => Boolean(item.disabled)), index, event.key);
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
    if (activation === "auto" && next !== index) select(items[next]!.value);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="flex gap-1 border-b border-border-subtle"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(undefined);
        }}
      >
        {items.map((item, index) => (
          <button
            key={item.value}
            ref={(node) => { refs.current[index] = node; }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={item.value === selected}
            tabIndex={item.value === focusedValue ? 0 : -1}
            disabled={item.disabled}
            onFocus={() => setFocused(item.value)}
            onClick={() => select(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-control focus-visible:ring-inset focus-visible:ring-focus-primary disabled:cursor-not-allowed disabled:text-fg-disabled disabled:opacity-60",
              item.value === selected
                ? "border-primary-fg text-primary-fg"
                : "border-transparent text-fg-muted hover:text-fg-default",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={item.value !== selected}
          tabIndex={0}
          className="pt-4 outline-none focus-visible:ring-control focus-visible:ring-focus-primary"
        >
          {item.value === selected ? item.content : null}
        </div>
      ))}
    </div>
  );
}
