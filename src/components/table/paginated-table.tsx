import { forwardRef } from "react";

import { PaginationFooter } from "./components/PaginationFooter";
import { Table } from "./table";
import type { PaginatedTableProps } from "./types";

/**
 * PaginatedTable — Table 코어를 래핑해 페이지네이션 footer를 추가한 변형.
 * Table 본체 로직(헤더 정렬·리사이즈·grip, 본문 스트라이프·선택·sticky, 컬럼 프리셋)은 Table에 그대로 위임한다.
 * 클라이언트 정렬은 전달된 현재 페이지 데이터만 정렬한다. 서버 페이지네이션이면 serverSideSorting을 사용하고,
 * 정렬 변경 시 페이지 초기화는 호출부에서 처리한다.
 */
// forwardRef 내부는 unknown으로 받고 외부에는 제네릭 시그니처를 노출한다.
export const PaginatedTable = forwardRef<
  HTMLDivElement,
  PaginatedTableProps<unknown>
>(
  (props: PaginatedTableProps<unknown>, ref: React.ForwardedRef<HTMLDivElement>) => {
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
      enableKeyboardPagination = true,
      showTotalCount = true,
      enablePageJump = true,
      "data-testid": testId,
      ...rest
    } = props;

    // PaginatedTable은 currentPage/totalPages/onPageChange가 required라 footer는 항상 렌더한다.
    // showFooter 분기로 footer가 사라졌다 나타나는 시각 점프(빈-페이지 placeholder 등)를 막기 위해 컨테이너 고정.
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
      <Table ref={ref} data-testid={testId} footerSlot={footer} {...rest} />
    );
  },
) as <T>(
  props: PaginatedTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

(PaginatedTable as unknown as { displayName: string }).displayName =
  "PaginatedTable";
