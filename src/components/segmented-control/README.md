# SegmentedControl

알약형 컨테이너 하나 안에 칸으로 나뉜 세그먼트 컨트롤이다.

```tsx
<SegmentedControl
  aria-label="조회 기간"
  value={range}
  onChange={setRange}
  options={[
    { value: "7d", label: "7일" },
    { value: "30d", label: "30일" },
  ]}
/>
```

2~3택 짧은 선택지가 설정 화면처럼 여러 줄 쌓일 때 쓰는 컴포넌트다. 원형
indicator 없이 흰 바탕+테두리 컨테이너 안에서 칸이 폭을 균등 분배(2택=50%,
3택=33%)하며, 글자는 강조색 없이 기본색·세미볼드로만 구분한다.

## 책임 경계

- 내부에 `role="radiogroup"`과 각 옵션마다 sr-only `<input type="radio">`를
  렌더해 네이티브 radio semantics(방향키 roving focus, Space 선택,
  스크린리더 announcement)를 그대로 제공한다.
- 선택 상태는 `value`/`onChange`로 controlled 소유한다.
- `name`을 지정하지 않으면 `useId()`로 생성한 고유 값을 각 input의 `name`에
  부여한다 — 같은 페이지에 여러 SegmentedControl을 둬도 충돌하지 않는다.
- 그룹 접근성 라벨은 `aria-label` 또는 `aria-labelledby`로 전달한다.

## 인디케이터

선택 표시는 각 칸의 배경이 아니라 컨테이너 안에서 **미끄러지는 인디케이터
하나**(`bg-bg-subtle`)가 담당한다. 선택된 옵션의 label 실측 위치·폭
(`offsetLeft`/`offsetWidth`)을 `useLayoutEffect`로 측정해 인디케이터의
`transform`/`width`를 갱신한다. 칸 폭이 리사이즈되면 `ResizeObserver`로
다시 측정한다. 마운트 직후 첫 측정 전에는 인디케이터가 자리를 잡기 전 날아
오는 모습이 보이지 않도록 transition을 끈다.

## 제네릭

`value`/`onChange`/`options`는 문자열 리터럴 유니온 `V`로 타입을 보존한다.

```tsx
type Period = "month" | "year";
<SegmentedControl<Period> value={period} onChange={setPeriod} options={...} />
```
