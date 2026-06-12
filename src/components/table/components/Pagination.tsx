import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * 페이지네이션 Props
 */
export interface PaginationProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  /** 현재 페이지 (1-base) */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 페이지 변경 핸들러 */
  onPageChange: (page: number) => void;
  /** 이전 페이지 존재 여부 (false면 이전/처음 비활성) */
  hasPreviousPage?: boolean;
  /** 다음 페이지 존재 여부 (false면 다음/끝 비활성) */
  hasNextPage?: boolean;
  /** 페이지 번호 버튼 최대 표시 개수 (넓은 화면 기준). 컨테이너 폭에 따라 자동 축소. */
  maxPageButtons?: number;
  /** 테스트 ID */
  "data-testid"?: string;
}

const STEP_OPTIONS = [9, 7, 5, 3, 1];
const ELLIPSIS_PX = 16;
const COMPACT_ELLIPSIS =
  "px-0.5 text-xs text-text-tertiary font-mono @min-[640px]/pagebar:px-1 @min-[640px]/pagebar:text-sm";

const PAGE_BUTTON_BASE =
  "inline-flex h-7 min-w-6 items-center justify-center rounded-md px-1.5 font-mono text-xs tabular-nums transition-colors @min-[640px]/pagebar:h-8 @min-[640px]/pagebar:min-w-7 @min-[640px]/pagebar:px-2 @min-[640px]/pagebar:text-sm";
const PAGE_BUTTON_INACTIVE =
  "text-text-disabled hover:bg-bg-base-secondary hover:text-text-secondary";
const PAGE_BUTTON_ACTIVE =
  "font-bold text-text-secondary";
const PAGE_BUTTON_FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500";
const PAGE_BUTTON_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-tertiary";

interface PageButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

/** 페이지네이션 전용 미니멀 버튼 — 텍스트만, 호버 시 회색 배경, 인셋 포커스 ring. */
function PageButton({
  active = false,
  className = "",
  children,
  ...props
}: PageButtonProps) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={`${PAGE_BUTTON_BASE} ${active ? PAGE_BUTTON_ACTIVE : PAGE_BUTTON_INACTIVE} ${PAGE_BUTTON_FOCUS} ${PAGE_BUTTON_DISABLED} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** currentPage 기준 sliding window. */
function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxPages: number,
): number[] {
  const half = Math.floor(maxPages / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxPages - 1);
  if (end - start < maxPages - 1) {
    start = Math.max(1, end - maxPages + 1);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/**
 * 페이지 자릿수에 따라 한 버튼이 차지하는 폭이 달라진다 — 1자리 ~28px, 2자리 ~32px, 3자리 ~40px (mini).
 * 9개 윈도우의 자릿수를 분석해 필요한 폭을 추정.
 */
function estimatePagesWidthPx(pages: number[], buttonHeightPx: number): number {
  const gap = buttonHeightPx <= 28 ? 4 : 8; // gap-1 / sm:gap-2
  // 모노 + px-1.5(mini) / px-2(small). 1자리 base = min-w(24/28) + 2*pad. 자릿수 추가는 폰트 char width.
  const isMini = buttonHeightPx <= 28;
  const base = isMini ? 24 : 28; // min-w-6 / min-w-7
  const charWidth = isMini ? 7 : 8; // mono char ~ 0.6em
  const buttons = pages.reduce((sum, p) => {
    const digits = String(p).length;
    return sum + Math.max(base, base + (digits - 1) * charWidth);
  }, 0);
  // ellipsis 양쪽 + 안전 여유 24px (가용 폭 추정의 보수 마진 — 살짝 일찍 단계가 줄어들어 시각적 여백 확보).
  return buttons + gap * Math.max(0, pages.length - 1) + ELLIPSIS_PX * 2 + 24;
}

/**
 * 가용 폭 + 페이지 자릿수 + (현재 화면 단계) 를 종합해 표시할 페이지 버튼 개수를 결정.
 * 단계: 9 → 7 → 5 → 3 → 1 (currentPage만).
 */
function pickStep(
  containerWidthPx: number,
  currentPage: number,
  totalPages: number,
  fixedButtonsPx: number,
  buttonHeightPx: number,
  maxStep: number,
): number {
  const available = containerWidthPx - fixedButtonsPx;
  const candidates = STEP_OPTIONS.filter((s) => s <= maxStep);
  for (const step of candidates) {
    const pages = getVisiblePages(currentPage, totalPages, step);
    if (estimatePagesWidthPx(pages, buttonHeightPx) <= available) {
      return step;
    }
  }
  return 1;
}

interface PageButtonsProps {
  currentPage: number;
  totalPages: number;
  pages: number[];
  onPageChange: (page: number) => void;
  testId: string | undefined;
}

/**
 * 페이지 번호 + 양 끝(첫/마지막) + ellipsis 한 묶음.
 */
function PageButtonGroup({
  currentPage,
  totalPages,
  pages,
  onPageChange,
  testId,
}: PageButtonsProps) {
  if (pages.length === 0) return null;
  const showFirstPage = pages[0] > 1;
  const showLastPage = pages[pages.length - 1] < totalPages;

  return (
    <>
      {showFirstPage && (
        <>
          <PageButton
            active={currentPage === 1}
            onClick={() => onPageChange(1)}
            data-testid={testId ? `${testId}-page-1` : undefined}
          >
            1
          </PageButton>
          {pages[0] > 2 && <span className={COMPACT_ELLIPSIS}>…</span>}
        </>
      )}

      {pages.map((page) => (
        <PageButton
          key={page}
          active={currentPage === page}
          onClick={() => onPageChange(page)}
          data-testid={testId ? `${testId}-page-${page}` : undefined}
        >
          {page}
        </PageButton>
      ))}

      {showLastPage && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className={COMPACT_ELLIPSIS}>…</span>
          )}
          <PageButton
            active={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            data-testid={testId ? `${testId}-page-${totalPages}` : undefined}
          >
            {totalPages}
          </PageButton>
        </>
      )}
    </>
  );
}

/**
 * Pagination 컴포넌트.
 *
 * 컨테이너 폭 + 페이지 자릿수에 반응해 표시할 페이지 버튼 개수를 동적으로 결정.
 * - 기본 후보: 9 → 7 → 5 → 3 → 1.
 * - 가용 폭에서 가장 큰 후보를 선택.
 * - 첫/이전/다음/끝 버튼은 항상 표시(가운데 페이지 윈도우만 축소).
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasPreviousPage,
  hasNextPage,
  maxPageButtons = 9,
  className = "",
  "data-testid": testId,
  ...restProps
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(maxPageButtons);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 자기 자신은 콘텐츠 폭을 따라 늘어나(auto) 측정값이 항상 9개 들어간 폭이 되어 의미가 없다.
    // 부모(가용 폭의 진실 원천)를 측정 — flex/grid 자식이라 부모 폭이 자식의 max 가용 폭.
    const parent = el.parentElement;
    if (!parent) return;
    const recalc = () => {
      const width = parent.offsetWidth;
      // 모바일/데스크톱 폰트 사이즈 분기 (footer container query가 아닌 viewport 기준 — 충분히 근사).
      const isCompact = width < 640;
      const buttonHeightPx = isCompact ? 28 : 32;
      const gap = isCompact ? 4 : 8;
      // 처음/이전/다음/끝 4버튼 + 가운데 PageButtonGroup과의 gap(2칸 추가).
      const fixedButtonsPx = buttonHeightPx * 4 + gap * 5;
      const next = pickStep(
        width,
        currentPage,
        totalPages,
        fixedButtonsPx,
        buttonHeightPx,
        maxPageButtons,
      );
      setStep((prev) => (prev === next ? prev : next));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [currentPage, totalPages, maxPageButtons]);

  if (totalPages < 1) return null;

  if (totalPages === 1) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}
        data-testid={testId}
        {...restProps}
      >
        <PageButton
          active
          disabled
          data-testid={testId ? `${testId}-page-1` : undefined}
        >
          1
        </PageButton>
      </div>
    );
  }

  const pages = getVisiblePages(currentPage, totalPages, step);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}
      data-testid={testId}
      {...restProps}
    >
      {/* 첫 페이지로 */}
      <PageButton
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        data-testid={testId ? `${testId}-first` : undefined}
        aria-label="첫 페이지"
      >
        <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
      </PageButton>

      {/* 이전 페이지 — hasPreviousPage가 미지정(undefined)이면 currentPage===1만으로 판정. */}
      <PageButton
        disabled={hasPreviousPage === false || currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        data-testid={testId ? `${testId}-prev` : undefined}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
      </PageButton>

      <PageButtonGroup
        currentPage={currentPage}
        totalPages={totalPages}
        pages={pages}
        onPageChange={onPageChange}
        testId={testId}
      />

      {/* 다음 페이지 — hasNextPage가 미지정(undefined)이면 currentPage===totalPages만으로 판정. */}
      <PageButton
        disabled={hasNextPage === false || currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        data-testid={testId ? `${testId}-next` : undefined}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </PageButton>

      {/* 마지막 페이지로 */}
      <PageButton
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        data-testid={testId ? `${testId}-last` : undefined}
        aria-label="마지막 페이지"
      >
        <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
      </PageButton>
    </div>
  );
}
