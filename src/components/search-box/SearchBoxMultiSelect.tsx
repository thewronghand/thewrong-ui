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
  /** 라벨 — 미선택일 땐 트리거 안의 placeholder처럼, 선택/오픈 시 상단 보더로 부유. */
  label: string;
  options: SelectOption[];
  /** CSV 직렬화된 값. 빈 문자열이면 선택 없음. */
  value: string;
  onChange: (csv: string) => void;
  size: "mini" | "small";
}

/**
 * SearchBox 전용 다중 선택. 트리거 버튼 + 드롭다운 체크박스 리스트.
 *
 * 값은 CSV(string) 직렬화 — URL/zod schema와의 호환을 위해 SearchValues `Record<string, string>`
 * 시그니처를 유지한다. 빈 값이면 미선택, "A,B"면 두 항목 선택.
 *
 * SearchBoxFloatingInput/Select와 동일한 플로팅 라벨 UX. 보더와 라벨이 포커스/오픈 시
 * primary-500으로 통일된다.
 *
 * source의 MultiSelectDropdown은 number[] 전용이라 사용 불가. 별도 inline 컴포넌트.
 *
 * 위치 계산은 floating-ui 위임 — autoUpdate가 스크롤/리사이즈 시 좌표를 자동 갱신.
 */
export function SearchBoxMultiSelect({
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
      // dropdown width를 trigger와 동기화.
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

  const selected = value ? value.split(",").filter(Boolean) : [];
  const selectedSet = new Set(selected);
  const filled = selected.length > 0;
  const floated = isOpen || filled;

  const toggle = (optValue: string) => {
    const next = new Set(selectedSet);
    if (next.has(optValue)) next.delete(optValue);
    else next.add(optValue);
    // options 순서 유지를 위해 options 기준으로 재구성.
    const ordered = options
      .filter((o) => next.has(String(o.value)))
      .map((o) => String(o.value));
    onChange(ordered.join(","));
  };

  const heightClass = size === "mini" ? "h-8" : "h-10";
  const textClass = size === "mini" ? "text-xs" : "text-sm";
  const paddingX = size === "mini" ? "px-2.5" : "px-3";

  // 트리거 텍스트 — 선택된 옵션 라벨 CSV. 미선택이면 비움(라벨이 placeholder 역할).
  const triggerText = filled
    ? options
        .filter((o) => selectedSet.has(String(o.value)))
        .map((o) => o.label)
        .join(", ")
    : "";

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
          <span
            className={`truncate ${textClass} ${
              filled ? "text-text-primary" : "text-text-tertiary"
            }`}
          >
            {triggerText}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-icon-tertiary transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        {/* 플로팅 라벨 — 노치 배경은 트리거 배경(white)과 일치. */}
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
              const checked = selectedSet.has(optValue);
              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => toggle(optValue)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${textClass} ${
                    checked ? "text-text-primary" : "text-text-secondary"
                  }`}
                  role="option"
                  aria-selected={checked}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 truncate">{opt.label}</span>
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
