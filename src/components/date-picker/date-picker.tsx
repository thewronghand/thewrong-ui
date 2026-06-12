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
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";

import { useBottomSheetDrag, useIsMobile, useScrollLock } from "@/hooks";
import { cn } from "@/lib/utils";
import { AnimatedHeight } from "@/components/animated-height";

interface DatePickerProps {
  /** 트리거 — children 자체가 클릭 대상. */
  children: ReactNode;
  /** yyyy-MM-dd. 빈 문자열/null이면 미선택. */
  value?: string | null;
  onApply: (date: string) => void;
  disabled?: boolean;
  /**
   * true면 모바일에서도 자체 바텀시트 대신 데스크톱과 동일한 popover로 표시.
   * 호출부가 이미 바텀시트(예: SearchBox 모바일 시트) 안에 있어 시트 두 개가 겹치는 걸 피할 때 사용.
   */
  disableMobileSheet?: boolean;
}

const MONTH_LIST_RANGE = 24;

/**
 * 단일 날짜 선택 popover.
 *
 * 위치 계산은 floating-ui 위임 — autoUpdate가 스크롤/리사이즈 시 좌표 자동 갱신.
 * 모바일에선 바텀시트로 풀스크린 전환(트리거 위치 계산 무시).
 */
export function DatePicker({
  children,
  value,
  onApply,
  disabled,
  disableMobileSheet = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobileRaw = useIsMobile();
  const isMobile = isMobileRaw && !disableMobileSheet;

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

  // 모바일 바텀시트 열렸을 때 body 스크롤 잠금.
  useScrollLock(isOpen && isMobile);

  const handleApply = (date: string) => {
    onApply(date);
    setIsOpen(false);
  };

  // 모바일 바텀시트 드래그-다운 닫기 (공용 훅).
  const { dragControls, handleDragEnd, startDrag } = useBottomSheetDrag({
    onDismiss: () => setIsOpen(false),
  });

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
            {/* dimmer — AnimatePresence로 감싸 fade-out 적용. */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="date-picker-dimmer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/40"
                  onClick={() => setIsOpen(false)}
                />
              )}
            </AnimatePresence>
            {/* 시트 — exit 모션 실행 위해 AnimatePresence 필수. */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="date-picker-sheet"
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
                  <DatePickerBody
                    initialValue={value}
                    onApply={handleApply}
                    onClose={() => setIsOpen(false)}
                  />
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
              className="z-9999 w-80 rounded-2xl border border-border-tertiary bg-bg-card p-6 shadow-md"
            >
              <DatePickerBody
                initialValue={value}
                onApply={handleApply}
                onClose={() => setIsOpen(false)}
              />
            </div>
          )
        )}
      </FloatingPortal>
    </>
  );
}

interface DatePickerBodyProps {
  initialValue?: string | null;
  onApply: (date: string) => void;
  onClose: () => void;
}

/**
 * DatePicker 본체(캘린더 + 닫기/적용 버튼)만 — 컨테이너(popover/시트) 없이.
 *
 * SearchBox 바텀시트 안처럼 부모 컨테이너(ModalSubView 등)에 직접 캘린더만 마운트하고 싶을 때 쓴다.
 * 일반 사용처는 `<DatePicker>`를 그대로 사용.
 */
export function DatePickerBody({ initialValue, onApply, onClose }: DatePickerBodyProps) {
  const initial = parseSafe(initialValue);
  const [pending, setPending] = useState<Date | null>(initial);
  const [month, setMonth] = useState<Date>(initial ?? new Date());

  const handleApplyClick = () => {
    if (!pending) {
      onClose();
      return;
    }
    onApply(format(pending, "yyyy-MM-dd"));
  };

  return (
    <>
      <CalendarPanel
        month={month}
        onMonthChange={setMonth}
        onPrev={() => setMonth(subMonths(month, 1))}
        onNext={() => setMonth(addMonths(month, 1))}
        selected={pending}
        onDayClick={(day) => setPending(day)}
      />
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full bg-bg-base-primary px-5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-base-secondary"
        >
          닫기
        </button>
        <button
          type="button"
          onClick={handleApplyClick}
          className="cursor-pointer rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          적용
        </button>
      </div>
    </>
  );
}

interface CalendarPanelProps {
  month: Date;
  onMonthChange: (m: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  selected: Date | null;
  onDayClick: (day: Date) => void;
}

function CalendarPanel({
  month,
  onMonthChange,
  onPrev,
  onNext,
  selected,
  onDayClick,
}: CalendarPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthOptions = useMemo(() => {
    const list: Date[] = [];
    for (let i = -MONTH_LIST_RANGE; i <= MONTH_LIST_RANGE; i++) {
      list.push(addMonths(startOfMonth(new Date()), i));
    }
    return list;
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-75 flex-col sm:w-65">
      <div className="mb-4 flex items-center justify-between">
        <NavButton direction="left" onClick={onPrev} />
        <div className="relative flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1 rounded px-3 py-1.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-base-primary"
          >
            {format(month, "yyyy. MM.")}
            <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
          </button>
          {dropdownOpen && (
            <div className="scrollbar-brand absolute top-full z-20 mt-1 max-h-60 w-35 overflow-y-auto rounded-lg border border-border-tertiary bg-bg-card py-1 shadow-lg">
              {monthOptions.map((m) => {
                const isSelected = isSameMonth(m, month);
                return (
                  <button
                    key={m.toISOString()}
                    type="button"
                    onClick={() => {
                      onMonthChange(m);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full cursor-pointer bg-bg-card px-4 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-bg-base-secondary font-semibold text-text-primary"
                        : "text-text-secondary hover:bg-bg-base-primary",
                    )}
                  >
                    {format(m, "yyyy. MM.")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <NavButton direction="right" onClick={onNext} />
      </div>

      <div className="mb-2 grid grid-cols-7">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>

      <AnimatedHeight>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isSelected = !!(selected && isSameDay(day, selected));

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (!inMonth) onMonthChange(day);
                onDayClick(day);
              }}
              className="group relative flex h-9 cursor-pointer items-center justify-center text-sm"
              aria-label={format(day, "yyyy년 M월 d일", { locale: ko })}
            >
              {isSelected && (
                <span
                  className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10",
                  !inMonth && "text-text-disabled",
                  inMonth && !isSelected && "text-text-primary",
                  isSelected && "font-bold text-white",
                )}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
        </div>
      </AnimatedHeight>
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
      aria-label={direction === "left" ? "이전 달" : "다음 달"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function parseSafe(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}
