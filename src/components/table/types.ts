import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Table 컴포넌트의 스타일 변형 타입
 */
export type TableVariant = "default" | "bordered" | "striped";

/**
 * Table 컴포넌트의 크기 타입
 */
export type TableSize = "small" | "medium" | "large";

/**
 * 컬럼 정렬 방향 타입
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * 컬럼 정렬 정보
 */
export interface ColumnSort {
  key: string;
  direction: SortDirection;
}

/**
 * Table에 외부에서 주입하는 controlled 컬럼 상태.
 *
 * 순서/숨김/너비를 한 묶음으로 받는다. Table은 이 객체를 통해서만 컬럼 상태를 다루며,
 * 데이터 소스(useColumnPresets 등)에 대해서는 모른다.
 */
export interface TableColumnState {
  /** 헤더에 실제로 그릴 순서. excludeFromPreset 컬럼은 columns 정의 위치 기준으로 외부에서 끼워넣어야 한다. */
  columnOrder: string[];
  /** 화면에서 숨길 컬럼 키. */
  hiddenColumns: string[];
  /** 컬럼 키 → 픽셀 너비. 누락 키는 자동 계산값/컬럼 정의 사용. */
  columnWidths: Record<string, number>;
  /** 헤더 DnD 후 호출. 새 순서를 외부 store에 반영한다. */
  onColumnOrderChange: (next: string[]) => void;
  /** 헤더 리사이즈/드롭다운 너비 조정 후 호출. */
  onColumnWidthsChange: (widths: Record<string, number>) => void;
}

/**
 * Table 컬럼 정의
 */
export interface TableColumn<T> {
  /**
   * 컬럼의 고유 키
   */
  key: string;
  /**
   * 컬럼 헤더 텍스트 또는 컴포넌트
   */
  header: string | ReactNode;
  /**
   * 행 데이터에서 값을 추출하는 함수
   * @param row 행 데이터
   * @returns 렌더링할 ReactNode
   */
  accessor?: (row: T) => ReactNode;
  /**
   * 정렬 가능 여부
   * @default false
   */
  sortable?: boolean;
  /**
   * 컬럼 정렬 방향
   * @default null
   */
  sortDirection?: SortDirection;
  /**
   * 컬럼 정렬 변경 콜백
   */
  onSort?: (direction: SortDirection) => void;
  /**
   * 컬럼 정렬 정렬
   * @default 'left'
   */
  align?: "left" | "center" | "right";
  /**
   * 컬럼 너비 (CSS 값 또는 숫자)
   */
  width?: string | number;
  /**
   * 컬럼 최소 너비 (px)
   */
  minWidth?: number;
  /**
   * 스티키 컬럼 여부 (좌측 고정)
   * @default false
   */
  sticky?: boolean;
  /**
   * 모바일에서 숨기기 여부
   * @default false
   */
  hideOnMobile?: boolean;
  /**
   * 컬럼 숨기기 여부
   * @default false
   */
  hidden?: boolean;
  /**
   * 프리셋(순서 변경/숨김) 대상에서 제외 여부
   * 시스템 컬럼(선택, 액션 등)에 사용해요.
   * @default false
   */
  excludeFromPreset?: boolean;
}

/**
 * 컬럼 그룹 메타 — `Table`이 thead 상단에 그룹 헤더를 그리기 위해 받는 메타데이터.
 *
 * 옵션 2 정책:
 * - 그룹은 "묶음 고정". 하위 컬럼들이 항상 함께 표시되고 함께 숨겨진다.
 * - 그룹 자체는 단일 슬롯처럼 취급 — 그룹 단위로 순서 이동/숨김.
 * - 그룹 내부 컬럼은 사용자가 순서·너비를 조정할 수 없다 (정의 시점에 박힘).
 *
 * 사용 방법:
 * 1. `columns`는 평면 `TableColumn[]`로 정의 (기존과 동일).
 * 2. 그룹화하고 싶은 컬럼들의 key를 모아 `columnGroups: [{ key, header, columnKeys: [...] }]`로 전달.
 * 3. `columns` 배열 안에서 같은 그룹의 컬럼들은 인접한 순서로 두어야 한다 (그룹 단위로 함께 이동).
 */
export interface TableColumnGroupMeta {
  /** 그룹 슬롯 키 — columnOrder/hiddenColumns에서 그룹을 식별. */
  key: string;
  /** 그룹 헤더 (thead 상단 row에 colSpan으로 표시) */
  header: string | ReactNode;
  /** 그룹에 속한 하위 컬럼 key 목록. 표시 순서대로. */
  columnKeys: string[];
  /** 모바일에서 그룹 전체 숨기기. */
  hideOnMobile?: boolean;
}

/**
 * Table 컴포넌트의 공통 Props
 */
export interface TableCommonProps<T> {
  /**
   * 테이블에 표시할 데이터 배열
   */
  data: T[];
  /**
   * 컬럼 정의 배열. 평면 `TableColumn`만 받는다(legacy/accordion 호환).
   * 컬럼 그룹은 `Table` 컴포넌트에 `columnGroups` prop으로 별도 전달.
   */
  columns: TableColumn<T>[];

  /**
   * 가상화 사용 여부 (자동 감지 시 undefined)
   * @default undefined (자동 감지)
   */
  virtualized?: boolean;
  /**
   * 가상화 자동 감지 임계값 (이 개수 이상일 때 자동 가상화)
   * @default 100
   */
  virtualizedThreshold?: number;
  /**
   * 예상 행 높이 (px, 가상화용)
   * @default 50
   */
  estimatedRowHeight?: number;
  /**
   * 행 높이 (px, 일반 테이블용)
   */
  rowHeight?: number;
  /**
   * 로딩 상태 — 본문 전체를 스피너로 대체. 첫 fetch에 사용.
   * @default false
   */
  loading?: boolean;
  /**
   * 백그라운드 재조회 중 — 기존 데이터를 유지한 채 dim + 스피너 오버레이.
   * placeholderData 패턴에서 검색/페이지 이동 중 시각적 시그널 용도.
   * @default false
   */
  isFetching?: boolean;
  /**
   * 빈 상태 메시지
   * @default "데이터가 없어요"
   */
  emptyMessage?: string;
  /**
   * 행 클릭 핸들러
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * 선택된 행 배열
   */
  selectedRows?: T[];
  /**
   * 행 선택 변경 핸들러
   */
  onRowSelect?: (row: T, selected: boolean) => void;
  /**
   * 행 선택 사용 여부
   * @default false
   */
  enableRowSelection?: boolean;
  /**
   * 전체 선택 사용 여부
   * @default false
   */
  enableSelectAll?: boolean;
  /**
   * 행 비교 함수 (선택된 행 확인용)
   */
  rowCompare?: (row1: T, row2: T) => boolean;
  /**
   * 행의 안정 식별자. 드래그 다중 선택에서 ID 추적에 사용된다.
   * 미지정 시 드래그 선택은 row index 기반으로 동작하며, 데이터 변경 시 어긋날 수 있다.
   */
  getRowId?: (row: T) => string | number;
  /**
   * 정렬 사용 여부 (클라이언트 사이드 정렬)
   * @default false
   */
  enableSorting?: boolean;
  /**
   * 서버 사이드 정렬 사용 여부
   * @default false
   */
  serverSideSorting?: boolean;
  /**
   * 정렬 변경 핸들러 (서버 사이드 정렬 시)
   */
  onSortChange?: (sort: ColumnSort | null) => void;
  /**
   * 초기 정렬 상태
   */
  initialSort?: ColumnSort;
  /**
   * 테이블 스타일 변형
   * @default 'default'
   */
  variant?: TableVariant;
  /**
   * 테이블 크기
   * @default 'medium'
   */
  size?: TableSize;
  /**
   * 스티키 헤더 여부
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * 테이블 높이 (가상화 시 필수)
   */
  height?: string | number;
  /**
   * 테이블 최대 높이
   */
  maxHeight?: string | number;
  /**
   * 테스트 ID (data-testid)
   */
  "data-testid"?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 페이지네이션 모드
   * - 'none': 페이지네이션 없음
   * - 'pagination': 페이지네이션 버튼 표시
   * - 'infinite': 무한스크롤
   * @default 'none'
   */
  paginationMode?: "none" | "pagination" | "infinite";
  /**
   * 현재 페이지 (페이지네이션 모드)
   */
  currentPage?: number;
  /**
   * 전체 페이지 수 (페이지네이션 모드)
   */
  totalPages?: number;
  /**
   * 페이지 변경 핸들러 (페이지네이션 모드)
   */
  onPageChange?: (page: number) => void;
  /**
   * 다음 페이지 로드 함수 (무한스크롤 모드)
   */
  fetchNextPage?: () => void;
  /**
   * 다음 페이지 존재 여부 (무한스크롤 모드)
   */
  hasNextPage?: boolean;
  /**
   * 다음 페이지 로딩 중 여부 (무한스크롤 모드)
   */
  isFetchingNextPage?: boolean;
  /**
   * 전체 데이터 개수 (무한스크롤 모드)
   */
  totalElements?: number;
  /**
   * 컬럼 너비 저장 키 (localStorage 키, 저장 기능 활성화).
   * `columnState`가 주어지면 무시된다.
   */
  storageKey?: string;
  /**
   * 외부에서 제어하는 컬럼 상태 묶음(순서/숨김/너비 + 변경 핸들러).
   * 주어지면 Table은 자체 상태를 만들지 않고 이 객체의 값을 사용한다.
   *
   * Table은 "프리셋"이라는 개념을 모르고, 컬럼 상태의 소스(useColumnPresets, URL state 등)는
   * 외부가 관리한다. ColumnPresetSelector를 사용하려면 외부에서 같은 객체를 셀렉터에도 주입한다.
   */
  columnState?: TableColumnState;
  /**
   * 데이터가 적어 컨테이너가 비어 보일 때 빈 행으로 채워 높이를 유지한다.
   * 비가상화 분기에서만 적용된다.
   * @default true
   */
  fillEmptyRows?: boolean;
}

/**
 * 레거시 테이블 props — 가상화 / 무한스크롤 / 모바일 카드 분기를 모두 한 컴포넌트에 담은 구버전.
 * 신규 페이지는 `Table`(단순) 또는 `PaginatedTable`을 사용하고, 이 prop은 기존 사용처가 점진
 * 마이그레이션 끝나면 제거 예정.
 */
export interface LegacyTableProps<T>
  extends
    Omit<ComponentPropsWithoutRef<"div">, "children">,
    TableCommonProps<T> {}

/**
 * Table 코어 props — 페이지네이션 없는 단순 테이블.
 * PaginatedTable은 이 베이스에 페이지네이션 props를 더한 형태.
 */
export interface TableProps<T>
  extends Omit<ComponentPropsWithoutRef<"div">, "children">,
    Omit<
      TableCommonProps<T>,
      | "virtualized"
      | "virtualizedThreshold"
      | "estimatedRowHeight"
      | "paginationMode"
      | "fetchNextPage"
      | "hasNextPage"
      | "isFetchingNextPage"
      | "currentPage"
      | "totalPages"
      | "onPageChange"
    > {
  /**
   * 마지막 페이지 등 행이 부족할 때 빈 행으로 채워서 테이블 높이 유지
   * @default true
   */
  fillEmptyRows?: boolean;
  /**
   * 총 항목 수 — 본문 아래 우하단에 "총 N건" 자동 표기.
   * `footerSlot`이 함께 주어지면 footerSlot이 우선되고 이 값은 무시된다.
   */
  totalElements?: number;
  /**
   * 테이블 본문 아래에 렌더링할 추가 영역. PaginatedTable이 페이지네이션 footer를 주입할 때 사용.
   * 주어지면 `totalElements` 기반 기본 footer는 그려지지 않는다.
   */
  footerSlot?: ReactNode;
  /**
   * 컬럼 그룹 메타 — thead 상단에 그룹 헤더(colSpan)를 그리고, 컬럼 프리셋이 그룹 단위로
   * 순서/숨김을 다루게 한다. 옵션 2 정책: 그룹은 묶음 고정(내부 컬럼 customization 불가).
   */
  columnGroups?: TableColumnGroupMeta[];
}

/**
 * PaginatedTable 전용 Props — Table 베이스 + 페이지네이션 영역.
 *
 * 무한스크롤/가상화는 지원하지 않고 페이지네이션 전용이에요.
 * 페이지 사이즈 셀렉터 UI도 함께 제공해요.
 */
export interface PaginatedTableProps<T> extends TableProps<T> {
  /**
   * 현재 페이지 (1-base)
   */
  currentPage: number;
  /**
   * 전체 페이지 수
   */
  totalPages: number;
  /**
   * 페이지 변경 핸들러
   */
  onPageChange: (page: number) => void;
  /**
   * 현재 페이지 사이즈
   */
  pageSize?: number;
  /**
   * 선택 가능한 페이지 사이즈 옵션
   * @default [30, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * 페이지 사이즈 변경 핸들러 (값이 있어야 셀렉터 노출)
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * 총 항목 수 — footer에 "총 N건" 표기.
   */
  totalElements?: number;
  /**
   * 이전 페이지 존재 여부 (백엔드 메타필드 `hasPrevious`).
   * 미지정 시 `currentPage > 1`로 자동 판정.
   */
  hasPreviousPage?: boolean;
  /**
   * 다음 페이지 존재 여부 (백엔드 메타필드 `hasNext`).
   * 미지정 시 `currentPage < totalPages`로 자동 판정.
   */
  hasNextPage?: boolean;
  /**
   * Alt(Option) + ←/→로 이전/다음 페이지 네비게이션 활성화
   * 실수 방지를 위해 modifier 키를 강제하고, 인풋/편집 요소 안에서는 무시해요.
   * @default true
   */
  enableKeyboardPagination?: boolean;
  /**
   * footer 좌측 "총 N건" 표시. 대시보드 류 미리보기 카드에서 노이즈를 줄이고 싶을 때 false.
   * @default true
   */
  showTotalCount?: boolean;
  /**
   * 페이지 점프 입력(특정 페이지로 바로 이동) + 키보드 가이드 노출.
   * false면 페이지네이션 바만 남아 가장 가벼운 UI가 됨 (대시보드 류 미리보기에 적합).
   * @default true
   */
  enablePageJump?: boolean;
}
