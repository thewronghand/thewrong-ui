import {
  Children,
  isValidElement,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { ChevronDown, Wrench } from "lucide-react";

import { useIsMobile } from "@/hooks";
import { Button } from "@/components/button";
import { Popover } from "@/components/popover";

/**
 * 테이블 위에 놓이는 표준 툴바 — 컴파운드 컴포넌트.
 *
 * 자식 슬롯:
 * - `<Toolbar.Title>`: 영역 타이틀(옵션). 패딩 없는 16px text-text-tertiary 텍스트.
 * - `<Toolbar.Summary>`: 데이터 요약 칩 영역 (옵션, mini summary). collapsible로 펼치기/접기.
 * - `<Toolbar.Left>`: 좌측 컨트롤 (ColumnPresetSelector 등).
 * - `<Toolbar.Right>`: 우측 액션 (엑셀 다운로드, 등록 버튼 등).
 *
 * 레이아웃 규칙:
 * - Summary가 있으면 윗줄. Left+Right는 아랫줄.
 * - Summary가 없으면 Left+Right만 한 줄.
 * - Left만 있으면 좌측 한 줄. Right만 있으면 우측 한 줄.
 *
 * `<Toolbar.Summary collapsible>`은 모바일에서 첫 자식만 노출하고 셰브론으로 펼치기.
 * 데스크톱에서는 collapsible 무시(전체 노출).
 */
/**
 * 슬롯 마커.
 *
 * 자식 슬롯 매칭을 `child.type === ToolbarSummary` 같은 함수 참조 비교로 하면,
 * SPA 네비게이션/번들 분할/HMR 등으로 컴포넌트 함수 참조가 둘로 갈릴 때 매칭이 전부
 * false가 되어 Toolbar가 빈 div로 렌더되는 간헐적 버그가 있었다. minification에도
 * 보존되는 Symbol을 static 프로퍼티로 부여해 참조 무관하게 식별한다.
 */
const TOOLBAR_SLOT = Symbol.for("source.toolbar.slot");
type SlotKind = "title" | "summary" | "left" | "right";

type SlotComponent<P> = ComponentType<P> & { [TOOLBAR_SLOT]?: SlotKind };

function tagSlot<P>(component: ComponentType<P>, kind: SlotKind) {
  (component as SlotComponent<P>)[TOOLBAR_SLOT] = kind;
  return component as SlotComponent<P>;
}

function getSlotKind(type: unknown): SlotKind | undefined {
  if (typeof type !== "function" && typeof type !== "object") return undefined;
  return (type as { [TOOLBAR_SLOT]?: SlotKind })[TOOLBAR_SLOT];
}

interface ToolbarProps {
  children?: ReactNode;
  className?: string;
}

interface ToolbarSlotProps {
  children?: ReactNode;
  className?: string;
}

interface ToolbarSummaryProps extends ToolbarSlotProps {
  /**
   * 총 건수 — 트리거 칩에 "총 N건"으로 표시. 조회 API의 totalElements를 그대로 넘긴다.
   * 칩 자체는 Toolbar.Summary가 자체 렌더(neutral outline 스타일).
   */
  totalElements?: number;
  /** "건" 대신 다른 단위가 필요하면 override. 기본 "건". */
  totalUnit?: string;
  /** "총"과 숫자 사이에 들어갈 대상명. 기본 빈 문자열. 예: "MID" → "총 MID 89건". */
  totalPrefix?: string;
  /** 모바일에서 트리거 칩만 노출하고 셰브론으로 펼치기. 기본 false. */
  collapsible?: boolean;
  /** 초기 접힘 여부 (collapsible일 때만 의미). 기본 true(접힘 시작). */
  defaultCollapsed?: boolean;
}

interface ToolbarRightProps extends ToolbarSlotProps {
  /**
   * 모바일에서 자식이 여러 개면 단일 트리거 버튼 + 팝오버 안에 세로 배치로 묶는다.
   * 자식이 1개면 그대로 노출. 기본 false.
   */
  collapseOnMobile?: boolean;
  /** collapseOnMobile일 때 트리거 버튼 라벨. 기본 "작업". */
  collapseTriggerLabel?: ReactNode;
  /** collapseOnMobile일 때 트리거 버튼 아이콘. 기본 Wrench. */
  collapseTriggerIcon?: ReactNode;
}

function Toolbar({ children, className = "" }: ToolbarProps) {
  const childArray = Children.toArray(children);

  let titleNode: ReactNode = null;
  let summaryNode: ReactNode = null;
  let leftNode: ReactNode = null;
  let rightNode: ReactNode = null;

  for (const child of childArray) {
    if (!isValidElement(child)) continue;
    switch (getSlotKind(child.type)) {
      case "title":
        titleNode = child;
        break;
      case "summary":
        summaryNode = child;
        break;
      case "left":
        leftNode = child;
        break;
      case "right":
        rightNode = child;
        break;
    }
  }

  const hasBottomRow = leftNode || rightNode;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Title ↔ 아래 영역: 14/24px (모바일/md+). 다른 자식 없으면 mb 없음. */}
      {titleNode ? (
        <div className={summaryNode || hasBottomRow ? "mb-3.5 md:mb-6" : ""}>
          {titleNode}
        </div>
      ) : null}
      {summaryNode}
      {hasBottomRow && (
        <div
          className={`flex flex-wrap items-center gap-2 ${
            summaryNode ? "mt-2.5 md:mt-4.5" : ""
          }`}
        >
          {leftNode}
          {rightNode ? <div className="ml-auto">{rightNode}</div> : null}
        </div>
      )}
    </div>
  );
}

interface ToolbarTitleProps {
  children?: ReactNode;
  className?: string;
}

function ToolbarTitle({ children, className = "" }: ToolbarTitleProps) {
  return (
    <h2
      className={`text-sm font-medium text-text-tertiary md:text-base ${className}`}
    >
      {children}
    </h2>
  );
}

function ToolbarSummary({
  children,
  className = "",
  totalElements,
  totalUnit = "건",
  totalPrefix = "",
  collapsible = false,
  defaultCollapsed = true,
}: ToolbarSummaryProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isMobile = useIsMobile();
  const items = Children.toArray(children);
  const hasTrigger = totalElements != null;

  if (!hasTrigger && items.length === 0) return null;

  // 트리거 칩(총 N건 + 셰브론) — totalElements가 있을 때 자체 렌더. neutral outline.
  // 모바일에서만 button(셰브론 토글), 데스크톱은 span — 스크린리더에 dead element 노출 회피.
  const triggerLabel = `총 ${totalPrefix ? `${totalPrefix} ` : ""}${totalElements?.toLocaleString() ?? 0}${totalUnit}`;
  const triggerInteractive = collapsible && items.length > 0 && isMobile;
  const triggerClassName =
    "inline-flex items-center gap-1 rounded-full border border-border-secondary px-2.5 py-1 text-sm font-medium text-text-secondary";
  const triggerNode = hasTrigger ? (
    triggerInteractive ? (
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "요약 펼치기" : "요약 접기"}
        className={triggerClassName}
      >
        <span>{triggerLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>
    ) : (
      <span className={triggerClassName}>{triggerLabel}</span>
    )
  ) : null;

  // collapsible 미사용 시 — 트리거(있으면) + 모든 자식을 한 flex-wrap 줄에 그대로.
  // column-gap 8px(칩 사이) / row-gap 6px(wrap된 줄 사이)
  if (!collapsible) {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}
      >
        {triggerNode}
        {items}
      </div>
    );
  }

  // 트리거 + 칩들을 같은 flex-wrap 컨테이너에 두어 자리 남으면 같은 줄에 위치.
  // 모바일에서 collapsed면 칩들을 max-height 트랜지션으로 접음.
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}
    >
      {triggerNode}
      {items.map((child, i) => {
        // Children.toArray가 부여한 안정 key를 wrapper로 이어받아 자식 순서 변경에도
        // 트랜지션 상태가 정확한 칩에 머무르도록 한다.
        const key = isValidElement(child) ? child.key ?? i : i;
        // grid-template-rows 0fr↔1fr + min-h-0 패턴 — max-height 상한 없이도
        // 자식 실제 높이에 맞춰 트랜지션. multi-line 칩이 들어와도 안전.
        return (
          <div
            key={key}
            className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out sm:grid-rows-[1fr]! sm:opacity-100! ${
              collapsed
                ? "grid-rows-[0fr] opacity-0 -my-1"
                : "grid-rows-[1fr] opacity-100"
            }`}
          >
            <div className="overflow-hidden min-h-0">{child}</div>
          </div>
        );
      })}
    </div>
  );
}

function ToolbarLeft({ children, className = "" }: ToolbarSlotProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>{children}</div>
  );
}

function ToolbarRight({
  children,
  className = "",
  collapseOnMobile = false,
  collapseTriggerLabel = "작업",
  collapseTriggerIcon,
}: ToolbarRightProps) {
  const isMobile = useIsMobile();
  const items = Children.toArray(children);

  // 모바일 + 자식 2개 이상 + collapseOnMobile → 트리거 버튼 + 팝오버 안에 세로 배치.
  const shouldCollapse = collapseOnMobile && isMobile && items.length >= 2;

  if (!shouldCollapse) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>{children}</div>
    );
  }

  const trigger = (
    <Button
      variant="primary"
      size="mini"
      leadingIcon={collapseTriggerIcon ?? <Wrench className="h-3.5 w-3.5" />}
      trailingIcon={<ChevronDown className="h-3.5 w-3.5" />}
    >
      {collapseTriggerLabel}
    </Button>
  );

  return (
    <div className={`flex items-center ${className}`}>
      <Popover
        trigger={trigger}
        content={
          <div className="flex flex-col gap-2 [&>*]:w-full">{items}</div>
        }
      />
    </div>
  );
}

/**
 * Toolbar.Summary 안에 들어가는 칩.
 *
 * variant별 색감:
 * - neutral: 외곽선 + 회색 텍스트 (총합/기본 칩, 모바일 토글 트리거에 적합)
 * - info: 옅은 파랑 (정보성)
 * - success: 옅은 초록 (입금/플러스)
 * - error: 옅은 빨강 (출금/마이너스) — `danger`도 동일 alias
 * - warning: 옅은 노랑 (차액/주의)
 *
 * 사이즈: 14px font, 가로 10px / 세로 4px 패딩. 칩 간 간격은 부모 컨테이너의 gap-2(8px).
 */
type ToolbarSummaryItemVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "danger";

interface ToolbarSummaryItemProps {
  variant?: ToolbarSummaryItemVariant;
  children?: ReactNode;
  className?: string;
}

const SUMMARY_ITEM_VARIANT_CLASSES: Record<
  Exclude<ToolbarSummaryItemVariant, "danger">,
  string
> = {
  neutral:
    "border border-border-secondary text-text-secondary dark:border-border-secondary",
  info: "bg-info-50 text-info-600 dark:bg-info-900/40 dark:text-info-200",
  success:
    "bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-200",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-900/40 dark:text-warning-200",
  error: "bg-error-50 text-error-600 dark:bg-error-900/40 dark:text-error-200",
};

function ToolbarSummaryItem({
  variant = "neutral",
  children,
  className = "",
}: ToolbarSummaryItemProps) {
  const key = variant === "danger" ? "error" : variant;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${SUMMARY_ITEM_VARIANT_CLASSES[key]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * 모바일 작업 팝오버 등 평탄 메뉴의 아이템.
 *
 * 좌측 정렬 + 선택적 leading icon + 라벨 + hover bg. 일반 Button(가운데 정렬)과 시각 구분.
 * 호출처는 `<Toolbar.MenuItem icon={<Send/>} onClick={...}>관리자 이체</Toolbar.MenuItem>` 형태로 사용.
 */
interface ToolbarMenuItemProps {
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function ToolbarMenuItem({
  icon,
  children,
  onClick,
  disabled,
  className = "",
}: ToolbarMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-700 ${className}`}
    >
      {icon ? (
        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

// 각 슬롯 컴포넌트에 Symbol 마커 부여 — Toolbar 부모가 참조 무관하게 식별한다.
Toolbar.Title = tagSlot(ToolbarTitle, "title");
Toolbar.Summary = Object.assign(tagSlot(ToolbarSummary, "summary"), {
  Item: ToolbarSummaryItem,
});
Toolbar.Left = tagSlot(ToolbarLeft, "left");
Toolbar.Right = tagSlot(ToolbarRight, "right");
Toolbar.MenuItem = ToolbarMenuItem;

export { Toolbar };
export type { ToolbarSummaryItemVariant };
