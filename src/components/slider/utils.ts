function decimalPlaces(value: number): number {
  const [coefficient, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent));
}

/** 범위의 시작을 기준으로 step에 맞추고, 부동소수 오차를 제거한다. */
export function normalizeSliderValue(value: number, min: number, max: number, step: number): number {
  if (max <= min) return min;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const rawSteps = (value - min) / safeStep;
  const maxSteps = Math.floor((max - min) / safeStep + 1e-10);
  const steps = Math.min(maxSteps, Math.max(0, Math.round(rawSteps + 1e-10)));
  const places = Math.min(12, Math.max(decimalPlaces(min), decimalPlaces(safeStep)));
  return Number((min + steps * safeStep).toFixed(places));
}

export function sliderPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
