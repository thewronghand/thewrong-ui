import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge에 커스텀 시맨틱 유틸리티를 등록한다.
 *
 * 기본 twMerge는 `rounded-control-medium` 같은 커스텀 클래스를 모르므로
 * `cn("rounded-control-medium", "rounded-full")`에서 둘 다 남기거나, `border-control`을
 * 보더 색으로 오인해 `border-border-danger`를 지우는 식으로 조용히 틀린다.
 *
 * `extend.classGroups`의 키가 기본 그룹명과 같으면 그 그룹에 **추가**된다. 그래야 커스텀과
 * 표준(h-10, px-4, z-10 …)이 같은 충돌 그룹으로 판정된다.
 *
 * ⚠️ src/styles/semantic.css에 유틸리티를 추가하면 여기도 같이 등록한다(드리프트 방지).
 *   테스트: src/lib/utils.test.ts
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // --radius-* 역할 반경
      rounded: [
        "rounded-control-mini",
        "rounded-control-small",
        "rounded-control-medium",
        "rounded-control-large",
        "rounded-surface",
        "rounded-badge",
        "rounded-checkbox",
        "rounded-chip",
        "rounded-circle",
        "rounded-toast",
        "rounded-sheet",
        "rounded-tooltip",
      ],
      // 방향 변형은 rounded와 별도 충돌 그룹이다. 전체(rounded-*)가 뒤에 오면 방향 변형을 덮는다.
      "rounded-t": ["rounded-t-sheet", "rounded-t-control-mini"],
      // --spacing-control-* · --spacing-slot-icon-*
      h: [
        "h-control-mini",
        "h-control-small",
        "h-control-medium",
        "h-control-large",
        "h-slot-icon-mini",
        "h-slot-icon-small",
        "h-slot-icon-medium",
        "h-slot-icon-large",
      ],
      w: [
        "w-control-mini",
        "w-control-small",
        "w-control-medium",
        "w-control-large",
        "w-slot-icon-mini",
        "w-slot-icon-small",
        "w-slot-icon-medium",
        "w-slot-icon-large",
      ],
      // --spacing-control-pad-*
      px: [
        "px-control-pad-mini",
        "px-control-pad-small",
        "px-control-pad-medium",
        "px-control-pad-large",
      ],
      // --spacing-slot-* · --spacing-button-*
      gap: [
        "gap-slot-mini",
        "gap-slot-small",
        "gap-slot-medium",
        "gap-slot-large",
        "gap-button-mini",
        "gap-button-small",
        "gap-button-medium",
        "gap-button-large",
      ],
      size: [
        "size-button-icon-mini",
        "size-button-icon-small",
        "size-button-icon-medium",
        "size-button-icon-large",
        "size-button-spinner-mini",
        "size-button-spinner-small",
        "size-button-spinner-medium",
        "size-button-spinner-large",
      ],
      // 미등록이면 border-control·ring-button을 색으로 오인한다. 폭 그룹에 두어 색 역할과 함께 남긴다.
      "border-w": ["border-control", "border-button"],
      "ring-w": ["ring-control", "ring-button", "ring-input-clear"],
      duration: ["duration-control", "duration-button"],
      ease: ["ease-control", "ease-button"],
      animate: ["animate-button-spinner"],
      opacity: [
        "opacity-button-spinner-track",
        "opacity-button-spinner-head",
        "opacity-button-loading-label",
        "opacity-button-disabled",
        "opacity-icon-button-disabled",
      ],
      // --text-control-* · --text-slot-badge-* (text-sm 등과 같은 그룹)
      "font-size": [
        "text-control-mini",
        "text-control-small",
        "text-control-medium",
        "text-control-large",
        "text-slot-badge-mini",
        "text-slot-badge-small",
        "text-slot-badge-medium",
        "text-slot-badge-large",
      ],
      // 폰트 역할은 family와 weight를 함께 지정하므로 family 그룹으로 병합한다.
      "font-family": ["font-control-action"],
      shadow: [
        "shadow-control",
        "shadow-surface",
        "shadow-overlay",
        "shadow-tooltip",
      ],
      // semantic.css의 @utility z-*
      z: ["z-overlay", "z-toast-backdrop", "z-floating", "z-toast"],
    },
  },
});

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 조건부 클래스와 중복 제거를 한 번에 처리.
 * 커스텀 시맨틱 유틸리티(rounded-control-*, h-control-*, z-floating 등)도 충돌 판정에 포함된다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * `{ year, month }` 또는 `(year, month)`를 "YYYY. MM." 형식으로 포맷한다.
 * 통계/대시보드 등 월 단위 화면 라벨에 사용.
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}. ${String(month).padStart(2, "0")}.`;
}
