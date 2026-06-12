/**
 * 폼 컴포넌트(Input/Select/Textarea) 우측 슬롯의 size 토큰.
 *
 * Button/Input/Select/Textarea의 size 토큰 정렬을 단일 출처로 관리한다.
 */

export type FormFieldSize = "mini" | "small" | "medium" | "large";

/** 빌트인 clearable의 X 아이콘과 호출부 trailingIcon의 svg에 적용할 height/width 클래스. */
export const SLOT_ICON_SIZE_CLASS: Record<FormFieldSize, string> = {
  mini: "h-3.5 w-3.5",
  small: "h-4 w-4",
  medium: "h-4.5 w-4.5",
  large: "h-5 w-5",
};

/** Select의 chevron 전용 사이즈 — 일반 슬롯 아이콘과 동일 비율. */
export const CHEVRON_SIZE_CLASS: Record<FormFieldSize, string> = {
  mini: "h-3.5 w-3.5",
  small: "h-4 w-4",
  medium: "h-4.5 w-4.5",
  large: "h-5 w-5",
};

/** trailingIcon/badge wrapper에 깔아 안의 svg가 자동으로 따라가게 하는 arbitrary selector. */
export const SLOT_CHILD_ICON_CLASS: Record<FormFieldSize, string> = {
  mini: "[&>svg]:h-3.5 [&>svg]:w-3.5",
  small: "[&>svg]:h-4 [&>svg]:w-4",
  medium: "[&>svg]:h-4.5 [&>svg]:w-4.5",
  large: "[&>svg]:h-5 [&>svg]:w-5",
};

/** badge wrapper에 적용할 텍스트 사이즈 — 호출부가 inline className으로 명시 시 override. */
export const SLOT_BADGE_TEXT_CLASS: Record<FormFieldSize, string> = {
  mini: "text-[10px]",
  small: "text-xs",
  medium: "text-xs",
  large: "text-sm",
};

/** 슬롯 간 gap — 디자인 시안 medium 기준 12px. */
export const SLOT_GAP_CLASS: Record<FormFieldSize, string> = {
  mini: "gap-1.5",
  small: "gap-2",
  medium: "gap-3",
  large: "gap-3.5",
};
