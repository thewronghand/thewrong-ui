/** 비활성 항목을 건너뛰며 가로 탭의 다음 포커스 인덱스를 찾는다. */
export function nextTabIndex(
  disabled: readonly boolean[],
  current: number,
  key: string,
): number | null {
  const count = disabled.length;
  if (!count || disabled.every(Boolean)) return null;
  if (key === "Home") return disabled.findIndex((item) => !item);
  if (key === "End") {
    for (let index = count - 1; index >= 0; index--) {
      if (!disabled[index]) return index;
    }
  }
  const delta = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0;
  if (!delta) return null;
  for (let offset = 1; offset <= count; offset++) {
    const index = (current + delta * offset + count * offset) % count;
    if (!disabled[index]) return index;
  }
  return null;
}
