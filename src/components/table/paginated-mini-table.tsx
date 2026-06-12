import { forwardRef } from "react";

import { MiniTable, type MiniTableProps } from "./mini-table";
import { PaginationFooter } from "./components/PaginationFooter";

export interface PaginatedMiniTableProps<T> extends MiniTableProps<T> {
  /** 1-base. */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  totalElements?: number;
  /** "총 N건" 노출 여부. 통계 카드 디폴트는 노출 안 함. @default false */
  showTotalCount?: boolean;
  /** 페이지 점프 입력 + 키보드 가이드. 통계 카드 디폴트는 노출 안 함. @default false */
  enablePageJump?: boolean;
  /** Alt + ←/→ 네비게이션. 통계 카드 디폴트는 비활성. @default false */
  enableKeyboardPagination?: boolean;
}

/**
 * PaginatedMiniTable — MiniTable + PaginationFooter.
 *
 * 통계/요약 카드용 — 페이지네이션 바만 깔끔히 보이도록 footer 옵션의 디폴트가 모두 false.
 * 필요 시 prop으로 켤 수 있음.
 */
export const PaginatedMiniTable = forwardRef<
  HTMLDivElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PaginatedMiniTableProps<any>
>(
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: PaginatedMiniTableProps<any>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const {
      currentPage,
      totalPages,
      onPageChange,
      pageSize,
      pageSizeOptions,
      onPageSizeChange,
      totalElements,
      hasPreviousPage,
      hasNextPage,
      showTotalCount = false,
      enablePageJump = false,
      enableKeyboardPagination = false,
      "data-testid": testId,
      ...rest
    } = props;

    const footer = (
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        totalElements={totalElements}
        showTotalCount={showTotalCount}
        enablePageJump={enablePageJump}
        enableKeyboardPagination={enableKeyboardPagination}
        data-testid={testId}
      />
    );

    return (
      <MiniTable ref={ref} data-testid={testId} footerSlot={footer} {...rest} />
    );
  },
) as <T>(
  props: PaginatedMiniTableProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => React.ReactElement;

(PaginatedMiniTable as unknown as { displayName: string }).displayName =
  "PaginatedMiniTable";
