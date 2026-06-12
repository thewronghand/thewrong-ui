import { Children, isValidElement, type ReactNode } from "react";

import { useIsMobile } from "@/hooks";

/**
 * 페이지 헤더/툴바의 액션 버튼 크기 — 모바일은 mini, 그 외 small.
 * 헤더 자체는 폰트/패딩이 Tailwind 반응형으로 줄어들지만 Button size prop은
 * 클래스 토글이 아니라서 별도 훅으로 제공.
 */
export function useHeaderButtonSize(): "mini" | "small" {
  return useIsMobile() ? "mini" : "small";
}

interface TablePageLayoutProps {
  children: ReactNode;
}

interface PageHeaderProps {
  title: ReactNode;
  /** 우측 액션 영역(버튼 등). 비우면 우측이 비워진 채 헤더만 렌더된다. */
  children?: ReactNode;
}

interface TableCardProps {
  children: ReactNode;
}

// 검색/요약/테이블이 있는 표준 페이지 외곽 레이아웃.
// children 첫 자식이 PageHeader면 풀폭으로(=본문 padding 밖에) 분리해 렌더하고,
// 나머지 자식들은 본문 영역에서 일정 gap으로 배치. 마지막 자식은 남은 공간을 채운다.
//
// 식별은 `type === PageHeader` 직접 비교 — memo/forwardRef wrapper로 감싸도 안전하고
// displayName 문자열 캐스팅이 필요 없다.
export function TablePageLayout({ children }: TablePageLayoutProps) {
  const childArray = Children.toArray(children);
  const first = childArray[0];
  const isFirstHeader = isValidElement(first) && first.type === PageHeader;

  const headerNode = isFirstHeader ? first : null;
  const bodyNodes = isFirstHeader ? childArray.slice(1) : childArray;

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      {headerNode}
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2 pb-3 sm:gap-3 sm:px-4 sm:pt-3 sm:pb-4 [&>*:last-child]:min-h-0 [&>*:last-child]:flex-1">
        {bodyNodes}
      </div>
    </div>
  );
}

// 표준 페이지 헤더 — 풀폭 + 하단 구분선. 좌측 제목, 우측 액션.
// 모바일(sm 미만): 폰트/패딩 축소, 제목 길면 truncate로 우측 액션 자리 보존.
export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700 sm:px-6 sm:py-3">
      <h1 className="min-w-0 truncate text-base font-semibold text-neutral-900 dark:text-white sm:text-lg">
        {title}
      </h1>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

// 테이블을 감싸는 표준 카드. TablePageLayout의 마지막 자식으로 사용.
// 카드 자체가 안쪽 padding + 자식 gap을 책임진다. Toolbar/Table/mini SummaryBar 등
// 모든 자식이 동일 여백을 공유하도록.
export function TableCard({ children }: TableCardProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white p-4 gap-2 md:p-5 md:gap-4 xl:p-6 xl:gap-4 dark:bg-neutral-800 [&>*:last-child]:min-h-0 [&>*:last-child]:flex-1">
      {children}
    </div>
  );
}
