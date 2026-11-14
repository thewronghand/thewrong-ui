import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InfoTooltipProps {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * 정보 툴팁 컴포넌트
 *
 * `?` 아이콘에 마우스 호버 시 툴팁을 표시해요. CSS group-hover 기반의 단순 구현.
 *
 * 라벨 옆 보조 설명에 쓴다. `content`가 ReactNode라 강조·줄바꿈이 자유롭다(string만이면 `Tooltip`).
 *
 * @example
 * ```tsx
 * <label>정산 주기 <InfoTooltip content={<>영업일 기준 <b>D+2</b></>} /></label>
 * ```
 */
export function InfoTooltip({ content, position = "top" }: InfoTooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-flex items-center group">
      {/* 아이콘 */}
      <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center cursor-help hover:bg-primary-hover transition-colors">
        <span className="text-[9px] font-bold text-fg-inverse">?</span>
      </div>

      {/* 툴팁 */}
      <div
        className={cn(
          "absolute z-floating px-3 py-2 bg-bg-tooltip text-fg-tooltip text-xs rounded-tooltip shadow-overlay opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-64 whitespace-normal",
          positionClasses[position],
        )}
      >
        {content}
        {/* 화살표 */}
        <div
          className={cn(
            "absolute w-2 h-2 bg-bg-tooltip transform rotate-45",
            position === "top"
              ? "bottom-[-4px] left-1/2 -translate-x-1/2"
              : position === "bottom"
                ? "top-[-4px] left-1/2 -translate-x-1/2"
                : position === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2"
                  : "left-[-4px] top-1/2 -translate-y-1/2",
          )}
        />
      </div>
    </div>
  );
}
