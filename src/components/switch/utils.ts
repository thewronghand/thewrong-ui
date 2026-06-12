import type { SwitchSize } from "./types";

/**
 * 트랙(외곽) 사이즈 매핑.
 * 노브는 트랙 안에서 padding 2px만큼 들어가 있고, ON 시 (트랙 width − 노브 width − padding × 2)만큼 우측 이동.
 */
export const SWITCH_SIZE_MAP: Record<
  SwitchSize,
  {
    track: string;
    thumb: string;
    translate: string;
  }
> = {
  small: {
    track: "h-5 w-9",
    thumb: "h-3.5 w-3.5",
    translate: "peer-checked:translate-x-4",
  },
  medium: {
    track: "h-6 w-11",
    thumb: "h-4.5 w-4.5",
    translate: "peer-checked:translate-x-5",
  },
};

/** 트랙(외곽 박스) 클래스. peer-checked로 ON/OFF 색 전환. */
export function getSwitchTrackClasses(size: SwitchSize, disabled: boolean) {
  const { track } = SWITCH_SIZE_MAP[size];
  if (disabled) {
    return [
      "relative inline-flex shrink-0 items-center rounded-full",
      track,
      "bg-bg-disabled cursor-not-allowed",
    ].join(" ");
  }
  return [
    "relative inline-flex shrink-0 items-center rounded-full cursor-pointer",
    track,
    "bg-neutral-200 dark:bg-neutral-700",
    "peer-checked:bg-primary-500",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-card",
    "transition-colors duration-200 ease-out",
  ].join(" ");
}

/** 노브(원형) 클래스. translateX로 좌→우 이동. wrapper 기준 absolute로 트랙 위에 뜬다. */
export function getSwitchThumbClasses(size: SwitchSize) {
  const { thumb, translate } = SWITCH_SIZE_MAP[size];
  return [
    "pointer-events-none absolute left-[3px] top-[3px] inline-block rounded-full bg-white shadow-sm",
    thumb,
    translate,
    "transition-transform duration-200 ease-out",
  ].join(" ");
}
