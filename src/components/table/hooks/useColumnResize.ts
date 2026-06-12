import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

/**
 * 컬럼 너비 상태 타입
 */
export interface ColumnWidths {
  [key: string]: number;
}

/**
 * 컬럼 리사이즈 훅 옵션
 */
export interface UseColumnResizeOptions<T> {
  /**
   * 컬럼 정의 배열
   */
  columns: Array<{ key: string; header?: string | ReactNode }>;
  /**
   * 테이블 데이터
   */
  data: T[];
  /**
   * 셀 내용 추출 함수
   */
  getCellContent: (row: T, key: string) => ReactNode;
  /**
   * 기본 컬럼 너비
   * @default 150
   */
  defaultWidth?: number;
  /**
   * 최소 컬럼 너비
   * @default 50
   */
  minWidth?: number;
  /**
   * 최대 컬럼 너비
   */
  maxWidth?: number;
  /**
   * 테이블 요소 ref (실제 DOM 측정용)
   */
  tableRef?: React.RefObject<HTMLTableElement | null>;
  /**
   * 컬럼 너비 저장 키 (localStorage 키, 저장 기능 활성화).
   * `controlledWidths`가 주어지면 무시된다.
   */
  storageKey?: string;
  /**
   * 외부(예: 프리셋 훅)에서 너비를 controlled로 주입. 주어지면 내부 state 대신 사용.
   */
  controlledWidths?: ColumnWidths;
  /**
   * controlled 모드일 때 너비가 변할 때마다 호출. 외부 store에 반영 책임을 넘긴다.
   */
  onColumnWidthsChange?: (widths: ColumnWidths) => void;
}

/**
 * 컬럼 리사이즈 훅 반환값
 */
export interface UseColumnResizeReturn {
  /**
   * 컬럼 너비 상태
   */
  columnWidths: ColumnWidths;
  /**
   * 마우스 다운 핸들러 (드래그 시작)
   */
  handleMouseDown: (key: string, e: React.MouseEvent) => void;
  /**
   * 더블 클릭 핸들러 (자동 너비 조절)
   */
  handleDoubleClick: (key: string, e: React.MouseEvent) => void;
  /**
   * 컬럼 너비 가져오기
   */
  getColumnWidth: (key: string, defaultWidth?: number | string) => string;
  /**
   * 측정용 ref
   */
  measureRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 컬럼 리사이즈 훅
 *
 * @example
 * ```tsx
 * const { columnWidths, handleMouseDown, handleDoubleClick, getColumnWidth, measureRef } = useColumnResize({
 *   columns,
 *   data,
 *   getCellContent: (row, key) => {
 *     const column = columns.find((col) => col.key === key);
 *     return column?.accessor ? column.accessor(row) : (row as any)[key];
 *   },
 * });
 * ```
 */
export function useColumnResize<T = any>({
  columns,
  // data, getCellContent — 자동 너비 측정(calculateOptimalWidth)에서만 쓰였으나
  // 해당 헬퍼는 미사용이라 제거됨. 옵션 타입에는 호환을 위해 남겨둔다.
  defaultWidth = 150,
  minWidth = 50,
  maxWidth,
  tableRef,
  storageKey,
  controlledWidths,
  onColumnWidthsChange,
}: UseColumnResizeOptions<T>): UseColumnResizeReturn {
  const isControlled = controlledWidths !== undefined;

  // localStorage에서 저장된 컬럼 너비 불러오기 (controlled 모드에서는 사용하지 않음)
  const loadSavedWidths = useCallback((): ColumnWidths => {
    if (isControlled || !storageKey) return {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnWidths;
        const valid: ColumnWidths = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === "number" && value >= minWidth) {
            valid[key] = value;
          }
        });
        return valid;
      }
    } catch (error) {
      console.warn("[ColumnResize] Failed to load saved widths:", error);
    }
    return {};
  }, [isControlled, storageKey, minWidth]);

  const [internalWidths, setInternalWidths] = useState<ColumnWidths>(() => {
    return loadSavedWidths();
  });

  const columnWidths: ColumnWidths = isControlled
    ? (controlledWidths as ColumnWidths)
    : internalWidths;

  const setColumnWidths = useCallback(
    (updater: ColumnWidths | ((prev: ColumnWidths) => ColumnWidths)) => {
      if (isControlled) {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ColumnWidths) => ColumnWidths)(columnWidths)
            : updater;
        onColumnWidthsChange?.(next);
        return;
      }
      setInternalWidths(updater);
    },
    [columnWidths, isControlled, onColumnWidthsChange],
  );

  // 컬럼 너비 변경 시 localStorage에 저장 (controlled 모드에서는 외부가 책임)
  useEffect(() => {
    if (isControlled) return;
    if (!storageKey || Object.keys(internalWidths).length === 0) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(internalWidths));
    } catch (error) {
      console.warn("[ColumnResize] Failed to save widths:", error);
    }
  }, [internalWidths, isControlled, storageKey]);
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  /**
   * ReactNode에서 텍스트 추출 (재귀적으로 모든 텍스트 수집)
   */
  const extractTextFromNode = useCallback((node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (node === null || node === undefined) return "";

    // 배열인 경우 모든 요소에서 텍스트 추출
    if (Array.isArray(node)) {
      return node.map((item) => extractTextFromNode(item)).join("");
    }

    // ReactElement인 경우 children에서 텍스트 추출
    if (typeof node === "object" && "props" in node) {
      const props = node.props as { children?: ReactNode };
      if (props?.children) {
        return extractTextFromNode(props.children);
      }
    }

    return "";
  }, []);

  /**
   * 헤더 텍스트만으로 초기 너비 계산
   */
  const calculateHeaderWidth = useCallback(
    (key: string): number => {
      if (!measureRef.current) return defaultWidth;

      const column = columns.find((col) => col.key === key);
      const header = column?.header;
      const headerText =
        typeof header === "string" ? header : extractTextFromNode(header);

      measureRef.current.textContent = headerText || key;
      measureRef.current.style.fontSize = "14px";
      measureRef.current.style.fontWeight = "600";
      measureRef.current.style.padding = "0 24px"; // 헤더 패딩 (px-6)

      const headerWidth = measureRef.current.offsetWidth;

      // 여유 공간 추가 (리사이즈 핸들 공간 포함, 약 20px)
      return Math.max(minWidth, headerWidth + 20);
    },
    [columns, extractTextFromNode, defaultWidth, minWidth]
  );

  /**
   * 마우스 다운 핸들러 (드래그 시작).
   *
   * 성능 최적화: 드래그 중에는 React state 업데이트를 하지 않고 <colgroup><col>의
   * 인라인 style.width만 직접 조작한다. mouseup 시점에 최종 너비를 한 번만 state에
   * 반영해 리렌더를 1회로 묶는다. (드래그 중 200회 리렌더 → 1회 리렌더)
   */
  const handleMouseDown = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentWidth = columnWidths[key] || defaultWidth;
      resizingRef.current = {
        key,
        startX: e.clientX,
        startWidth: currentWidth,
      };

      // 드래그 중 직접 조작할 <col> element 찾기. Table 컴포넌트가 각 컬럼 <col>에
      // `data-col-key={column.key}`를 박아두므로 그걸로 직접 매칭한다.
      const colEl =
        tableRef?.current?.querySelector<HTMLTableColElement>(
          `colgroup col[data-col-key="${CSS.escape(key)}"]`,
        ) ?? null;

      // 테이블은 width를 "모든 컬럼 width 합(px)"으로 잡는다(table.tsx). 드래그 중에는
      // React state를 안 건드리고 colEl만 직접 조작하므로, 테이블 width도 함께 직접
      // 갱신하지 않으면 width가 기존 합에 고정된 채 col만 커져, table-layout:fixed가
      // 그 초과분을 테이블을 늘려 흡수 → 가로 스크롤이 끝없이 늘어난다.
      // 그래서 drag 시작 시점의 "이 컬럼을 뺀 나머지 합"을 baseline으로 잡고, 매 프레임
      // 테이블 width = baseline + 현재 컬럼 width 로 같이 갱신한다.
      const tableEl = tableRef?.current ?? null;
      const startTableWidth = tableEl
        ? parseFloat(tableEl.style.width) || tableEl.offsetWidth
        : 0;
      const otherColumnsWidth = startTableWidth - currentWidth;

      // 컬럼 하나가 상식 밖으로 커지지 않게 상한을 둔다. 스크롤 컨테이너 가시 너비를
      // 기준으로 삼아(한 컬럼이 화면 전체를 넘지 못하게), prop maxWidth가 있으면 더 작은 값.
      // clientWidth가 0(부모 display:none/레이아웃 미확정)이면 상한을 두지 않는다 — 0을
      // 상한으로 쓰면 컬럼이 0px로 찌그러진다.
      const containerWidth =
        tableEl?.parentElement?.clientWidth || Infinity;
      const upperBound = Math.min(maxWidth ?? Infinity, containerWidth);

      let latestWidth = currentWidth;
      let rafId: number | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;

        const diff = moveEvent.clientX - resizingRef.current.startX;
        const newWidth = Math.max(
          minWidth,
          resizingRef.current.startWidth + diff,
        );
        // 상한 적용 후에도 minWidth 하한을 보장 (upperBound가 minWidth보다 작아질 수 있음).
        const finalWidth = Math.max(minWidth, Math.min(newWidth, upperBound));
        latestWidth = finalWidth;

        // rAF로 묶어 프레임당 한 번만 DOM 조작.
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (colEl) {
            colEl.style.width = `${latestWidth}px`;
          }
          if (tableEl) {
            tableEl.style.width = `${otherColumnsWidth + latestWidth}px`;
          }
        });
      };

      const handleMouseUp = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        const finishedKey = resizingRef.current?.key;
        resizingRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // 최종 너비를 state에 한 번만 반영. (DOM은 이미 그 값으로 그려져 있어 깜빡임 없음)
        if (finishedKey) {
          setColumnWidths((prev) => ({
            ...prev,
            [finishedKey]: latestWidth,
          }));
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columnWidths, defaultWidth, minWidth, maxWidth, tableRef, setColumnWidths],
  );

  /**
   * 더블 클릭 핸들러 (제거됨 - 더 이상 사용하지 않음)
   */
  const handleDoubleClick = useCallback(() => {
    // 더블 클릭 기능 제거됨
  }, []);

  /**
   * 컬럼 너비 가져오기
   */
  const getColumnWidth = useCallback(
    (key: string, defaultWidthProp?: number | string): string => {
      // 사용자가 조절한 너비가 있으면 우선 사용
      if (columnWidths[key]) {
        return `${columnWidths[key]}px`;
      }

      // 명시적으로 지정된 너비가 있으면 사용
      if (defaultWidthProp) {
        return typeof defaultWidthProp === "number"
          ? `${defaultWidthProp}px`
          : defaultWidthProp;
      }

      // 기본값이 없으면 헤더 텍스트 길이에 맞춰 계산
      const headerWidth = calculateHeaderWidth(key);
      return `${headerWidth}px`;
    },
    [columnWidths, calculateHeaderWidth]
  );

  return {
    columnWidths,
    handleMouseDown,
    handleDoubleClick,
    getColumnWidth,
    measureRef,
  };
}
