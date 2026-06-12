import { Keyboard } from "lucide-react";
import type { KeyboardEvent } from "react";

interface KeyboardNavButtonProps {
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * 페이지 키보드 네비게이션 가이드 버튼.
 *
 * 포커스되면 ←/→ 키로 페이지 이동이 가능하다는 라벨이 슬라이드 인.
 * 터치 전용 기기(`pointer: coarse`)에서는 의미가 없으므로 자동 숨김.
 */
export function KeyboardNavButton({ onKeyDown }: KeyboardNavButtonProps) {
  return (
    <button
      type="button"
      onKeyDown={onKeyDown}
      title="키보드로 페이지 이동 (포커스 후 ← / → 키)"
      aria-label="키보드로 페이지 이동 활성화"
      className="group/kbd inline-flex items-center gap-0 rounded border border-neutral-300 bg-white px-1.5 py-1 text-neutral-500 transition-[color,background-color,border-color,gap] duration-200 hover:border-primary-300 hover:text-primary-600 focus:gap-1.5 focus:border-primary-500 focus:bg-primary-50 focus:text-primary-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-primary-400 dark:focus:bg-primary-950/40 dark:focus:text-primary-300 pointer-coarse:hidden"
    >
      <Keyboard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {/*
        라벨 슬라이드 인 트릭: width auto는 transition이 안 먹지만
        grid-template-columns의 fr 단위는 transition이 가능 → 0fr ↔ 1fr로 부드럽게 펼쳐짐.
      */}
      <span className="grid grid-cols-[0fr] overflow-hidden text-xs tabular-nums opacity-0 transition-[grid-template-columns,opacity] duration-200 group-focus/kbd:grid-cols-[1fr] group-focus/kbd:opacity-100">
        <span className="min-w-0 whitespace-nowrap">← / → 키로 이동 중</span>
      </span>
    </button>
  );
}
