export interface TypewriterTextProps {
  /** 표시할 전체 문자열. */
  text: string;
  /** 시작 전 대기 시간(ms). 기본 0. */
  delay?: number;
  /** false면 즉시 표시한다. 재방문 시 효과를 생략하려면 상위에서 이 값을 관리한다. */
  animate?: boolean;
  /** 타이핑 또는 즉시 표시가 끝나면 호출된다. */
  onComplete?: () => void;
  /** 글자 또는 공백을 포함한 단어 단위로 표시한다. 기본 character. */
  unit?: "character" | "word";
}
