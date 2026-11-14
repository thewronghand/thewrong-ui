export interface FieldProps {
  /** 라벨 텍스트. */
  label: string;
  /** 연결할 폼 컨트롤 id. 제공하면 label의 htmlFor로 전달된다. */
  htmlFor?: string;
  /**
   * 라벨 우측 보조 텍스트 또는 노드(버튼·뱃지 등).
   * string이면 자동으로 옅은 보조 스타일(fg-subtle) 적용.
   */
  rightLabel?: React.ReactNode;
  /** 외부 그리드에서 필드 셀의 배치를 조정할 때 사용하는 추가 className. */
  className?: string;
  /**
   * 필수 표시를 라벨 뒤에 추가한다. 접근성을 위해 실제 입력에도 required를 지정한다.
   * `optional`과 동시 사용 시 `required`가 우선한다.
   */
  required?: boolean;
  /**
   * 선택 필드 — 라벨 뒤에 `(선택)` 표시.
   * `required`와 동시 사용 시 `required` 우선.
   */
  optional?: boolean;
  children: React.ReactNode;
}
