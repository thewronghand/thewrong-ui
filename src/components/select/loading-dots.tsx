/**
 * 점 3개 점진적 페이드 로딩 인디케이터.
 * 검색/페이지 fetch 중 부담 없는 시각 신호로 Select/MultiSelect 양쪽에서 공용.
 *
 * @keyframes는 tailwind animate-pulse를 stagger로 사용 — animationDelay만 inline.
 */
export const LoadingDots = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex items-end gap-0.5 ${className}`}
    aria-label="로딩 중"
    role="status"
  >
    <span
      className="block h-1 w-1 animate-pulse rounded-full bg-current"
      style={{ animationDelay: "0ms" }}
    />
    <span
      className="block h-1 w-1 animate-pulse rounded-full bg-current"
      style={{ animationDelay: "200ms" }}
    />
    <span
      className="block h-1 w-1 animate-pulse rounded-full bg-current"
      style={{ animationDelay: "400ms" }}
    />
  </span>
);
