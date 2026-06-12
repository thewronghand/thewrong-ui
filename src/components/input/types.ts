import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

/**
 * Input 컴포넌트의 Variant 타입
 */
export type InputVariant = "box" | "line" | "big" | "hero";

/**
 * Input 컴포넌트의 사이즈. Button/Select/Textarea와 동일 토큰. box variant에서만 적용.
 * - mini: 다건 입력/표 형식 컴팩트 모드(특히 모바일)
 * - small: 다건 입력/표 형식 기본
 * - medium: 폼 단독 입력 기본
 * - large: 메인 페이지의 강조 입력
 */
export type InputSize = "mini" | "small" | "medium" | "large";

/**
 * Input 컴포넌트의 Label 표시 방식 타입
 */
export type InputLabelOption = "appear" | "sustain";

/**
 * Input 컴포넌트의 Value 타입
 */
export type InputValue = string | number;

/**
 * Format 함수 타입
 */
export type FormatTransform = (value: InputValue) => InputValue;
export type FormatReset = (formattedValue: InputValue) => InputValue;

/**
 * Format 옵션
 */
export interface InputFormat {
  /**
   * 입력값을 포맷팅된 값으로 변환해요.
   * 예: "1000000" → "1,000,000"
   */
  transform: FormatTransform;
  /**
   * 포맷팅된 값을 원본 값으로 복원해요.
   * 예: "1,000,000" → "1000000"
   */
  reset?: FormatReset;
}

/**
 * Input 컴포넌트의 공통 Props
 */
export interface InputCommonProps {
  /**
   * 텍스트 필드의 모양
   */
  variant: InputVariant;
  /**
   * 사이즈 — box variant에서만 동작.
   * @default 'medium'
   */
  inputSize?: InputSize;
  /**
   * 텍스트 필드의 상단의 라벨
   */
  label?: string;
  /**
   * label 표시 방식
   * 'appear': value가 있을 때만 label이 보여요
   * 'sustain': 항상 label이 보여요
   * @default 'appear'
   */
  labelOption?: InputLabelOption;
  /**
   * 텍스트 필드의 하단의 도움말
   */
  help?: ReactNode;
  /**
   * 텍스트 필드의 에러 여부
   * @default false
   */
  hasError?: boolean;
  /**
   * 텍스트 필드의 비활성화 여부
   * @default false
   */
  disabled?: boolean;
  /**
   * 입력 필드 앞에 표시될 텍스트
   */
  prefix?: string;
  /**
   * 입력 필드 뒤에 표시될 텍스트 (예: "원", "%"). 우측 슬롯의 가장 좌측.
   */
  suffix?: string;
  /**
   * 우측 트레일링 아이콘 (lucide-react 등). suffix 다음, clearable 앞에 위치.
   */
  trailingIcon?: ReactNode;
  /**
   * 값이 있을 때 우측에 X 버튼(CircleX)을 노출. 클릭 시 onChange로 빈 값을 emit.
   * disabled에서는 노출하지 않는다. trailingIcon 다음, badge 앞에 위치.
   * @default false
   */
  clearable?: boolean;
  /**
   * 우측 가장 끝에 표시할 뱃지/라벨 ReactNode. 단위 표시나 상태 라벨용.
   */
  badge?: ReactNode;
  /**
   * placeholder 텍스트
   */
  placeholder?: string;
  /**
   * 금액, 휴대폰번호 등 특정 형식으로 변환해요
   */
  format?: InputFormat;
  /**
   * 컨테이너의 추가 props
   */
  containerProps?: ComponentPropsWithoutRef<"div">;
  /**
   * 컨테이너의 ref
   */
  containerRef?: Ref<HTMLDivElement>;
}

/**
 * Input 컴포넌트의 Props
 */
export interface InputProps
  extends Omit<
      ComponentPropsWithoutRef<"input">,
      "color" | "value" | "defaultValue"
    >,
    InputCommonProps {
  /**
   * 입력값
   */
  value?: InputValue;
  /**
   * 기본값
   */
  defaultValue?: InputValue;
}
