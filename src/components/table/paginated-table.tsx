import { forwardRef } from "react";

import { PaginationFooter } from "./components/PaginationFooter";
import { Table } from "./table";
import type { PaginatedTableProps } from "./types";

/**
 * PaginatedTable — Table 코어를 래핑해 페이지네이션 footer를 추가한 변형.
 * Table 본체 로직(헤더 정렬·리사이즈·grip, 본문 스트라이프·선택·sticky, 컬럼 프리셋)은 Table에 그대로 위임한다.
 */
// forwardRef가 제네릭 인자를 그대로 보존하지 못해서 `any`로 우회 후 아래에서 제네릭 시그니처로 cast.
export const PaginatedTable = forwardRef<
  HTMLDivElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PaginatedTableProps<any>
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: PaginatedTableProps<any>, ref: React.ForwardedRef<HTMLDivElement>) => {
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
