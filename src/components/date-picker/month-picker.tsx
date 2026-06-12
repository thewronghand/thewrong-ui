import {
  FloatingPortal,
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
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { useBottomSheetDrag, useIsMobile, useScrollLock } from "@/hooks";
import { cn } from "@/lib/utils";

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
  // 바텀시트 안(disableMobileSheet)에서는 모바일이어도 popover로 — 시트 겹침 방지.
  const isMobile = useIsMobile() && !disableMobileSheet;

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

  useScrollLock(isOpen && isMobile);

  // 모바일 바텀시트 드래그-다운 닫기 (공용 훅).
  const { dragControls, handleDragEnd, startDrag } = useBottomSheetDrag({
    onDismiss: () => setIsOpen(false),
  });

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
      <FloatingPortal>
        {isMobile ? (
          <>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="month-picker-dimmer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/40"
                  onClick={() => setIsOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="month-picker-sheet"
                  ref={refs.setFloating}
                  {...getFloatingProps()}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{
                    y: "100%",
                    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 320 }}
                  drag="y"
                  dragListener={false}
                  dragControls={dragControls}
                  dragConstraints={{ top: 0 }}
                  dragElastic={{ top: 0, bottom: 0.4 }}
                  onDragEnd={handleDragEnd}
                  className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-5 rounded-t-2xl bg-bg-card p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl"
                >
                  <div
                    className="self-center h-1 w-10 rounded-full bg-bg-base-tertiary cursor-grab touch-none active:cursor-grabbing"
                    onPointerDown={startDrag}
                  />
                  {grid}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          isOpen && (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-9999 w-70 rounded-2xl border border-border-tertiary bg-bg-card p-5 shadow-md"
            >
              {grid}
            </div>
          )
        )}
      </FloatingPortal>
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
        <div className="flex-1 text-center text-sm font-semibold text-text-primary">
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
                  ? "bg-primary-500 font-bold text-white"
                  : isCurrent
                    ? "bg-bg-base-secondary font-semibold text-text-primary"
                    : "text-text-primary hover:bg-bg-base-primary",
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
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-tertiary text-text-secondary transition-colors hover:bg-bg-base-primary"
      aria-label={direction === "left" ? "이전 해" : "다음 해"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
