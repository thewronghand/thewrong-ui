/**
 * 폼 컴포넌트(Input/Select/Textarea) 우측 슬롯의 size 토큰.
 *
 * Button/Input/Select/Textarea의 size 토큰 정렬을 단일 출처로 관리한다.
 */

export type FormFieldSize = "mini" | "small" | "medium" | "large";

/** 필드 텍스트의 크기와 줄 높이. */
export const CONTROL_TEXT_CLASS: Record<FormFieldSize, string> = {
  mini: "text-control-mini",
  small: "text-control-small",
  medium: "text-control-medium",
  large: "text-control-large",
};

/** 빌트인 clearable의 X 아이콘과 호출부 trailingIcon의 svg에 적용할 height/width 클래스. */
export const SLOT_ICON_SIZE_CLASS: Record<FormFieldSize, string> = {
  mini: "h-slot-icon-mini w-slot-icon-mini",
  small: "h-slot-icon-small w-slot-icon-small",
  medium: "h-slot-icon-medium w-slot-icon-medium",
  large: "h-slot-icon-large w-slot-icon-large",
};

/** Select의 chevron 전용 사이즈 — 일반 슬롯 아이콘과 동일 비율. */
export const CHEVRON_SIZE_CLASS: Record<FormFieldSize, string> = {
  mini: "h-slot-icon-mini w-slot-icon-mini",
  small: "h-slot-icon-small w-slot-icon-small",
  medium: "h-slot-icon-medium w-slot-icon-medium",
  large: "h-slot-icon-large w-slot-icon-large",
};

/** trailingIcon/badge wrapper에 깔아 안의 svg가 자동으로 따라가게 하는 arbitrary selector. */
export const SLOT_CHILD_ICON_CLASS: Record<FormFieldSize, string> = {
  mini: "[&>svg]:h-slot-icon-mini [&>svg]:w-slot-icon-mini",
  small: "[&>svg]:h-slot-icon-small [&>svg]:w-slot-icon-small",
  medium: "[&>svg]:h-slot-icon-medium [&>svg]:w-slot-icon-medium",
  large: "[&>svg]:h-slot-icon-large [&>svg]:w-slot-icon-large",
};

/** badge wrapper의 텍스트 크기와 줄 높이. */
export const SLOT_BADGE_TEXT_CLASS: Record<FormFieldSize, string> = {
  mini: "text-slot-badge-mini",
  small: "text-slot-badge-small",
  medium: "text-slot-badge-medium",
  large: "text-slot-badge-large",
};

/** 슬롯 간 gap — 디자인 시안 medium 기준 12px. */
export const SLOT_GAP_CLASS: Record<FormFieldSize, string> = {
  mini: "gap-slot-mini",
  small: "gap-slot-small",
  medium: "gap-slot-medium",
  large: "gap-slot-large",
};
