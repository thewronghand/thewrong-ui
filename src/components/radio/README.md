# Radio

전체 행을 선택할 수 있는 네이티브 radio 항목과 배치용 그룹이다.

```tsx
<fieldset>
  <legend>인증 방식</legend>
  <Radio.Group className="grid gap-2" equalizeLabelWidth>
    {options.map((option) => (
      <Radio.Item
        key={option.value}
        name="method"
        value={option.value}
        checked={value === option.value}
        onChange={() => setValue(option.value)}
        leadingIcon={option.icon}
        contentAlignment="center"
      >
        {option.label}
      </Radio.Item>
    ))}
  </Radio.Group>
</fieldset>
```

## 책임 경계

- 그룹 의미는 소비자의 `fieldset`/`legend`가 맡는다.
- 선택 상태는 소비자가 controlled 또는 native uncontrolled 방식으로 소유한다.
- 같은 선택지에는 동일한 `name`을 전달한다.
- `Radio.Item`이 네이티브 radio 의미, 전체 행 클릭, 방향키 순환 탐색과 disabled 상호작용을 제공한다.
- 카드 셸은 **최소 높이**(`min-h-control-medium`, 한 줄이면 44px)다. 라벨이 길거나 두 줄 구성이면 줄바꿈되고 카드가 늘어난다. 줄바꿈을 막으려면 소비자가 라벨 안에서 말줄임을 쓴다. 긴 문구의 줄바꿈이 필요하면 내용의 스타일을 조정한다.
- `Radio.Group`은 항목 배치와 선택적 라벨 너비 측정만 맡으며 선택 상태를 소유하지 않는다.

`equalizeLabelWidth`는 그룹에서 가장 긴 라벨의 자연 너비를 모든 항목에 공유한다. 아이콘과 텍스트 묶음을 가운데 놓으면서 라벨 시작점도 맞추려면 각 Item에 `contentAlignment="center"`를 함께 사용한다. 동적 라벨 크기는 `ResizeObserver`로 다시 측정한다.
