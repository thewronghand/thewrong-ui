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
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
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
import { useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PickerSheet, usePickerMobile } from "./PickerSheet";

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface DateRangePickerProps {
  /** 트리거 (버튼/탭 등). asChild처럼 children을 클릭 가능한 요소로 받음 */
  children: ReactNode;
  value?: DateRange;
  onApply: (range: DateRange) => void;
  disabled?: boolean;
  /** 이미 바텀시트 안에 있으면 모바일에서도 popover로 표시한다. Modal에서는 생략 시 자동 적용되며, false를 명시하면 시트를 유지한다. */
  disableMobileSheet?: boolean;
}

const MONTH_LIST_RANGE = 24;

/**
 * 날짜 범위 선택 popover.
 *
 * 위치 계산은 floating-ui 위임 — autoUpdate가 스크롤/리사이즈 시 좌표 자동 갱신.
 * 모바일에선 바텀시트로 풀스크린 전환(트리거 위치 계산 무시) + 단일 캘린더.
 * 데스크탑은 두 달 가로 배치.
 */
export function DateRangePicker({
  children,
  value,
  onApply,
  disabled,
  disableMobileSheet,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, useSheet } = usePickerMobile(disableMobileSheet);

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

  const handleApply = (range: DateRange) => {
    onApply(range);
    setIsOpen(false);
  };

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
        context={context}
        setFloating={refs.setFloating}
        floatingStyles={floatingStyles}
        getFloatingProps={getFloatingProps}
        desktopClassName="z-floating rounded-2xl border border-border-subtle bg-bg-surface text-fg-default p-6 shadow-tooltip"
      >
        <DateRangeBody
          value={value}
          isMobile={isMobile}
          onApply={handleApply}
          onClose={() => setIsOpen(false)}
        />
      </PickerSheet>
    </>
  );
}

interface DateRangeBodyProps {
  value?: DateRange;
  isMobile: boolean;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

function DateRangeBody({ value, isMobile, onApply, onClose }: DateRangeBodyProps) {
  const initialFrom = parseSafe(value?.from);
  const initialTo = parseSafe(value?.to);

  const [pendingFrom, setPendingFrom] = useState<Date | null>(initialFrom);
  const [pendingTo, setPendingTo] = useState<Date | null>(initialTo);
  const [leftMonth, setLeftMonth] = useState<Date>(initialFrom ?? new Date());

  const rightMonth = addMonths(leftMonth, 1);

  const handleDayClick = (day: Date) => {
    if (!pendingFrom || (pendingFrom && pendingTo)) {
      setPendingFrom(day);
      setPendingTo(null);
      return;
    }
    if (isBefore(day, pendingFrom)) {
      setPendingFrom(day);
      setPendingTo(null);
      return;
    }
    setPendingTo(day);
  };

  const handleApply = () => {
    if (!pendingFrom) {
      onClose();
      return;
    }
    onApply({
      from: format(pendingFrom, "yyyy-MM-dd"),
      to: format(pendingTo ?? pendingFrom, "yyyy-MM-dd"),
    });
  };

  const footer = (
    <div className="mt-6 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-full bg-bg-subtle px-5 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-bg-muted"
      >
        닫기
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="cursor-pointer rounded-full bg-primary px-5 py-2 text-sm font-semibold text-fg-inverse transition-opacity hover:opacity-90"
      >
        적용
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="flex justify-center">
          <CalendarPanel
            month={leftMonth}
            onMonthChange={setLeftMonth}
            onPrev={() => setLeftMonth(subMonths(leftMonth, 1))}
            onNext={() => setLeftMonth(addMonths(leftMonth, 1))}
            showPrev
            showNext
            rangeFrom={pendingFrom}
            rangeTo={pendingTo}
            onDayClick={handleDayClick}
          />
        </div>
        {footer}
      </>
    );
  }

  return (
    <>
      <div className="flex items-stretch gap-8">
        <CalendarPanel
          month={leftMonth}
          onMonthChange={setLeftMonth}
          onPrev={() => setLeftMonth(subMonths(leftMonth, 1))}
          showPrev
          rangeFrom={pendingFrom}
          rangeTo={pendingTo}
          onDayClick={handleDayClick}
        />
        <div className="w-px bg-border-subtle" />
        <CalendarPanel
          month={rightMonth}
          onMonthChange={(m) => setLeftMonth(subMonths(m, 1))}
          onNext={() => setLeftMonth(addMonths(leftMonth, 1))}
          showNext
          rangeFrom={pendingFrom}
          rangeTo={pendingTo}
          onDayClick={handleDayClick}
        />
      </div>
      {footer}
    </>
  );
}

interface CalendarPanelProps {
  month: Date;
  onMonthChange: (m: Date) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  rangeFrom: Date | null;
  rangeTo: Date | null;
  onDayClick: (day: Date) => void;
}

function CalendarPanel({
  month,
  onMonthChange,
  onPrev,
  onNext,
  showPrev,
  showNext,
  rangeFrom,
  rangeTo,
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
    <div className="flex w-full max-w-[300px] flex-col sm:w-[260px]">
      <div className="mb-4 flex items-center justify-between">
        <NavButton direction="left" onClick={onPrev} visible={!!showPrev} />
        <div className="relative flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1 rounded px-3 py-1.5 text-sm font-semibold text-fg-default transition-colors hover:bg-bg-subtle"
          >
            {format(month, "yyyy. MM.")}
            <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
          </button>
          {dropdownOpen && (
            <div className="scrollbar-brand absolute top-full z-20 mt-1 max-h-[240px] w-[140px] overflow-y-auto rounded-lg border border-border-subtle bg-bg-surface py-1 shadow-overlay">
              {monthOptions.map((m) => {
                const selected = isSameMonth(m, month);
                return (
                  <button
                    key={m.toISOString()}
                    type="button"
                    onClick={() => {
                      onMonthChange(m);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full cursor-pointer bg-bg-surface px-4 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-bg-muted font-semibold text-fg-default"
                        : "text-fg-muted hover:bg-bg-subtle",
                    )}
                  >
                    {format(m, "yyyy. MM.")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <NavButton direction="right" onClick={onNext} visible={!!showNext} />
      </div>

      <div className="mb-2 grid grid-cols-7">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-fg-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 일자 그리드: 회색 띠가 셀 사이에서 끊기지 않도록 좌/우 반쪽 배경을 분리해서 칠함 */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isFrom = !!(rangeFrom && isSameDay(day, rangeFrom));
          const isTo = !!(rangeTo && isSameDay(day, rangeTo));
          const isInRange =
            !!rangeFrom && !!rangeTo && isAfter(day, rangeFrom) && isBefore(day, rangeTo);
          const isEdge = isFrom || isTo;

          const fillLeft = isInRange || (isTo && !!rangeFrom);
          const fillRight = isInRange || (isFrom && !!rangeTo);

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
              {fillLeft && (
                <span
                  className="absolute inset-y-0 left-0 right-1/2 bg-bg-muted"
                  aria-hidden
                />
              )}
              {fillRight && (
                <span
                  className="absolute inset-y-0 left-1/2 right-0 bg-bg-muted"
                  aria-hidden
                />
              )}
              {isEdge && (
                <span
                  className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10",
                  !inMonth && "text-fg-disabled",
                  inMonth && !isEdge && "text-fg-default",
                  isEdge && "font-bold text-fg-inverse",
                )}
              >
                {format(day, "d")}
              </span>
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
  visible,
}: {
  direction: "left" | "right";
  onClick?: () => void;
  visible: boolean;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  if (!visible) return <div className="w-8" />;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:bg-bg-subtle"
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
