import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

/**
 * Select 컴포넌트의 Variant 타입
 */
export type SelectVariant = "box" | "line" | "big" | "hero";

/**
 * Select 컴포넌트의 사이즈. Button/Input/Textarea와 동일 토큰. box variant에서만 적용.
 * - mini: 모바일/매우 좁은 영역의 다건 입력
 * - small: 다건 입력/표 형식 기본
 * - medium: 폼 단독 입력 기본
 * - large: 메인 페이지의 강조 선택
 */
export type SelectSize = "mini" | "small" | "medium" | "large";

/**
 * Select 컴포넌트의 Label 표시 방식 타입
 */
export type SelectLabelOption = "appear" | "sustain";

/**
 * Select 컴포넌트의 공통 Props
 */
export interface SelectCommonProps {
  /**
   * Select 필드의 모양
   */
  variant: SelectVariant;
  /**
   * Select 필드의 크기
   * @default 'medium'
   */
  selectSize?: SelectSize;
  /**
   * Select 필드의 상단의 라벨
   */
  label?: string;
  /**
   * label 표시 방식
   * 'appear': value가 있을 때만 label이 보여요
   * 'sustain': 항상 label이 보여요
   * @default 'sustain'
   */
  labelOption?: SelectLabelOption;
  /**
   * Select 필드의 하단의 도움말
   */
  help?: ReactNode;
  /**
   * placeholder 텍스트 (첫 번째 옵션의 라벨로 표시)
   */
  placeholder?: string;
  /**
   * Select 필드의 에러 여부
   * @default false
   */
  hasError?: boolean;
  /**
   * Select 필드의 비활성화 여부
   * @default false
   */
  disabled?: boolean;
  /**
   * 트리거 텍스트 뒤에 붙는 단위 텍스트 (예: "원"). chevron 앞쪽 슬롯의 가장 좌측.
   */
  suffix?: string;
  /**
   * 우측 트레일링 아이콘 (lucide-react 등). suffix 다음, clearable 앞.
   */
  trailingIcon?: ReactNode;
  /**
   * 값이 있을 때 우측에 X 버튼(CircleX)을 노출. 클릭 시 onChange로 빈 값을 emit.
   * disabled에서는 노출하지 않는다. trailingIcon 다음, badge 앞.
   * @default false
   */
  clearable?: boolean;
  /**
   * chevron 바로 앞에 표시할 뱃지/라벨 ReactNode.
   */
  badge?: ReactNode;
  /**
   * 검색 기능 활성화 여부
   * @default false
   */
  searchable?: boolean;
  /**
   * 검색 입력 필드 placeholder
   * @default "검색..."
   */
  searchPlaceholder?: string;
  /**
   * 검색어 변경 시 호출되는 콜백 (서버 필터링용)
   * 이 콜백이 제공되면 클라이언트 필터링을 비활성화하고 외부에서 options를 업데이트해야 함
   */
  onSearchChange?: (query: string) => void;
  /**
   * 서버 검색 중 로딩 상태
   * @default false
   */
  isSearchLoading?: boolean;
  /**
   * 컨테이너의 추가 props
   */
  containerProps?: ComponentPropsWithoutRef<"div">;
  /**
   * 컨테이너의 ref
   */
  containerRef?: Ref<HTMLDivElement>;
  /**
   * 테스트 ID (data-testid)
   */
  "data-testid"?: string;
}

/**
 * Select Option 타입
 */
export interface SelectOption {
  value: string | number;
  label: string;
  /**
   * 라벨 아래에 작게 표시되는 보조 설명. 두 줄 옵션이 필요할 때 사용.
   * 트리거(닫힌 상태)에는 노출되지 않고 드롭다운 옵션 리스트에서만 보인다.
   */
  description?: string;
  /**
   * 라벨 우측에 작게 표시되는 보조 정보. 잔고/금액 등 정렬해서 보여주고 싶을 때.
   * 트리거에는 노출되지 않고 드롭다운 옵션 리스트에서만 보인다.
   */
  trailing?: string;
  disabled?: boolean;
}

/**
 * Select 컴포넌트의 Props
 */
export interface SelectProps
  extends Omit<ComponentPropsWithoutRef<"select">, "color">, SelectCommonProps {
  /**
   * Select 옵션 목록
   */
  options?: SelectOption[];
  /**
   * children으로 option을 직접 전달할 수도 있어요
   */
  children?: ReactNode;
}
