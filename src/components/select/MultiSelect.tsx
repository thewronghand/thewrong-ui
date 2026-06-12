import {
  FloatingFocusManager,
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
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import { Check, ChevronDown, CircleX, Search } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  CHEVRON_SIZE_CLASS,
  SLOT_BADGE_TEXT_CLASS,
  SLOT_CHILD_ICON_CLASS,
  SLOT_GAP_CLASS,
  SLOT_ICON_SIZE_CLASS,
} from "@/components/_shared/form-size-tokens";
import {
  getInputContainerClasses,
  getInputHelpClasses,
  getInputLabelClasses,
  getInputTrailingIconColor,
  getInputVariantClasses,
} from "@/components/input/utils";

import { LoadingDots } from "./loading-dots";
import type { SelectCommonProps, SelectOption } from "./types";

/**
 * MultiSelect의 search 관련 props discriminated union.
 * `searchable=true`일 때만 검색 prop이 의미가 있다 — Select와 동일 패턴.
 */
type MultiSelectSearchProps =
  | {
      searchable?: false;
      searchPlaceholder?: never;
      onSearchChange?: never;
      isSearchLoading?: never;
    }
  | {
      searchable: true;
      /** 패널 검색 input placeholder. */
      searchPlaceholder?: string;
      /** 외부 검색(서버) 콜백. 제공 시 클라이언트 필터를 끄고 입력만 외부에 전달. */
      onSearchChange?: (query: string) => void;
      /** 외부 검색 로딩 상태. 패널 검색 input 옆 LoadingDots. */
      isSearchLoading?: boolean;
    };

type MultiSelectBaseProps = Omit<
  SelectCommonProps,
  "searchable" | "searchPlaceholder" | "onSearchChange" | "isSearchLoading"
> & {
  /** 선택 옵션 목록. */
  options: SelectOption[];
  /** 선택된 값들. 빈 배열이면 placeholder 노출. */
  value: string[];
  /** 값 변경 콜백. options 순서를 보존한 배열로 전달. */
  onChange: (values: string[]) => void;
  /** 트리거 추가 className. */
  className?: string;
  /** 드롭다운 패널 추가 className. */
  panelClassName?: string;
  /**
   * 트리거에 보여줄 풀 텍스트 포맷터. 기본은 라벨을 콤마로 연결.
   * 폭이 부족하면 자동으로 `formatCollapsed`로 폴백 (`disableAutoCollapse`로 끄기 가능).
   */
  formatTrigger?: (selectedOptions: SelectOption[]) => string;
  /**
   * 폭 부족 시 폴백 텍스트 포맷터. 기본은 `${count}개 선택`.
   * 호출부 사용 예: `(sel) => sel.length > 0 ? `${sel.length}건 선택` : ""`
   */
  formatCollapsed?: (selectedOptions: SelectOption[]) => string;
  /**
   * 트리거 폭에 풀 텍스트가 안 들어갈 때 자동으로 `formatCollapsed`로 전환하는 동작 비활성화.
   * 항상 풀 텍스트 + truncate ellipsis로 보고 싶을 때.
   * @default false
   */
  disableAutoCollapse?: boolean;
  /**
   * 패널 상단에 "전체 선택/해제" 토글 버튼 노출.
   * searchable 모드에서는 검색 결과(`filteredOptions`) 기준으로 동작.
   * disabled 옵션은 자동 제외.
   * @default false
   */
  showSelectAll?: boolean;
  /** id (label htmlFor 연결용). */
  id?: string;
  /** name (form 제출용 hidden input. CSV 직렬화). */
  name?: string;
};

type MultiSelectProps = MultiSelectBaseProps & MultiSelectSearchProps;

const defaultFormatTrigger = (selected: SelectOption[]): string => {
  if (selected.length === 0) return "";
  return selected.map((o) => o.label).join(", ");
};

const defaultFormatCollapsed = (selected: SelectOption[]): string => {
  if (selected.length === 0) return "";
  return `${selected.length}개 선택`;
};

/**
 * 다중 선택 Select. 옵션 리스트에 체크박스를 표시하고 토글 방식으로 동작.
 * 트리거/패널/슬롯/사이즈 정합은 단일 `Select`와 동일 (`shared/ui/input/utils` 공유).
 *
 * - searchable: 옵션 안 검색. `onSearchChange` 제공 시 외부 검색.
 * - value는 string[]. options 순서를 보존해 emit.
 * - 트리거에는 라벨을 콤마로 연결 — 길어지면 `formatTrigger`로 커스텀.
 */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(function MultiSelect(
  {
    options,
    value,
    onChange,
    variant,
    selectSize = "medium",
    label,
    labelOption = "appear",
    help,
    placeholder = "선택해주세요",
    hasError = false,
    disabled = false,
    suffix,
    trailingIcon,
    clearable = false,
    badge,
    searchable = false,
    searchPlaceholder = "검색...",
    onSearchChange,
    isSearchLoading = false,
    containerProps,
    containerRef,
    className = "",
    panelClassName = "",
    formatTrigger = defaultFormatTrigger,
    formatCollapsed = defaultFormatCollapsed,
    disableAutoCollapse = false,
    showSelectAll = false,
    id,
    name,
    "data-testid": testId,
  },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const triggerTextRef = useRef<HTMLSpanElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  // a11y: aria-controls / aria-activedescendant 연결용 안정 ID.
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-opt-${index}`;
  const activeOptionId = activeIndex !== null ? optionId(activeIndex) : undefined;

  const isExternalSearch = typeof onSearchChange === "function";

  const filteredOptions = useMemo(() => {
    if (!searchable || isExternalSearch || searchQuery.length === 0) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchable, isExternalSearch, searchQuery]);

  const valueSet = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((o) => valueSet.has(String(o.value))),
    [options, valueSet],
  );

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxHeight: `${Math.min(availableHeight, 320)}px`,
          });
        },
        padding: 8,
      }),
    ],
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: searchable,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveIndex(null);
      if (isExternalSearch) onSearchChange("");
    }
  }, [isOpen, isExternalSearch, onSearchChange]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // 트리거 폭에 풀 텍스트가 안 들어가면 collapsed로 폴백.
  // 측정 방식: 보이지 않는 span(measureRef)에 풀 텍스트를 그대로 그려 자연 폭(scrollWidth)을 얻고,
  // 실제 트리거 텍스트 컨테이너(triggerTextRef)의 폭과 비교. ResizeObserver로 트리거 폭 변화 추적.
  // 회복 가능 — 폭이 다시 늘어나면 풀 텍스트로 복귀.
  useLayoutEffect(() => {
    if (disableAutoCollapse) {
      setIsCollapsed(false);
      return;
    }
    const triggerNode = triggerTextRef.current;
    const measureNode = measureRef.current;
    if (!triggerNode || !measureNode) return;

    const measure = () => {
      // measureNode는 자연 폭으로 그려져 scrollWidth = 풀 텍스트 자연 폭.
      // triggerNode의 clientWidth = 실제 가용 폭.
      const naturalWidth = measureNode.scrollWidth;
      const availableWidth = triggerNode.clientWidth;
      // 자연 폭 > 가용 폭이면 truncate 발동 → 폴백.
      // sub-pixel 렌더링 오차 보정 위해 -1px 여유 (자연 폭이 정확히 같으면 폴백 안 함).
      setIsCollapsed(naturalWidth > availableWidth - 1);
    };

    measure();

    // 트리거 폭 변화 감지. RO 콜백은 다음 프레임에 batch로 호출됨.
    const ro = new ResizeObserver(() => {
      // 측정 자체가 layout read이므로 RAF로 묶어 ResizeObserver loop 경고 방지.
      requestAnimationFrame(measure);
    });
    ro.observe(triggerNode);
    return () => ro.disconnect();
    // selected의 실제 변경(선택/해제)에서만 effect 재실행. selectedOptions 객체 참조는
    // 부모 리렌더로 매번 새로 만들어지므로 안정값(value 배열의 join)에 의존.
  }, [disableAutoCollapse, value.join(",")]);

  const toggle = (optionValue: string) => {
    const next = new Set(valueSet);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    // options 순서 유지 — 외부 옵션 배열 순서대로 emit.
    const ordered = options
      .filter((o) => next.has(String(o.value)))
      .map((o) => String(o.value));
    onChange(ordered);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // 전체 선택/해제 — `filteredOptions` 기준(검색 결과 안). disabled 옵션 자동 제외.
  // 표시된 enabled 옵션이 모두 selected면 전체 해제, 아니면 전체 선택 (이미 selected는 유지).
  const selectableValues = filteredOptions
    .filter((o) => !o.disabled)
    .map((o) => String(o.value));
  const allDisplayedSelected =
    selectableValues.length > 0 && selectableValues.every((v) => valueSet.has(v));

  const handleToggleAll = () => {
    if (allDisplayedSelected) {
      // 표시된 enabled 옵션만 selected에서 제거 (필터 밖 selected는 유지).
      const remove = new Set(selectableValues);
      onChange(value.filter((v) => !remove.has(v)));
    } else {
      // 표시된 enabled 옵션을 selected에 추가 (이미 있는 건 그대로). options 순서로 정렬.
      const merged = new Set([...value, ...selectableValues]);
      const ordered = options
        .filter((o) => merged.has(String(o.value)))
        .map((o) => String(o.value));
      onChange(ordered);
    }
  };

  // 트리거가 닫혀 있고 값이 있을 때 Backspace/Delete로 clearable 발화. 키보드 사용자가
  // X 버튼에 직접 포커스를 못 받는 한계 보완 — Select와 동일 패턴.
  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!clearable || disabled || value.length === 0 || isOpen) return;
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onChange([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setSearchQuery(next);
    if (isExternalSearch) onSearchChange(next);
  };

  // searchable 모드의 검색 input 키 처리. ArrowUp/Down은 floating-ui useListNavigation(virtual)이
  // 처리하므로 여기선 Enter만(토글). IME 조합 중 Enter는 글자 확정용이므로 무시.
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && activeIndex !== null) {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled) toggle(String(opt.value));
    }
  };

  const filled = selectedOptions.length > 0;
  const showLabel = labelOption === "sustain" || (labelOption === "appear" && filled);
  const fullText = filled ? formatTrigger(selectedOptions) : "";
  const collapsedText = filled ? formatCollapsed(selectedOptions) : "";
  const triggerText = filled ? (isCollapsed ? collapsedText : fullText) : placeholder;

  const slotGap = SLOT_GAP_CLASS[selectSize];
  const slotIconSize = SLOT_CHILD_ICON_CLASS[selectSize];
  const slotBadgeText = SLOT_BADGE_TEXT_CLASS[selectSize];
  const builtinIconSize = SLOT_ICON_SIZE_CLASS[selectSize];
  const chevronSize = CHEVRON_SIZE_CLASS[selectSize];

  const variantClasses = getInputVariantClasses(variant, hasError, disabled, selectSize);
  const trailingIconColor = getInputTrailingIconColor(hasError, disabled, filled || isOpen);

  const fontSize =
    selectSize === "mini" ? "text-xs" : selectSize === "large" ? "text-base" : "text-sm";
  const triggerTextColor = disabled
    ? "text-text-disabled"
    : hasError
      ? "text-text-danger"
      : filled
        ? "text-text-primary"
        : "text-text-tertiary";

  return (
    <div
      ref={containerRef}
      className={getInputContainerClasses()}
      {...containerProps}
    >
      {/* 측정 전용 hidden span — 풀 텍스트의 자연 폭을 얻기 위해 nowrap + visibility:hidden.
          fixed top:-9999px로 화면 밖에 두어 부모 overflow의 영향을 받지 않게 함.
          fontSize는 트리거와 동일해야 측정 정확. */}
      {!disableAutoCollapse && filled && (
        <span
          ref={measureRef}
          aria-hidden
          className={`pointer-events-none fixed left-0 -top-[9999px] whitespace-nowrap ${fontSize}`}
        >
          {fullText}
        </span>
      )}
      {showLabel && label && (
        <label className={getInputLabelClasses(variant, hasError)} htmlFor={id}>
          {label}
        </label>
      )}
      <button
        ref={(node) => {
          refs.setReference(node);
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.RefObject<HTMLButtonElement | null>).current = node;
        }}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        data-testid={testId}
        {...getReferenceProps({ onKeyDown: handleTriggerKeyDown })}
        className={`${variantClasses} flex w-full items-center ${slotGap} ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${className}`
          .trim()
          .replace(/\s+/g, " ")}
      >
        <span
          ref={triggerTextRef}
          className={`flex-1 truncate text-left ${fontSize} ${triggerTextColor}`}
        >
          {triggerText}
        </span>
        {suffix && (
          <span className={`shrink-0 whitespace-nowrap ${fontSize} ${trailingIconColor}`}>
            {suffix}
          </span>
        )}
        {trailingIcon && (
          <span
            className={`flex shrink-0 items-center ${trailingIconColor} ${slotIconSize}`}
          >
            {trailingIcon}
          </span>
        )}
        {clearable && !disabled && filled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            aria-label="선택 모두 지우기"
            className={`flex shrink-0 cursor-pointer items-center ${trailingIconColor} hover:text-text-primary`}
          >
            <CircleX className={builtinIconSize} strokeWidth={1.5} aria-hidden />
          </span>
        )}
        {badge && (
          <span
            className={`flex shrink-0 items-center ${slotIconSize} ${slotBadgeText}`}
          >
            {badge}
          </span>
        )}
        <ChevronDown
          className={`shrink-0 transition-transform ${chevronSize} ${trailingIconColor} ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      {/* form 제출용 hidden input — CSV 직렬화. */}
      {name && <input type="hidden" name={name} value={value.join(",")} />}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={searchable ? -1 : 0}
          >
            <div
              ref={refs.setFloating}
              id={listboxId}
              style={floatingStyles}
              {...getFloatingProps()}
              className={`z-9999 overflow-hidden rounded-lg border border-border-tertiary bg-bg-white shadow-lg dark:border-border-secondary dark:bg-neutral-800 ${panelClassName}`}
            >
              {searchable && (
                <div className="flex items-center gap-2 border-b border-border-tertiary px-3 py-2 dark:border-border-secondary">
                  <Search className="h-4 w-4 shrink-0 text-icon-tertiary" aria-hidden />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-text-tertiary"
                  />
                  {isSearchLoading && (
                    <LoadingDots className="h-4 w-4 shrink-0 text-icon-tertiary" />
                  )}
                </div>
              )}
              {showSelectAll && filteredOptions.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="flex w-full items-center justify-between border-b border-border-tertiary px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-neutral-50 dark:border-border-secondary dark:hover:bg-neutral-700"
                >
                  <span>{allDisplayedSelected ? "전체 해제" : "전체 선택"}</span>
                  <span className="text-text-tertiary">{selectableValues.length}개</span>
                </button>
              )}
              <div className="max-h-72 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                    {isSearchLoading ? "검색 중..." : "옵션이 없어요"}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const optValue = String(option.value);
                    const checked = valueSet.has(optValue);
                    const isActive = activeIndex === index;
                    return (
                      <div
                        key={optValue}
                        id={optionId(index)}
                        ref={(node) => {
                          listRef.current[index] = node;
                        }}
                        role="option"
                        aria-selected={checked}
                        aria-disabled={option.disabled || undefined}
                        tabIndex={isActive ? 0 : -1}
                        {...getItemProps({
                          onClick: () => {
                            if (option.disabled) return;
                            toggle(optValue);
                          },
                          onKeyDown: (e) => {
                            if (option.disabled) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggle(optValue);
                            }
                          },
                        })}
                        className={`flex cursor-pointer items-start gap-3 px-3 py-2 text-sm transition-colors ${
                          option.disabled
                            ? "cursor-not-allowed text-text-disabled"
                            : isActive
                              ? "bg-neutral-100 text-text-primary dark:bg-neutral-700"
                              : "text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-border-tertiary dark:border-border-secondary"
                          }`}
                          aria-hidden
                        >
                          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`truncate ${checked ? "font-medium" : ""}`}>
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="mt-0.5 truncate text-xs text-text-tertiary">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {option.trailing && (
                          <span className="shrink-0 text-xs text-text-tertiary">
                            {option.trailing}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
      {help && <div className={getInputHelpClasses(hasError)}>{help}</div>}
    </div>
  );
});
