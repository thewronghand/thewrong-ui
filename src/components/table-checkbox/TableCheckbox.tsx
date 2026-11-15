import { forwardRef, useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  /** 일부만 선택된 상태(전체선택 헤더용). true이면 가로선 아이콘 표시. */
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /** 드래그 선택 등 부모가 클릭을 가로챌 때 hit-test를 비활성화한다. */
  pointerEventsNone?: boolean;
  ariaLabel?: string;
}

/**
 * 테이블 전용 체크박스. 시각용 box를 label로 감싸 클릭/접근성을 확보하고, 드래그 선택 모드에선
 * pointerEventsNone로 부모가 마우스를 가로챌 수 있게 한다.
 */
export const TableCheckbox = forwardRef<HTMLInputElement, Props>(
  function TableCheckbox(
    {
      checked,
      indeterminate = false,
      disabled = false,
      onChange,
      pointerEventsNone = false,
      ariaLabel,
    },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (el) el.indeterminate = indeterminate && !checked;
    }, [indeterminate, checked]);

    const showIndeterminate = indeterminate && !checked;
    const isOn = checked || showIndeterminate;

    return (
      <label
        className={cn(
          "relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          "cursor-pointer has-[:disabled]:cursor-not-allowed",
          pointerEventsNone && "pointer-events-none",
        )}
        style={{ flex: "0 0 18px" }}
        aria-label={ariaLabel}
      >
        <input
          ref={(el) => {
            innerRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          type="checkbox"
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-checkbox border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-focus-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-surface",
            isOn ? "border-primary bg-primary" : "border-border-default bg-bg-surface",
            "peer-disabled:opacity-40",
          )}
        >
          {showIndeterminate ? (
            <Minus className="h-3 w-3 text-fg-inverse" strokeWidth={3} />
          ) : checked ? (
            <Check className="h-3 w-3 text-fg-inverse" strokeWidth={3} />
          ) : null}
        </span>
      </label>
    );
  },
);
