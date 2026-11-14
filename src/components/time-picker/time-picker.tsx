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
import { Check, Clock } from "lucide-react";
import {
  cloneElement,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import { Button } from "@/components/button";
import {
  PickerSheet,
  usePickerMobile,
} from "@/components/date-picker/PickerSheet";
import { Select, type SelectTriggerRef } from "@/components/select";
import { cn } from "@/lib/utils";
import {
  formatDigitStream,
  formatTime,
  isValidTimeDraft,
  normalizeTime,
  padTimeUnit,
  parseTime,
  type PendingTime,
  type TimePrecision,
} from "./time-utils";

export type { TimePrecision } from "./time-utils";

export interface TimePickerProps {
  children: ReactElement;
  value: string;
  onApply: (value: string) => void;
  precision: TimePrecision;
  disabled?: boolean;
  /** 이미 바텀시트 안이면 모바일에서도 popover를 사용한다. 생략하면 Modal 안에서 자동 적용되며, false를 명시하면 시트를 유지한다. */
  disableMobileSheet?: boolean;
  referenceClassName?: string;
}

export interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  precision: TimePrecision;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  /** 값의 대비를 유지하면서 입력과 선택을 막는다. */
  readOnly?: boolean;
  className?: string;
  disableMobileSheet?: boolean;
  size?: "small" | "medium";
  "aria-invalid"?: boolean;
  "data-rhf-invalid"?: boolean;
}

/**
 * 시·분 또는 시·분·초를 선택하고 적용할 때 값을 전달한다.
 * 모바일 시트는 포커스를 가두지 않는다. 포커스 순환이 필요하면 Modal 안에서 사용한다.
 */
export function TimePicker({
  children,
  value,
  onApply,
  precision,
  disabled = false,
  disableMobileSheet,
  referenceClassName,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(() => parseTime(value));
  const triggerDisabled =
    disabled || Boolean((children.props as { disabled?: boolean }).disabled);
  const { useSheet } = usePickerMobile(disableMobileSheet);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (next) => {
      if (triggerDisabled) return;
      if (next) setPending(parseTime(value));
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
  const click = useClick(context, { enabled: !triggerDisabled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  const apply = () => {
    const normalized = normalizeTime(pending, precision);
    if (!normalized) return;
    onApply(formatTime(normalized, precision));
    setIsOpen(false);
  };
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
        className={cn("inline-flex", referenceClassName ?? "w-full")}
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
          getFloatingProps({ ...props, "aria-label": "시간 선택" })
        }
        desktopClassName="z-floating w-80 max-w-[calc(100vw-16px)] rounded-2xl border border-border-subtle bg-bg-surface text-fg-default p-4 shadow-tooltip"
      >
        <TimePanel
          pending={pending}
          precision={precision}
          onChange={setPending}
          onClose={() => setIsOpen(false)}
          onApply={apply}
        />
      </PickerSheet>
    </>
  );
}

function TimePanel({
  pending,
  precision,
  onChange,
  onClose,
  onApply,
}: {
  pending: PendingTime;
  precision: TimePrecision;
  onChange: (value: PendingTime) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const hourRef = useRef<SelectTriggerRef | null>(null);
  const minuteRef = useRef<SelectTriggerRef | null>(null);
  const secondRef = useRef<SelectTriggerRef | null>(null);
  const moveToNextUnit = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "Tab" ||
      event.shiftKey ||
      !(event.target instanceof HTMLInputElement)
    )
      return;
    const next =
      event.target === hourRef.current
        ? minuteRef
        : event.target === minuteRef.current && precision === "second"
          ? secondRef
          : null;
    if (!next) return;
    event.preventDefault();
    next.current?.focus();
  };
  const unit = (
    key: keyof PendingTime,
    label: string,
    max: number,
    ref: React.RefObject<SelectTriggerRef | null>,
  ) => (
    <TimeUnitSelect
      label={label}
      value={pending[key]}
      max={max}
      open={openUnit === key}
      onOpenChange={(open) =>
        setOpenUnit((current) =>
          open ? key : current === key ? null : current,
        )
      }
      onChange={(value) => onChange({ ...pending, [key]: value })}
      inputRef={ref}
    />
  );
  return (
    <div className="grid gap-4" onKeyDown={moveToNextUnit}>
      <div
        className={cn(
          "grid items-end gap-2",
          precision === "second" ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {unit("hour", "시간", 23, hourRef)}
        {unit("minute", "분", 59, minuteRef)}
        {precision === "second" && unit("second", "초", 59, secondRef)}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="small"
          variant="tertiary"
          appearance="transparent"
          onClick={onClose}
        >
          닫기
        </Button>
        <Button
          type="button"
          size="small"
          disabled={!normalizeTime(pending, precision)}
          leadingIcon={<Check aria-hidden className="h-4 w-4" />}
          onClick={onApply}
        >
          적용
        </Button>
      </div>
    </div>
  );
}

function TimeUnitSelect({
  label,
  value,
  max,
  open,
  onOpenChange,
  onChange,
  inputRef,
}: {
  label: string;
  value: string;
  max: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  inputRef: React.RefObject<SelectTriggerRef | null>;
}) {
  const options = Array.from({ length: max + 1 }, (_, index) => ({
    value: padTimeUnit(index),
    label: padTimeUnit(index),
  }));
  if (value && !options.some((option) => option.value === value))
    options.push({ value, label: value });
  const placeholder = label === "시간" ? "HH" : label === "분" ? "MM" : "SS";
  return (
    <Select
      variant="box"
      selectSize="small"
      ref={inputRef}
      label={label}
      labelOption="sustain"
      options={options}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
      searchable
      openOnFocus
      validateSearchQuery={(query) =>
        query === "" || (/^\d{1,2}$/.test(query) && Number(query) <= max)
      }
      onSearchChange={(query) => {
        if (open || query !== "") onChange(query);
      }}
      searchDebounceMs={false}
      searchPlaceholder={placeholder}
    />
  );
}

/** 직접 시간 입력과 피커 버튼을 함께 제공하는 제어 입력. */
export function TimeInput({
  value,
  onChange,
  precision,
  ariaLabel = "시간",
  placeholder,
  disabled,
  readOnly = false,
  className,
  disableMobileSheet,
  size = "medium",
  "aria-invalid": ariaInvalid,
  "data-rhf-invalid": dataRHFInvalid,
}: TimeInputProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 w-full items-center border border-border-subtle bg-bg-surface transition-colors focus-within:border-border-primary",
        size === "small"
          ? "h-control-small rounded-control-small px-control-pad-small text-control-small"
          : "h-control-medium rounded-control-medium px-control-pad-medium font-control-field",
        disabled && "bg-bg-disabled text-fg-disabled",
        !disabled && readOnly && "bg-bg-subtle",
        className,
      )}
    >
      <input
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        data-rhf-invalid={dataRHFInvalid ? "true" : undefined}
        value={value}
        placeholder={
          placeholder ?? (precision === "second" ? "00:00:00" : "00:00")
        }
        disabled={disabled}
        readOnly={readOnly}
        inputMode="numeric"
        maxLength={precision === "second" ? 8 : 5}
        onChange={(event) => {
          if (readOnly) return;
          const formatted = formatDigitStream(event.target.value, precision);
          if (formatted !== null && isValidTimeDraft(formatted, precision))
            onChange(formatted);
        }}
        className="w-0 min-w-0 flex-1 self-stretch bg-transparent text-fg-default outline-hidden placeholder:text-fg-subtle disabled:text-fg-disabled"
      />
      <TimePicker
        value={value}
        precision={precision}
        disabled={disabled || readOnly}
        disableMobileSheet={disableMobileSheet}
        onApply={onChange}
        referenceClassName="shrink-0"
      >
        <button
          type="button"
          aria-label={`${ariaLabel} 선택`}
          disabled={disabled || readOnly}
          data-field-affordance="true"
          className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg-default"
        >
          <Clock aria-hidden className="h-3.5 w-3.5" />
        </button>
      </TimePicker>
    </div>
  );
}
