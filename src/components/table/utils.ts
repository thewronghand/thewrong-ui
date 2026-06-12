import type { TableVariant, TableSize } from "./types";

/**
 * Table의 기본 클래스 (공통 스타일)
 */
export const getTableBaseClasses = (): string => {
  return `
    w-full
    border-collapse
    text-left
    table-fixed
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * Table 스타일 변형에 따른 Tailwind 클래스 매핑
 */
export const getTableVariantClasses = (
  variant: TableVariant = "default"
): string => {
  const variantMap: Record<TableVariant, string> = {
    default: "",
    bordered: "border border-neutral-200 dark:border-neutral-700",
    striped: "",
  };

  return variantMap[variant];
};

/**
 * Table 크기에 따른 Tailwind 클래스 매핑
 */
export const getTableSizeClasses = (size: TableSize = "medium"): string => {
  const sizeMap: Record<TableSize, string> = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return sizeMap[size];
};

/**
 * 컬럼 정렬에 따른 Tailwind 클래스 매핑
 */
export const getColumnAlignClasses = (
  align: "left" | "center" | "right" = "left"
): string => {
  const alignMap: Record<"left" | "center" | "right", string> = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  return alignMap[align];
};

/**
 * 테이블 헤더 기본 클래스
 */
export const getTableHeaderClasses = (): string => {
  return `
    font-medium
    text-text-secondary
    text-sm
    uppercase
    tracking-wider
    bg-bg-base-secondary
    leading-tight
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * 테이블 헤더 셀 클래스 (패딩 최소화). 우측 보더로 컬럼 구분선.
 */
export const getTableHeaderCellClasses = (): string => {
  return `
    px-6
    py-1.5
    text-text-secondary
    text-sm
    font-medium
    leading-tight
    border-b border-r border-border-secondary dark:border-border-tertiary
    whitespace-nowrap
    bg-bg-base-secondary
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * 테이블 셀 기본 클래스
 */
export const getTableCellClasses = (): string => {
  return `
    px-3
    py-0.5
    text-neutral-900 dark:text-white
    text-xs
    leading-tight
    border-b border-r border-[#f2f3f5] dark:border-neutral-700
    whitespace-nowrap
    overflow-hidden
    text-ellipsis
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * 셀 잘림 없이 표시 — overflow-hidden/text-ellipsis 제거 버전.
 * MiniTable처럼 가로 스크롤로 컨텐츠 다 보여주는 컨텍스트용.
 */
export const getTableCellClassesNoTruncate = (): string => {
  return `
    px-3
    py-0.5
    text-neutral-900 dark:text-white
    text-xs
    leading-tight
    border-b border-r border-[#f2f3f5] dark:border-neutral-700
    whitespace-nowrap
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * 스트라이프 행 스타일
 * 첫 번째(index 0): 회색, 두 번째(index 1): 흰색
 */
export const getStripedRowClasses = (index: number): string => {
  return index % 2 === 0
    ? "bg-[#f9fafb] dark:bg-slate-900/50 hover:bg-[#f3f4f6] dark:hover:bg-slate-800"
    : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900";
};

/**
 * 선택된 행 스타일
 */
export const getSelectedRowClasses = (): string => {
  // 좌측 인디케이터는 box-shadow inset로 그려서 셀 너비를 밀지 않게 한다.
  // primary 토큰을 직접 var로 참조해 토큰 변경에 따라간다.
  return `
    bg-blue-50 dark:bg-blue-950/50
    hover:bg-blue-100 dark:hover:bg-blue-950/70
    shadow-[inset_4px_0_0_0_var(--color-primary-500)]
    dark:shadow-[inset_4px_0_0_0_var(--color-primary-400)]
  `
    .trim()
    .replace(/\s+/g, " ");
};

/**
 * 호버 가능한 행 스타일
 */
export const getHoverableRowClasses = (): string => {
  return `
    hover:bg-[#f9fafb]
    transition-colors duration-200
    cursor-pointer
  `
    .trim()
    .replace(/\s+/g, " ");
};
