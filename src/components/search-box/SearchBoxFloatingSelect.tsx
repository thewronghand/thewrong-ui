import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size as floatingSize,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { SelectOption } from "@/components/select";

interface Props {
  /** 라벨 — 미선택일 땐 인풋 안의 placeholder처럼, 선택/포커스 시 상단 보더로 부유. */
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (next: string) => void;
  size: "mini" | "small";
}

/**
 * SearchBox 전용 플로팅 라벨 셀렉트.
 *
 * 단일 선택 — value가 빈 문자열이면 미선택(라벨이 안에 머무름).
 * 선택되면 라벨이 상단 보더로 떠오르고 트리거에는 선택 옵션 라벨이 표시됨.
 *
 * SearchBoxFloatingInput과 시각적 일관성을 위해 동일한 사이즈/라벨 규칙 적용.
 */
export function SearchBoxFloatingSelect({
  label,
  options,
  value,
  onChange,
  size,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const selected = options.find((o) => String(o.value) === value);
  const filled = Boolean(selected);
  const floated = isOpen || filled;

  const heightClass = size === "mini" ? "h-8" : "h-10";
  const textClass = size === "mini" ? "text-xs" : "text-sm";
  const paddingX = size === "mini" ? "px-2.5" : "px-3";

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        {...getReferenceProps()}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`relative ${heightClass} w-full rounded-lg border bg-bg-white ${paddingX} text-left transition-colors focus-visible:border-primary-500 focus-visible:outline-hidden ${
          isOpen
            ? "border-primary-500"
            : "border-border-tertiary dark:border-border-secondary"
        }`}
      >
        <div className="flex h-full w-full items-center justify-between gap-2">
          {/*
            트리거 안 텍스트:
            - 선택값 있음 → 선택 옵션 라벨
            - 미선택 + 라벨 떠있음(=open) → 비움 (라벨이 위에 있으므로 placeholder 중복 회피)
            - 미선택 + 라벨 안에 머무름 → 비움 (라벨이 placeholder 역할)
          */}
          <span
            className={`truncate ${textClass} ${
              filled ? "text-text-primary" : "text-text-tertiary"
            }`}
          >
            {filled ? selected!.label : ""}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-icon-tertiary transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        {/* 플로팅 라벨 — input wrapper와 동일 규칙. 노치 배경은 트리거 배경(white)과 일치. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-2 px-1 transition-all bg-bg-white ${
            floated
              ? `-top-2 ${size === "mini" ? "text-[10px]" : "text-xs"} ${
                  isOpen ? "text-primary-500" : "text-text-secondary"
                }`
              : `top-1/2 -translate-y-1/2 ${textClass} text-text-tertiary`
          }`}
        >
          {label}
        </span>
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-9999 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            {options.map((opt) => {
              const optValue = String(opt.value);
              const checked = optValue === value;
              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${textClass} ${
                    checked ? "text-text-primary" : "text-text-secondary"
                  }`}
                  role="option"
                  aria-selected={checked}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {checked && (
                    <Check className="h-3 w-3 text-primary-500" strokeWidth={3} />
                  )}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-tertiary">
                옵션이 없어요
              </div>
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
