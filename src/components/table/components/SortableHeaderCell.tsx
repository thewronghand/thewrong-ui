import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  useContext,
  useId,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

interface SortableHeaderKeyboardDrag {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  descriptionId: string;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

const SortableHeaderKeyboardDragContext =
  createContext<SortableHeaderKeyboardDrag | null>(null);

export const useSortableHeaderKeyboardDrag = () =>
  useContext(SortableHeaderKeyboardDragContext);

interface SortableHeaderCellProps {
  id: string;
  /**
   * 드래그 비활성 (시스템 컬럼 등)
   */
  disabled?: boolean;
  /**
   * 컨테이너 태그 — 가상화는 div, 일반 테이블은 th
   * @default "div"
   */
  as?: "div" | "th";
  /** `as="th"`일 때만 의미. 컬럼 그룹 헤더에서 사용. */
  colSpan?: number;
  /** `as="th"`일 때만 의미. 그룹과 평면 컬럼이 섞일 때 평면 컬럼은 rowSpan=2. */
  rowSpan?: number;
  "aria-sort"?: "ascending" | "descending";
  hasSortButton?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * 헤더 셀을 드래그 가능한 sortable item으로 감싸요.
 * 5px 임계는 부모 DndContext의 PointerSensor에서 처리해서, 헤더 클릭(정렬)이나
 * 리사이즈 핸들 mousedown은 방해하지 않아요.
 */
export function SortableHeaderCell({
  id,
  disabled = false,
  as = "div",
  colSpan,
  rowSpan,
  "aria-sort": ariaSort,
  hasSortButton = false,
  className,
  style,
  children,
}: SortableHeaderCellProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const descriptionId = useId();
  const keyboardDrag =
    !disabled && hasSortButton
      ? {
          setActivatorNodeRef,
          descriptionId,
          onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
            if (isDragging) return;
            event.stopPropagation();
            if (event.shiftKey && event.code === "Space") {
              listeners?.onKeyDown?.(event);
            }
          },
        }
      : null;

  const mergedStyle: CSSProperties = {
    ...style,
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? undefined : "grab",
  };

  const Tag = as;
  // th일 때만 colSpan/rowSpan 의미 있음.
  const tableCellAttrs =
    as === "th"
      ? {
          ...(colSpan !== undefined ? { colSpan } : {}),
          ...(rowSpan !== undefined ? { rowSpan } : {}),
        }
      : {};
  return (
    <SortableHeaderKeyboardDragContext.Provider value={keyboardDrag}>
      <Tag
        ref={setNodeRef as never}
        className={className}
        style={mergedStyle}
        {...tableCellAttrs}
        {...(disabled
          ? {}
          : hasSortButton
            ? {
                ...attributes,
                tabIndex: undefined,
                "aria-roledescription": undefined,
                "aria-describedby": undefined,
                "aria-disabled": undefined,
              }
            : attributes)}
        {...(disabled ? {} : listeners)}
        role={as === "th" ? "columnheader" : disabled ? undefined : attributes.role}
        aria-sort={ariaSort}
      >
        {children}
        {keyboardDrag && (
          <span id={descriptionId} aria-hidden="true" className="sr-only">
            Shift+Space로 컬럼 이동을 시작하고 화살표로 이동한 뒤 Space 또는 Enter로 놓습니다.
          </span>
        )}
      </Tag>
    </SortableHeaderKeyboardDragContext.Provider>
  );
}
