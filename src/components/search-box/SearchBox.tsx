import { ListFilter, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import { useIsMobile } from "@/hooks";
import { Button } from "@/components/button";
import { StandardModal } from "@/components/modal";

import { ExactMatchToggle } from "./ExactMatchToggle";
import { SearchBoxChips } from "./SearchBoxChips";
import { SearchBoxField } from "./SearchBoxField";
import { SearchBoxSheetContext } from "./SearchBoxSheetContext";
import type { SearchField, SearchValues } from "./types";
import { useSearchBoxState } from "./useSearchBoxState";

interface Props {
  /** 호출부가 `as const satisfies readonly SearchField[]` 패턴을 쓰면 parseSearchValues가
   * 타입을 정확히 추론하므로 readonly 시그니처로 받는다. */
  fields: readonly SearchField[];
  /** 외부에서 적용된 값. 초기값 + 외부에서 강제 변경(예: URL 동기화) 시 반영. */
  values: SearchValues;
  /** [검색] 또는 Enter로 commit. */
  onSearch: (next: SearchValues) => void;
  /** [초기화]. 미지정 시 빈 객체로 onSearch 호출. */
  onClear?: () => void;
  /** 검색 요청 진행 중 — 검색 버튼 비활성화 + Enter/submit no-op. */
  isSubmitting?: boolean;
  /** "완전일치" 옵션 — 지정하면 검색/초기화 좌측에 토글 노출. value/onChange 같이 받는다. */
  exactMatch?: {
    value: boolean;
    onChange: (next: boolean) => void;
  };
  /** className for outer wrapper. */
  className?: string;
}

/**
 * 공용 검색박스.
 *
 * 동작 요약:
 * - 입력 즉시 검색 X — [검색]/Enter/[적용](모바일 시트) 시점에만 commit
 * - select 활성값만 칩으로 표시
 * - 데스크톱: 페이지 배경 위에 투명하게 떠 있는 플로팅 라벨 필드 + 우측 액션 버튼
 * - 모바일: 헤더 없이 우측 [초기화][검색][필터] 아이콘 3개만. 필터 클릭 시 바텀시트로 본체 표시.
 *   바텀시트 안에서 입력 후 [적용]을 눌러야 commit (시트 외부 클릭/닫기는 입력 폐기).
 *
 * 페이지에서는 `fields` 배열만 정의해서 넘기고, draft 관리는 SearchBox 내부가 담당.
 */
export function SearchBox({
  fields,
  values,
  onSearch,
  onClear,
  isSubmitting = false,
  exactMatch,
  className = "",
}: Props) {
  const isMobile = useIsMobile();
  const fieldSize: "mini" | "small" = isMobile ? "mini" : "small";

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { draft, setFieldValue, submit, clear, chips, removeChip } =
    useSearchBoxState({ fields, values, onSearch, onClear });

  // 진행 중일 땐 SearchBoxField onEnter / 버튼 onClick 호출 자체를 무력화 — 중복 요청 방지.
  // 무력화 시 false 반환(검증 실패와 같은 의미)으로 호출부가 안전하게 분기 가능.
  const guardedSubmit = (): boolean => (isSubmitting ? false : submit());

  const applyFromSheet = () => {
    // submit이 false면 검증 실패(예: 날짜 역전) — 토스트만 띄우고 시트는 유지.
    const ok = guardedSubmit();
    if (ok) setIsSheetOpen(false);
  };

  if (isMobile) {
    return (
      <div className={`w-full ${className}`}>
        {/* 모바일 액션 줄 — 페이지 헤더 아래에 검색어 입력 영역과 함께 배치되는 가정.
            SearchBox는 펼친 필드를 보여주지 않고 우측 아이콘 3개만 노출. */}
        <div className="flex w-full items-center justify-end gap-1">
          <IconButton
            label="초기화"
            onClick={clear}
            variant="ghost"
            icon={<RotateCcw className="h-4 w-4" />}
          />
          <IconButton
            label="검색"
            onClick={guardedSubmit}
            disabled={isSubmitting}
            variant="primary"
            icon={<Search className="h-4 w-4" />}
          />
          <IconButton
            label="필터"
            onClick={() => setIsSheetOpen(true)}
            variant="ghost"
            icon={<ListFilter className="h-4 w-4" />}
            activeDot={chips.length > 0}
          />
        </div>
        {chips.length > 0 && (
          <div className="mt-2">
            <SearchBoxChips chips={chips} onRemove={removeChip} />
          </div>
        )}

        <StandardModal
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title="필터"
          primaryAction={{
            label: "적용",
            onClick: applyFromSheet,
            loading: isSubmitting,
          }}
          secondaryAction={{
            label: "닫기",
            onClick: () => setIsSheetOpen(false),
          }}
        >
          <SearchBoxSheetContext.Provider value={true}>
            <div className="flex flex-col gap-4">
              {fields
                .filter((field) => !field.hidden)
                .map((field) => (
                  <SearchBoxField
                    key={field.key}
                    field={field}
                    value={draft[field.key] ?? ""}
                    onChange={(v) => setFieldValue(field.key, v)}
                    onEnter={applyFromSheet}
                    size="small"
                  />
                ))}
              {exactMatch && (
                <div className="flex justify-end">
                  <ExactMatchToggle
                    value={exactMatch.value}
                    onChange={exactMatch.onChange}
                    size="small"
                  />
                </div>
              )}
            </div>
          </SearchBoxSheetContext.Provider>
        </StandardModal>
      </div>
    );
  }

  // 데스크톱 — 투명 배경 + 플로팅 라벨 필드 + 우측 액션.
  return (
    <div className={`w-full ${className}`}>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
        {fields
          .filter((field) => !field.hidden)
          .map((field) => (
            <div key={field.key} className={field.className ?? "w-44"}>
              <SearchBoxField
                field={field}
                value={draft[field.key] ?? ""}
                onChange={(v) => setFieldValue(field.key, v)}
                onEnter={guardedSubmit}
                size={fieldSize}
              />
            </div>
          ))}

        <div className="ml-auto flex items-center gap-3">
          {exactMatch && (
            <ExactMatchToggle
              value={exactMatch.value}
              onChange={exactMatch.onChange}
              size={fieldSize}
            />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              appearance="outlined"
              size={fieldSize}
              onClick={clear}
              leadingIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="h-10 border-border-tertiary! dark:border-border-secondary!"
            >
              초기화
            </Button>
            <Button
              variant="primary"
              size={fieldSize}
              onClick={guardedSubmit}
              loading={isSubmitting}
              leadingIcon={<Search className="h-3.5 w-3.5" />}
              className="h-10"
            >
              검색
            </Button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-2">
          <SearchBoxChips chips={chips} onRemove={removeChip} />
        </div>
      )}
    </div>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  variant: "primary" | "ghost";
  disabled?: boolean;
  activeDot?: boolean;
}

function IconButton({
  label,
  onClick,
  icon,
  variant,
  disabled,
  activeDot,
}: IconButtonProps) {
  const base =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50";
  const variantClass =
    variant === "primary"
      ? "bg-primary-500 text-white hover:bg-primary-600"
      : "text-icon-secondary hover:bg-bg-base-secondary";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClass}`}
    >
      {icon}
      {activeDot && (
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
      )}
    </button>
  );
}
