const SELECT_PANEL_MAX_WIDTH = 420;

/** 트리거 폭을 하한으로 유지하면서 화면과 최대 패널 폭에 맞춘다. */
export function computeSelectPanelMaxWidth(
  referenceWidth: number,
  availableWidth: number,
): number {
  return Math.max(
    referenceWidth,
    Math.min(availableWidth, SELECT_PANEL_MAX_WIDTH),
  );
}
