import { Select } from "@/components/select";

import { KeyboardNavButton } from "./KeyboardNavButton";
import { PageJumpInput } from "./PageJumpInput";
import { Pagination } from "./Pagination";

const DEFAULT_PAGE_SIZES: number[] = [30, 50, 100];

export interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 페이지 사이즈 셀렉터 노출 — onPageSizeChange와 pageSize가 함께 있어야 그려짐. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** 백엔드 메타필드 우선, 미지정 시 currentPage 비교로 폴백. */
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  /** "총 N건" 표시용. */
  totalElements?: number;
  /** "총 N건" 노출 여부. @default true */
  showTotalCount?: boolean;
  /** 페이지 점프 입력 + 키보드 가이드 노출. @default true */
  enablePageJump?: boolean;
  /** Alt + ←/→ 네비게이션. @default true */
  enableKeyboardPagination?: boolean;
  "data-testid"?: string;
}

/**
 * 페이지네이션 footer — "총 N건" + 페이지당 셀렉터 + PageJump + 키보드 가이드 + Pagination.
 *
 * PaginatedTable / PaginatedMiniTable 등이 동일한 footer를 공유하기 위해 분리.
 * 좁은 footer(< 640px)에선 점프/키보드가 좌측 줄(상단), 넓을 땐 우측 그룹 안에 위치.
 */
export function PaginationFooter({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageSizeChange,
  hasPreviousPage,
  hasNextPage,
  totalElements,
  showTotalCount = true,
  enablePageJump = true,
  enableKeyboardPagination = true,
  "data-testid": testId,
}: PaginationFooterProps) {
  const canPrev = hasPreviousPage ?? currentPage > 1;
  const canNext = hasNextPage ?? currentPage < totalPages;

  const handlePaginationKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (!enableKeyboardPagination) return;
    // modifier 조합은 무시 (브라우저/OS 단축키 보호). plain ←/→만 동작.
    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" && canPrev) {
      event.preventDefault();
      onPageChange(currentPage - 1);
    } else if (event.key === "ArrowRight" && canNext) {
      event.preventDefault();
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav
      aria-label="페이지 네비게이션"
      className="@container/pagebar group/footer flex flex-wrap items-center justify-between gap-x-3 gap-y-2 shrink-0"
    >
      {/*
        좁은 footer(< 640px/pagebar)에선 키보드 가이드와 점프 입력이 좌측 줄(상단)에 함께 표시되고,
        넓을 땐 페이지네이션 좌측(우측 그룹 안)에 표시된다. 두 곳에 동시 렌더하고 CSS variant로 한쪽만 노출.
      */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
        {showTotalCount && totalElements !== undefined && (
          <span>총 {totalElements.toLocaleString()}건</span>
        )}
        {onPageSizeChange && pageSize !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">페이지당</span>
            <div className="w-20">
              <Select
                variant="box"
                selectSize="mini"
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange(Number(value))}
                options={pageSizeOptions.map((opt) => ({
                  value: String(opt),
                  label: String(opt),
                }))}
                placeholder="선택"
                data-testid={testId ? `${testId}-page-size` : undefined}
              />
            </div>
          </div>
        )}
        <div className="contents @min-[640px]/pagebar:hidden">
          {enablePageJump && totalPages > 1 && (
            <>
              <PageJumpInput
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                data-testid={testId ? `${testId}-page-jump` : undefined}
              />
              {enableKeyboardPagination && (
                <KeyboardNavButton onKeyDown={handlePaginationKeyDown} />
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 @min-[640px]/pagebar:flex-1 @min-[640px]/pagebar:justify-end @max-[639px]/pagebar:w-full @max-[639px]/pagebar:justify-center">
        <div className="hidden @min-[640px]/pagebar:contents">
          {enablePageJump && totalPages > 1 && (
            <>
              <PageJumpInput
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                data-testid={testId ? `${testId}-page-jump` : undefined}
              />
              {enableKeyboardPagination && (
                <KeyboardNavButton onKeyDown={handlePaginationKeyDown} />
              )}
            </>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          hasPreviousPage={canPrev}
          hasNextPage={canNext}
          data-testid={testId ? `${testId}-pagination` : undefined}
        />
      </div>
    </nav>
  );
}
