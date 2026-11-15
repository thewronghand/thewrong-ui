/** 숫자만 남겨 슬롯 수에 맞춘다. */
export function normalizeCode(value: string, length: number): string {
  return value.replace(/\D/g, "").slice(0, length);
}

/** 선택 영역을 붙여넣은 숫자로 바꾼 뒤 슬롯 수에 맞춘다. */
export function pasteCode(
  value: string,
  pasted: string,
  start: number,
  end: number,
  length: number,
): string {
  return normalizeCode(
    value.slice(0, start) + pasted.replace(/\D/g, "") + value.slice(end),
    length,
  );
}
