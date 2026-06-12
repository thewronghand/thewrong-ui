interface Props {
  /** 메인 타이틀. 페이지 식별의 1순위 정보. */
  title: string;
  /** 한 줄 설명. title 옆에 baseline 정렬로 표시(없으면 생략). */
  subtitle?: string;
  className?: string;
}

/**
 * 페이지 헤더 좌측에 표시되는 타이틀 영역.
 *
 * Breadcrumb 자리를 대체. source는 라우트 뎁스가 얕아 빵부스러기보단 굵은 타이틀 + 부제목이
 * 페이지 식별에 적합. subtitle은 title 옆에 baseline 정렬로 가로 배치 — 좁은 화면에서는 wrap.
 *
 * subtitle 매핑은 `usePageTitle` 훅이 메뉴 데이터의 `description` 필드를 읽어 전달.
 */
export function PageTitle({ title, subtitle, className = "" }: Props) {
  // truncate 우선순위: 좁아지면 subtitle이 먼저 줄고(`shrink-3`), 더 좁아지면 title도 줄어든다(`shrink`).
  // 두 항목 모두 `min-w-0`이라야 자식 `truncate`가 동작.
  return (
    <div
      className={`flex min-w-0 items-baseline gap-x-3 ${className}`}
    >
      <h1 className="min-w-0 shrink truncate text-base font-semibold text-text-secondary sm:text-lg">
        {title}
      </h1>
      {subtitle && (
        <p className="min-w-0 shrink-3 truncate text-xs text-text-tertiary sm:text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
}
