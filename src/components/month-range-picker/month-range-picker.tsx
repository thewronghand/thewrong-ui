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
import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from "react";

import { Button } from "@/components/button";
import {
  PickerSheet,
  usePickerMobile,
} from "@/components/date-picker/PickerSheet";
import type { MonthValue } from "@/components/date-picker";
import { cn } from "@/lib/utils";
import {
  compareMonths,
  completeMonthRange,
  selectMonth,
  shiftMonth,
  type MonthRange,
} from "./month-range-utils";

export type { MonthRange } from "./month-range-utils";

export interface MonthRangePickerProps {
  children: ReactElement;
  value?: MonthRange;
  onApply: (range: MonthRange) => void;
  disabled?: boolean;
  /** 이미 바텀시트 안이면 모바일에서도 popover를 사용한다. 생략하면 Modal 안에서 자동 적용되며, false를 명시하면 시트를 유지한다. */
  disableMobileSheet?: boolean;
}

function MonthPanel({
  year,
  from,
  to,
  onSelect,
  onYearChange,
  onMove,
  focusedMonth,
  onFocusMonth,
  focusOnMount,
  initialFocusRef,
  showPrev = true,
  showNext = true,
}: {
  year: number;
  from: MonthValue | null;
  to: MonthValue | null;
  onSelect: (value: MonthValue) => void;
  onYearChange: (year: number) => void;
  onMove: (value: MonthValue) => void;
  focusedMonth: MonthValue;
  onFocusMonth: (value: MonthValue) => void;
  focusOnMount: boolean;
  initialFocusRef?: RefObject<HTMLButtonElement | null>;
  showPrev?: boolean;
  showNext?: boolean;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const initialFocus = useRef({ focusedMonth, year });
  const hasMoved = useRef(false);
  useEffect(() => {
    // 플로팅 패널의 초기 포커스는 FocusManager가, 시트는 여기서 처리한다.
    if (!focusOnMount && !hasMoved.current) {
      if (
        initialFocus.current.focusedMonth === focusedMonth &&
        initialFocus.current.year === year
      )
        return;
      hasMoved.current = true;
    }
    if (focusedMonth.year !== year) return;
    refs.current[focusedMonth.month - 1]?.focus();
  }, [focusOnMount, focusedMonth, year]);
  const move = (month: number) => {
    const next = shiftMonth({ year, month: 1 }, month - 1);
    onMove(next);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {showPrev ? (
          <button
            type="button"
            aria-label="이전 해"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:bg-bg-subtle"
            onClick={() => onYearChange(year - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-8" />
        )}
        <div className="flex-1 text-center text-sm font-semibold text-fg-default">
          {year}년
        </div>
        {showNext ? (
          <button
            type="button"
            aria-label="다음 해"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:bg-bg-subtle"
            onClick={() => onYearChange(year + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-8" />
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, index) => {
          const month = index + 1;
          const current = { year, month };
          const today = new Date();
          const isCurrent =
            today.getFullYear() === year && today.getMonth() + 1 === month;
          const selected = !!(
            (from && compareMonths(current, from) === 0) ||
            (to && compareMonths(current, to) === 0)
          );
          const inside =
            !!from &&
            !!to &&
            compareMonths(current, from) > 0 &&
            compareMonths(current, to) < 0;
          return (
            <button
              key={month}
              ref={(node) => {
                refs.current[month - 1] = node;
                if (
                  initialFocusRef &&
                  focusedMonth.year === year &&
                  month === focusedMonth.month
                ) {
                  initialFocusRef.current = node;
                }
              }}
              type="button"
              tabIndex={
                focusedMonth.year === year && month === focusedMonth.month
                  ? 0
                  : -1
              }
              aria-label={`${year}년 ${month}월`}
              aria-pressed={selected}
              className={cn(
                "h-10 cursor-pointer rounded-lg text-sm transition-colors",
                selected
                  ? "bg-primary font-bold text-fg-inverse"
                  : inside
                    ? "bg-bg-muted text-fg-default"
                    : isCurrent
                      ? "bg-bg-muted font-semibold text-fg-default"
                      : "text-fg-default hover:bg-bg-subtle",
              )}
              onClick={() => {
                onSelect(current);
                onFocusMonth(current);
              }}
              onKeyDown={(event) => {
                let next: number | null = null;
                if (event.key === "ArrowLeft") next = month - 1;
                if (event.key === "ArrowRight") next = month + 1;
                if (event.key === "ArrowUp") next = month - 4;
                if (event.key === "ArrowDown") next = month + 4;
                if (event.key === "Home") next = 1;
                if (event.key === "End") next = 12;
                if (event.key === "PageUp" || event.key === "PageDown") {
                  event.preventDefault();
                  const nextYear = year + (event.key === "PageUp" ? -1 : 1);
                  onMove({ year: nextYear, month });
                  return;
                }
                if (next !== null) {
                  event.preventDefault();
                  move(next);
                }
              }}
            >
              {month}월
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 두 월을 선택해 범위를 적용한다. 한 월만 선택하면 시작과 끝이 같은 범위가 된다.
 * 모바일 시트는 포커스를 가두지 않는다. 포커스 순환이 필요하면 Modal 안에서 사용한다.
 */
export function MonthRangePicker({
  children,
  value,
  onApply,
  disabled = false,
  disableMobileSheet,
}: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const triggerDisabled =
    disabled || Boolean((children.props as { disabled?: boolean }).disabled);
  const { isMobile, useSheet } = usePickerMobile(disableMobileSheet);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (next) => {
      if (!triggerDisabled) setIsOpen(next);
    },
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });
  const click = useClick(context, { enabled: !triggerDisabled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  const referenceProps = getReferenceProps();
  const supportsDisabled =
    typeof children.type !== "string" ||
    ["button", "input", "select", "textarea"].includes(children.type);
  const trigger = cloneElement(
    children as ReactElement<{
      disabled?: boolean;
      "aria-haspopup"?: "dialog";
      "aria-expanded"?: boolean;
      "aria-controls"?: string;
      "aria-disabled"?: boolean;
    }>,
    {
      "aria-haspopup": "dialog",
      "aria-expanded": isOpen,
      "aria-controls":
        typeof referenceProps["aria-controls"] === "string"
          ? referenceProps["aria-controls"]
          : undefined,
      "aria-disabled": triggerDisabled || undefined,
      ...(triggerDisabled && supportsDisabled ? { disabled: true } : {}),
    },
  );
  return (
    <>
      <span
        ref={refs.setReference}
        {...referenceProps}
        className="inline-flex w-full"
      >
        {trigger}
      </span>
      <PickerSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        useSheet={useSheet}
        context={context}
        setFloating={refs.setFloating}
        floatingStyles={floatingStyles}
        getFloatingProps={(props) =>
          getFloatingProps({ ...props, "aria-label": "월 범위 선택" })
        }
        desktopClassName="z-floating max-w-[calc(100vw-16px)] rounded-2xl border border-border-subtle bg-bg-surface text-fg-default p-5 shadow-tooltip"
        initialFocus={initialFocusRef}
      >
        <MonthRangeBody
          value={value}
          isMobile={isMobile}
          focusOnMount={useSheet}
          initialFocusRef={initialFocusRef}
          onClose={() => setIsOpen(false)}
          onApply={(next) => {
            onApply(next);
            setIsOpen(false);
          }}
        />
      </PickerSheet>
    </>
  );
}

function MonthRangeBody({
  value,
  isMobile,
  focusOnMount,
  initialFocusRef,
  onApply,
  onClose,
}: {
  value?: MonthRange;
  isMobile: boolean;
  focusOnMount: boolean;
  initialFocusRef: RefObject<HTMLButtonElement | null>;
  onApply: (value: MonthRange) => void;
  onClose: () => void;
}) {
  const initial = value?.from ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };
  const [from, setFrom] = useState<MonthValue | null>(value?.from ?? null);
  const [to, setTo] = useState<MonthValue | null>(value?.to ?? null);
  const [year, setYear] = useState(initial.year);
  const [focusedMonth, setFocusedMonth] = useState<MonthValue>(initial);
  const select = (next: MonthValue) => {
    const range = selectMonth({ from, to }, next);
    setFrom(range.from);
    setTo(range.to);
  };
  const apply = () => {
    const range = completeMonthRange({ from, to });
    if (range) onApply(range);
    else onClose();
  };
  const move = (next: MonthValue) => {
    setFocusedMonth(next);
    if (isMobile) {
      setYear(next.year);
      return;
    }
    if (compareMonths(next, { year, month: 1 }) < 0) setYear(next.year);
    else if (compareMonths(next, { year: year + 1, month: 12 }) > 0)
      setYear(next.year - 1);
  };
  return (
    <div className="min-w-60">
      <div
        className={cn(isMobile ? "" : "grid grid-cols-[1fr_auto_1fr] gap-5")}
      >
        <MonthPanel
          year={year}
          from={from}
          to={to}
          onSelect={select}
          onYearChange={setYear}
          onMove={move}
          focusedMonth={focusedMonth}
          onFocusMonth={setFocusedMonth}
          focusOnMount={focusOnMount}
          initialFocusRef={initialFocusRef}
          showPrev
          showNext={isMobile}
        />
        {!isMobile && (
          <>
            <div className="w-px bg-border-subtle" />
            <MonthPanel
              year={year + 1}
              from={from}
              to={to}
              onSelect={select}
              onYearChange={(next) => setYear(next - 1)}
              onMove={move}
              focusedMonth={focusedMonth}
              onFocusMonth={setFocusedMonth}
              focusOnMount={focusOnMount}
              showPrev={false}
              showNext
            />
          </>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          size="small"
          variant="tertiary"
          appearance="transparent"
          onClick={onClose}
        >
          닫기
        </Button>
        <Button type="button" size="small" onClick={apply}>
          적용
        </Button>
      </div>
    </div>
  );
}
