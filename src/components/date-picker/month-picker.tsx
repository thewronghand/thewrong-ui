import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PickerSheet, usePickerMobile } from "./PickerSheet";

export interface MonthValue {
  year: number;
  month: number;
}

interface MonthPickerProps {
  /** 트리거 요소. children에 클릭 가능한 노드를 넘긴다. */
  children: ReactNode;
  value?: MonthValue;
  onChange: (value: MonthValue) => void;
  disabled?: boolean;
  /**
   * true면 모바일에서도 바텀시트 대신 popover로 뜬다. 이미 바텀시트(SearchBox 필터 등) 안에
   * 있을 때 시트가 겹치는 걸 막는다.
   */
  disableMobileSheet?: boolean;
}

/**
 * 월(YYYY.MM) 선택 popover.
 *
 * 위치 계산은 floating-ui 위임 — autoUpdate가 스크롤/리사이즈 시 좌표 자동 갱신.
 * 모바일에선 바텀시트로 풀스크린 전환(disableMobileSheet면 popover 유지).
 */
export function MonthPicker({
  children,
  value,
  onChange,
  disabled,
  disableMobileSheet = false,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { useSheet } = usePickerMobile(disableMobileSheet);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (next) => {
      if (disabled) return;
      setIsOpen(next);
    },
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handleSelect = (next: MonthValue) => {
    onChange(next);
    setIsOpen(false);
  };

  const today = new Date();
  const initialYear = value?.year ?? today.getFullYear();
  const [viewYear, setViewYear] = useState(initialYear);

  const grid = (
    <MonthGrid
      year={viewYear}
      onYearChange={setViewYear}
      selectedYear={value?.year}
      selectedMonth={value?.month}
      currentYear={today.getFullYear()}
      currentMonth={today.getMonth() + 1}
      onSelect={(month) => handleSelect({ year: viewYear, month })}
    />
  );

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex"
      >
        {children}
      </span>
      <PickerSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        useSheet={useSheet}
        setFloating={refs.setFloating}
        floatingStyles={floatingStyles}
        getFloatingProps={getFloatingProps}
        desktopClassName="z-floating w-70 rounded-2xl border border-border-subtle bg-bg-surface text-fg-default p-5 shadow-tooltip"
      >
        {grid}
      </PickerSheet>
    </>
  );
}

interface MonthGridProps {
  year: number;
  onYearChange: (year: number) => void;
  selectedYear?: number;
  selectedMonth?: number;
  currentYear: number;
  currentMonth: number;
  onSelect: (month: number) => void;
}

function MonthGrid({
  year,
  onYearChange,
  selectedYear,
  selectedMonth,
  currentYear,
  currentMonth,
  onSelect,
}: MonthGridProps) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <NavButton direction="left" onClick={() => onYearChange(year - 1)} />
        <div className="flex-1 text-center text-sm font-semibold text-fg-default">
          {year}년
        </div>
        <NavButton direction="right" onClick={() => onYearChange(year + 1)} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {months.map((m) => {
          const isSelected = selectedYear === year && selectedMonth === m;
          const isCurrent = year === currentYear && m === currentMonth;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelect(m)}
              className={cn(
                "h-10 cursor-pointer rounded-lg text-sm transition-colors",
                isSelected
                  ? "bg-primary font-bold text-fg-inverse"
                  : isCurrent
                    ? "bg-bg-muted font-semibold text-fg-default"
                    : "text-fg-default hover:bg-bg-subtle",
              )}
              aria-label={`${year}년 ${m}월`}
              aria-pressed={isSelected}
            >
              {m}월
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:bg-bg-subtle"
      aria-label={direction === "left" ? "이전 해" : "다음 해"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
