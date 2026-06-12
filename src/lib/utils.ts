import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 조건부 클래스와 중복 제거를 한 번에 처리
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