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
  useTypeahead,
} from "@floating-ui/react";
import { ChevronDown, CircleX } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  CHEVRON_SIZE_CLASS,
  CONTROL_TEXT_CLASS,
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
import { cn } from "@/lib/utils";

import { LoadingDots } from "./loading-dots";
import { computeSelectPanelMaxWidth } from "./panel-width";
import type { SelectCommonProps, SelectOption } from "./types";

/**
 * Select의 search 관련 props discriminated union.
 * `searchable=true`일 때만 onSearchChange/isSearchLoading/onLoadMore/hasMore/searchDebounceMs/searchPlaceholder가 의미가 있다.
 * 호출부가 `searchable=false`인데 검색 관련 prop을 넘기면 컴파일 에러로 차단.
 */
type SelectSearchProps =
  | {
      searchable?: false;
      searchPlaceholder?: never;
      onSearchChange?: never;
      isSearchLoading?: never;
      onLoadMore?: never;
      hasMore?: never;
      searchDebounceMs?: never;
      openOnFocus?: never;
      validateSearchQuery?: never;
    }
  | {
      searchable: true;
      /** 트리거 input의 검색 placeholder. selected 있을 때 fallback으로 노출. */
      searchPlaceholder?: string;
      /** 외부 검색(서버) 콜백. 제공 시 클라이언트 필터를 끄고 입력만 외부에 전달. */
      onSearchChange?: (query: string) => void;
      /** 외부 검색 로딩 상태. true면 트리거 우측에 스피너 + 무한스크롤 sentinel 동작 가드. */
      isSearchLoading?: boolean;
      /**
       * 무한스크롤: 옵션 패널 끝에 도달하면 호출. 호출부가 다음 페이지 fetch + options append.
       * `hasMore=true`일 때만 sentinel이 활성화되며, `isSearchLoading` 상태에서는 중복 호출 안 함.
       */
      onLoadMore?: () => void;
      /** 무한스크롤: 더 가져올 페이지가 있는지. true일 때만 sentinel 노출. */
      hasMore?: boolean;
      /**
       * `onSearchChange` 호출 디바운스 (ms). 0 또는 false면 즉시 호출.
       * 클라이언트 필터(`onSearchChange` 미제공)에는 영향 없음.
       * @default 300
       */
      searchDebounceMs?: number | false;
      /** searchable 입력에 포커스만 해도 패널을 연다. @default false */
      openOnFocus?: boolean;
      /** searchable 입력의 다음 검색어를 검사한다. false면 검색어와 검색 콜백에 반영하지 않는다. */
      validateSearchQuery?: (query: string) => boolean;
    };

/** Select의 search 외 base props (SelectCommonProps에서 search 관련 제외). */
type SelectBaseProps = Omit<
  SelectCommonProps,
  "searchable" | "searchPlaceholder" | "onSearchChange" | "isSearchLoading"
> & {
  /** 선택 옵션 목록. */
  options: SelectOption[];
  /** 선택된 값. 제어 컴포넌트로 사용. 빈 문자열이면 placeholder 노출. */
  value: string;
  /** 값 변경 콜백. clearable로 비울 때도 빈 문자열로 호출. */
  onChange: (value: string) => void;
  /**
   * 드롭다운 패널 추가 className. 긴 라벨이 패널을 뷰포트 밖으로 밀어내지 않도록 인라인 maxWidth가
   * 패널 폭을 `max(트리거 폭, min(가용 폭, 420px))`로 제한하므로 `max-w-*`/`min-w-*`로
   * 이 범위를 넘길 수 없다. 범위 안에서는 `w-*`로 지정하고, 더 큰 폭이 필요하면 트리거 폭을 조정한다.
   */
  panelClassName?: string;
  /** 트리거 추가 className. */
  className?: string;
  /** id (label htmlFor 연결용). */
  id?: string;
  /** name (form 제출용 hidden input). */
  name?: string;
  /** 지정하면 드롭다운 열림 상태를 제어한다. 생략하면 내부 상태를 사용한다. */
  open?: boolean;
  /** 드롭다운 열기·닫기 요청을 전달한다. open을 제어할 때는 이 값으로 상태를 갱신한다. */
  onOpenChange?: (open: boolean) => void;
};

type SelectProps = SelectBaseProps & SelectSearchProps;

/**
 * 단일 선택 Select. floating-ui 기반으로 트리거 폭과 패널 폭이 정합되며 a11y 표준 키보드 동작을 갖춘다.
 *
 * - 트리거 외관(슬롯/사이즈/variant)은 Input과 동일 토큰을 공유 (`shared/ui/input/utils`).
 * - searchable: 옵션 안 검색 input. `onSearchChange` 제공 시 외부 검색(서버), 미제공 시 클라이언트 필터.
 * - description/trailing은 옵션 리스트에서만 노출 — 트리거에는 label만.
 *
 * 자유 입력(옵션 외 값 허용)은 후속 `Autocomplete`로 분리.
 *
 * @example
 * ```tsx
 * <Select
 *   variant="box"
 *   options={[{ value: "kr", label: "한국" }]}
 *   value={value}
 *   onChange={setValue}
 *   placeholder="국가 선택"
 * />
 * ```
 */
/**
 * ref 타입은 trigger element를 가리킨다. searchable=false면 button, searchable=true면 input.
 * 외부에서 보통 `.focus()` 정도만 사용하므로 union으로 정직하게 노출.
 */
export type SelectTriggerRef = HTMLButtonElement | HTMLInputElement;

export const Select = forwardRef<SelectTriggerRef, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    variant,
    selectSize = "medium",
    label,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
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
    id,
    name,
    onLoadMore,
    hasMore = false,
    searchDebounceMs = 300,
    openOnFocus = false,
    validateSearchQuery,
    open,
    onOpenChange,
    "data-testid": testId,
  },
  ref,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  // FloatingPortal 안의 sentinel/scroll 컨테이너는 첫 effect 실행 시점엔 아직 mount 안 된 상태일 수 있다.
  // useRef + ref.current 접근은 mount 변화를 react가 감지 못 해 effect 의존성으로 작동 안 함.
  // 해결: callback ref + state로 노드를 추적 → effect가 노드 mount 시점에 자동 재실행.
  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);
  // 옵션 리스트의 실제 스크롤 컨테이너. IntersectionObserver root로 사용해 viewport가 아닌
  // 패널 내부 스크롤 영역 기준으로 sentinel 가시성 판정 (첫 페이지가 패널을 못 채워도 무한 fetch 방지).
  const [optionsScrollNode, setOptionsScrollNode] =
    useState<HTMLDivElement | null>(null);
  // a11y: aria-controls / aria-activedescendant 연결용 안정 ID.
  const listboxId = useId();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const optionId = (index: number) => `${listboxId}-opt-${index}`;
  const activeOptionId =
    activeIndex !== null ? optionId(activeIndex) : undefined;

  // 외부 검색(서버) 모드: onSearchChange 제공 시 클라이언트 필터를 끄고 입력만 외부에 전달.
  const isExternalSearch = typeof onSearchChange === "function";
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  // 외부 검색 디바운스. searchDebounceMs > 0일 때만 적용. 0/false면 즉시 호출.
  const debounceMs =
    searchDebounceMs === false || searchDebounceMs <= 0 ? 0 : searchDebounceMs;
  const debouncedSearch = useDebouncedCallback((q: string) => {
    onSearchChangeRef.current?.(q);
  }, debounceMs);

  // close 시점에 빈 query를 즉시 emit해야 부모 옵션 리셋이 한 프레임 늦어지지 않는다.
  // 닫힐 때 pending된 디바운스가 있다면 cancel하고 우리가 빈 값을 직접 부른다.
  const emitSearch = (q: string, immediate: boolean) => {
    if (!isExternalSearch) return;
    if (immediate || debounceMs === 0) {
      debouncedSearch.cancel();
      onSearchChangeRef.current?.(q);
    } else {
      debouncedSearch(q);
    }
  };

  const selectedOption = options.find((o) => String(o.value) === value);
  const selectedLabelRef = useRef(selectedOption?.label ?? "");
  selectedLabelRef.current = selectedOption?.label ?? "";
  const emitSearchRef = useRef(emitSearch);
  emitSearchRef.current = emitSearch;

  // 검색어가 selected.label과 정확히 같으면 "사용자가 아직 편집 안 함" 상태 — 전체 옵션 노출.
  // 사용자가 한 글자라도 다르게 입력하면 자유 편집 모드로 전환되어 필터링 시작.
  // value가 비어있지 않은데 selectedOption이 일시적 undefined인 경우(외부 검색 모드에서
  // 옵션 슬라이스 갱신 직후 한 프레임 등)도 "편집 안 함"으로 판정해 필터링 race 방지.
  const isShowingSelectedAsQuery =
    searchable &&
    ((selectedOption !== undefined && searchQuery === selectedOption.label) ||
      (selectedOption === undefined && value !== "" && searchQuery !== ""));

  const filteredOptions = useMemo(() => {
    if (
      !searchable ||
      isExternalSearch ||
      searchQuery.length === 0 ||
      isShowingSelectedAsQuery
    ) {
      return options;
    }
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [
    options,
    searchable,
    isExternalSearch,
    searchQuery,
    isShowingSelectedAsQuery,
  ]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // 트리거 폭을 하한으로, 가용 화면과 최대 폭을 상한으로 사용한다.
      floatingSize({
        apply({ rects, elements, availableHeight, availableWidth }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxWidth: `${computeSelectPanelMaxWidth(rects.reference.width, availableWidth)}px`,
            maxHeight: `${Math.min(availableHeight, 320)}px`,
          });
        },
        padding: 8,
      }),
    ],
  });

  // searchable일 땐 useClick의 토글이 input click마다 발화해 옵션 선택 후 다시 open되는 race를 만든다.
  // input의 onClick(open)과 handleSearchChange(입력 시 자동 open) + handleSelect(setIsOpen(false))로 충분.
  const click = useClick(context, { enabled: !disabled && !searchable });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: searchable, // 검색 input이 포커스 보유, 옵션은 가상 활성화로만
    loop: true,
  });
  // searchable이 아닐 때만 typeahead — 검색 input이 따로 있으면 typeahead와 충돌.
  const typeahead = useTypeahead(context, {
    listRef: { current: filteredOptions.map((o) => o.label) },
    activeIndex,
    onMatch: setActiveIndex,
    enabled: !searchable,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav, typeahead],
  );

  // 첫 마운트 시 useEffect(isOpen)이 isOpen=false 분기로 한 번 발화하면서 외부 검색 모드에 onSearchChange("")를
  // 부르면, 부모가 마운트 즉시 fetch를 시작해 트리거에 스피너가 떠있는 부작용이 생긴다. 첫 발화는 스킵.
  const hasOpenedOnceRef = useRef(false);

  // open/close 시 검색어/active 동기화.
  // - 열릴 때: searchable일 땐 selected.label로 초기화(전체 옵션 노출 + 사용자가 편집 시작하면 자유 검색).
  //   selected가 있으면 input 텍스트 전체 선택해 "한 글자 입력 = 덮어쓰기" 패턴(MUI Autocomplete) 보장.
  //   RAF로 한 프레임 늦춰 effect-flush 후 input value 갱신이 paint된 다음 select() 호출.
  // - 닫힐 때: 검색어 비우고 active 리셋. selected.label 복원은 inlineSearchValue 분기로 자연 처리.
  // 외부 검색이면 외부에 빈 query 알림(닫힐 때만, 한 번이라도 열린 적 있을 때만).
  useEffect(() => {
    if (isOpen) {
      hasOpenedOnceRef.current = true;
      if (searchable) {
        const label = selectedLabelRef.current;
        setSearchQuery(label);
        if (label !== "") {
          requestAnimationFrame(() => {
            searchInputRef.current?.select();
          });
        }
      }
    } else {
      setSearchQuery("");
      setActiveIndex(null);
      // 닫힐 때 빈 query 즉시 emit (디바운스 우회) — 부모 옵션 리셋 race 방지.
      if (hasOpenedOnceRef.current) emitSearchRef.current("", true);
    }
    // 값 변경 중에는 검색어를 덮지 않고, 패널이 열릴 때만 현재 라벨을 읽는다.
  }, [isOpen, searchable, isExternalSearch]);

  // 무한스크롤: sentinel이 옵션 리스트 스크롤 컨테이너 안에서 가시 진입 시 onLoadMore 호출.
  // isSearchLoading 중에는 중복 호출 방지(부모가 다음 페이지 fetch 중).
  // root는 optionsScrollRef(패널 내부 overflow-y-auto)로 좁혀, 첫 페이지가 패널을 못 채워도
  // viewport에 sentinel이 보여 무한 fetch 되는 race 방지.
  useEffect(() => {
    if (!isOpen || !onLoadMore || !hasMore) return;
    if (!loadMoreNode || !optionsScrollNode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isSearchLoading) {
            onLoadMore();
          }
        }
      },
      { root: optionsScrollNode, rootMargin: "0px 0px 80px 0px" },
    );
    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [
    isOpen,
    onLoadMore,
    hasMore,
    isSearchLoading,
    loadMoreNode,
    optionsScrollNode,
  ]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  // 트리거가 닫혀 있고 값이 있을 때 Backspace/Delete로 clearable 발화. 키보드 사용자가
  // X 버튼에 직접 포커스를 못 받는 (button-in-button 회피로 span role=button) 한계 보완.
  // searchable에선 input의 native Backspace 편집과 충돌하므로 비활성.
  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (searchable || !clearable || disabled || !filled || isOpen) return;
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onChange("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (validateSearchQuery && !validateSearchQuery(next)) return;
    if (next !== searchQuery) {
      if (optionsScrollNode) optionsScrollNode.scrollTop = 0;
      setActiveIndex(null);
    }
    setSearchQuery(next);
    // 외부 검색은 디바운스 적용. 클라이언트 필터는 setSearchQuery로 즉시 반영.
    emitSearch(next, false);
    // 입력하면 자동으로 패널 펼침. 이미 열려 있으면 no-op.
    if (!isOpen) setIsOpen(true);
  };

  // searchable 트리거 input 키 처리. ArrowUp/Down은 floating-ui useListNavigation(virtual)이
  // 처리하므로 여기선 Enter / Backspace / Delete만. IME 조합 중은 무시.
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && activeIndex !== null) {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled) handleSelect(String(opt.value));
      return;
    }
    // selected가 있을 때 Backspace/Delete → selected 통째 클리어 (chip 삭제 의도).
    // 닫힌 상태에선 readOnly라 native 편집은 막혀있고, 열린 상태에서는 검색어가 비어있을 때만 발화.
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      selectedOption &&
      (!isOpen || searchQuery === "")
    ) {
      e.preventDefault();
      onChange("");
    }
  };

  const showLabel =
    labelOption === "sustain" ||
    (labelOption === "appear" && Boolean(selectedOption));
  const filled = Boolean(selectedOption);
  // 비-searchable: button 트리거 라벨. searchable: input value(아래 inlineSearchValue)로 별도 처리.
  const triggerText = selectedOption ? selectedOption.label : placeholder;

  // searchable 트리거 input의 표시값. 열린 상태에선 searchQuery(사용자 편집 + selected.label 초기값),
  // 닫힌 상태에선 selectedOption.label 직접 표시. useEffect(isOpen)이 open 시 searchQuery를
  // selected.label로 동기화 + close 시 빈 값으로 리셋하므로, 닫힌 상태의 표시는 이 분기로 자연 처리됨.
  const inlineSearchValue = isOpen
    ? searchQuery
    : (selectedOption?.label ?? "");

  // size 토큰
  const slotGap = SLOT_GAP_CLASS[selectSize];
  const slotIconSize = SLOT_CHILD_ICON_CLASS[selectSize];
  const slotBadgeText = SLOT_BADGE_TEXT_CLASS[selectSize];
  const builtinIconSize = SLOT_ICON_SIZE_CLASS[selectSize];
  const chevronSize = CHEVRON_SIZE_CLASS[selectSize];

  // Input variant utils 재사용 — Input과 같은 height/border/padding 토큰.
  const variantClasses = getInputVariantClasses(
    variant,
    hasError,
    disabled,
    selectSize,
  );
  const trailingIconColor = getInputTrailingIconColor(
    hasError,
    disabled,
    filled || isOpen,
  );

  const fontSize = CONTROL_TEXT_CLASS[selectSize];
  const triggerTextColor = disabled
    ? "text-fg-disabled"
    : hasError
      ? "text-fg-danger"
      : filled
        ? "text-fg-default"
        : "text-fg-subtle";

  return (
    <div
      {...containerProps}
      ref={containerRef}
      className={cn(getInputContainerClasses(), "min-w-0", containerProps?.className)}
    >
      {showLabel && label && (
        <label
          className={getInputLabelClasses(variant, hasError)}
          htmlFor={triggerId}
        >
          {label}
        </label>
      )}
      {searchable ? (
        // searchable 모드: 트리거 자체가 input. 포커스/입력 시 자동 open, 옵션 선택 시 close.
        // 닫힐 때 selected.label로 복원 — useEffect(isOpen)에서 setSearchQuery("") 처리.
        // wrapper의 빈 공간이나 아이콘을 눌러도 input을 포커스하고 패널을 연다.
        <div
          ref={(node) => {
            refs.setReference(node);
          }}
          {...getReferenceProps({
            onClick: () => {
              if (disabled) return;
              searchInputRef.current?.focus();
              if (!isOpen) setIsOpen(true);
            },
          })}
          role="presentation"
          aria-expanded={undefined}
          aria-controls={undefined}
          aria-haspopup={undefined}
          className={cn(
            variantClasses,
            "flex w-full min-w-0 items-center",
            slotGap,
            variant !== "box" && "focus-within:border-primary",
            variant !== "box" && variant !== "line" && "focus-within:ring-control focus-within:ring-primary",
            disabled ? "cursor-not-allowed" : "cursor-text",
            className,
          )}
        >
          <input
            ref={(node) => {
              searchInputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref)
                (ref as React.RefObject<SelectTriggerRef | null>).current =
                  node;
            }}
            id={triggerId}
            type="text"
            role="combobox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            // 닫힌 상태에선 input이 selected.label만 보여주는 "chip" 역할.
            // 사용자가 native로 글자 지우는 게 아니라, Backspace/Delete로 selected 통째 클리어해야 자연스러움.
            // 열린 상태에선 readonly 해제해 자유 검색.
            readOnly={!isOpen}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            data-testid={testId}
            value={inlineSearchValue}
            // selected가 있으면 input value에 selected.label이 차 있어 placeholder는 사실상 안 보이지만,
            // 사용자가 검색어를 다 지웠을 때(searchQuery="") 잠깐 노출되는 fallback. selected 없을 땐 외부 placeholder.
            placeholder={selectedOption ? searchPlaceholder : placeholder}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (openOnFocus && !disabled && !isOpen) setIsOpen(true);
            }}
            className={cn(
              "min-w-0 flex-1 truncate bg-transparent text-left outline-hidden placeholder:text-fg-subtle",
              fontSize,
              triggerTextColor,
              disabled && "cursor-not-allowed",
            )}
          />
          {suffix && (
            <span
              className={cn("shrink-0 whitespace-nowrap", fontSize, trailingIconColor)}
            >
              {suffix}
            </span>
          )}
          {trailingIcon && (
            <span
              className={cn("flex shrink-0 items-center", trailingIconColor, slotIconSize)}
            >
              {trailingIcon}
            </span>
          )}
          {isSearchLoading && (
            <LoadingDots
              className={cn("shrink-0 text-fg-subtle", builtinIconSize)}
            />
          )}
          {clearable && !disabled && filled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="선택 지우기"
              className={cn(
                "flex shrink-0 cursor-pointer items-center rounded",
                trailingIconColor,
                "hover:text-fg-default focus:outline-hidden focus-visible:ring-input-clear focus-visible:ring-input-clear-ring",
              )}
            >
              <CircleX
                className={builtinIconSize}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          )}
          {badge && (
            <span
              className={cn("flex shrink-0 items-center", slotIconSize, slotBadgeText)}
            >
              {badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "shrink-0 transition-transform",
              chevronSize,
              trailingIconColor,
              isOpen && "rotate-180",
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      ) : (
        <button
          ref={(node) => {
            refs.setReference(node);
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.RefObject<SelectTriggerRef | null>).current = node;
          }}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          data-testid={testId}
          {...getReferenceProps({ onKeyDown: handleTriggerKeyDown })}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            variantClasses,
            "flex w-full min-w-0 items-center",
            slotGap,
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            className,
          )}
        >
          <span
            className={cn("min-w-0 flex-1 truncate text-left", fontSize, triggerTextColor)}
          >
            {triggerText}
          </span>
          {suffix && (
            <span
              className={cn("shrink-0 whitespace-nowrap", fontSize, trailingIconColor)}
            >
              {suffix}
            </span>
          )}
          {trailingIcon && (
            <span
              className={cn("flex shrink-0 items-center", trailingIconColor, slotIconSize)}
            >
              {trailingIcon}
            </span>
          )}
          {clearable && !disabled && filled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="선택 지우기"
              className={cn(
                "flex shrink-0 cursor-pointer items-center",
                trailingIconColor,
                "hover:text-fg-default",
              )}
            >
              <CircleX
                className={builtinIconSize}
                strokeWidth={1.5}
                aria-hidden
              />
            </span>
          )}
          {badge && (
            <span
              className={cn("flex shrink-0 items-center", slotIconSize, slotBadgeText)}
            >
              {badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "shrink-0 transition-transform",
              chevronSize,
              trailingIconColor,
              isOpen && "rotate-180",
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      )}
      {/* form 제출용 hidden input — name 지정 시. */}
      {name && <input type="hidden" name={name} value={value} />}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            // searchable 모드에서는 -1로 두어 트리거 input이 포커스를 유지(검색 입력 가능).
            // 비-searchable에선 0으로 첫 옵션에 포커스(키보드 네비 즉시 가능).
            initialFocus={searchable ? -1 : 0}
          >
            <div
              ref={refs.setFloating}
              id={listboxId}
              style={floatingStyles}
              {...getFloatingProps()}
              className={cn(
                "z-floating overflow-hidden rounded-surface border border-border-subtle bg-bg-surface shadow-overlay",
                panelClassName,
              )}
            >
              {/* searchable 모드는 트리거 input이 검색 역할을 하므로 패널 안 별도 검색창 없음. */}
              <div
                ref={setOptionsScrollNode}
                className="max-h-72 overflow-y-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-fg-subtle">
                    {isSearchLoading ? "검색 중..." : "옵션이 없어요"}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = String(option.value) === value;
                    const isActive = activeIndex === index;
                    return (
                      <div
                        key={String(option.value)}
                        id={optionId(index)}
                        ref={(node) => {
                          listRef.current[index] = node;
                        }}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled || undefined}
                        tabIndex={isActive ? 0 : -1}
                        {...getItemProps({
                          onClick: () => {
                            if (option.disabled) return;
                            handleSelect(String(option.value));
                          },
                          onKeyDown: (e) => {
                            if (option.disabled) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelect(String(option.value));
                            }
                          },
                        })}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 px-3 py-2 text-sm transition-colors",
                          option.disabled
                            ? "cursor-not-allowed text-fg-disabled"
                            : isSelected
                              ? cn(
                                  "font-medium text-primary-fg",
                                  isActive
                                    ? "bg-primary-subtle"
                                    : "bg-primary-subtle/60 hover:bg-primary-subtle/80",
                                )
                              : isActive
                                ? "bg-bg-subtle text-fg-default"
                                : "text-fg-default hover:bg-bg-subtle",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{option.label}</div>
                          {option.description && (
                            <div className="mt-0.5 truncate text-xs text-fg-subtle">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {option.trailing && (
                          <span className="shrink-0 text-xs text-fg-subtle">
                            {option.trailing}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {/* 무한스크롤 sentinel — onLoadMore가 있고 hasMore=true일 때만 노출.
                    IntersectionObserver가 가시성 감지 시 onLoadMore 호출. */}
                {onLoadMore && hasMore && (
                  <div
                    ref={setLoadMoreNode}
                    aria-hidden
                    className="flex items-center justify-center px-3 py-3 text-fg-subtle"
                  >
                    {isSearchLoading && <LoadingDots />}
                  </div>
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
