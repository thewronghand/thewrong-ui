import type { ReactNode } from "react";

export interface InfoTooltipProps {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * 정보 툴팁 컴포넌트
 *
 * `?` 아이콘에 마우스 호버 시 툴팁을 표시해요. CSS group-hover 기반의 단순 구현.
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
      <div className="w-3.5 h-3.5 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center cursor-help hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors">
        <span className="text-[9px] font-bold text-white">?</span>
      </div>

      {/* 툴팁 */}
      <div
        className={`absolute ${positionClasses[position]} z-50 px-3 py-2 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-64 whitespace-normal`}
      >
        {content}
        {/* 화살표 */}
        <div
          className={`absolute w-2 h-2 bg-neutral-900 dark:bg-neutral-700 transform rotate-45 ${
            position === "top"
              ? "bottom-[-4px] left-1/2 -translate-x-1/2"
              : position === "bottom"
                ? "top-[-4px] left-1/2 -translate-x-1/2"
                : position === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2"
                  : "left-[-4px] top-1/2 -translate-y-1/2"
          }`}
        />
      </div>
    </div>
  );
}
