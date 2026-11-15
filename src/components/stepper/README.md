# Stepper

단계 상태와 표시를 분리한 공용 UI다. 도메인 검증이나 제출 로직은 소비자가 소유한다.

## 상태

```tsx
const stepper = useStepper({ stepCount: steps.length });

<Stepper steps={steps} currentStep={stepper.currentStep} />
<StepperContent
  stepKey={steps[stepper.currentStep].id}
  direction={stepper.direction}
  transition="slide"
  slideDirection="left"
>
  {content}
</StepperContent>
```

`useStepper`는 0 기반 `currentStep`, 이동 `direction`, 경계 상태와 `next`, `previous`, `goTo`, `reset`을 제공한다. 기본 `goTo`는 현재 단계에서 한 단계만 이동하며, 임의 점프가 필요할 때만 hook과 표시 양쪽에 `allowNonLinear`를 명시한다. `stepCount`가 줄면 현재 단계를 즉시 유효 범위로 보정한다.

`steps`의 항목에 `skipped: true`를 지정하면 지난 단계는 건너뜀, 앞으로 올 단계는 건너뜀 예정으로 표시한다. 현재 단계는 `skipped`보다 우선한다. 건너뛰기 기록과 이동은 호출부가 관리한다.

## 표시와 전환

- `orientation`: `horizontal`(기본) 또는 `vertical`
- `aria-label` 또는 `aria-labelledby`: 단계 목록 이름. 둘 다 없으면 `진행 단계`다. 보이는 제목을 연결할 때는 `aria-labelledby`를 사용한다.
- `StepperContent transition`: `none | fade | scale | slide`
- `slideDirection`: `left | right | up | down`
- `direction`: 진행 `1`, 역행 `-1`; slide 방향에 결합된다.
- `prefers-reduced-motion`에서는 전환 시간이 0이 된다.

가로형은 단계 표시와 교체 콘텐츠를 분리해 `StepperContent`로 감싼다. 세로형은 단계 사이 콘텐츠가 필요할 때 `renderStepContent`를 사용한다.

```tsx
<Stepper
  orientation="vertical"
  steps={steps}
  currentStep={stepper.currentStep}
  renderStepContent={({ step, status }) => (
    <section aria-label={step.label} data-status={status}>
      {contentById[step.id]}
    </section>
  )}
/>
```

세로 콘텐츠는 완료·건너뛴 단계와 현재 단계가 열리고 대기·건너뜀 예정 단계는 숨겨지며 `stepContentTransition="height"`가 기본이다. `renderStepContent`의 예정 건너뜀 상태는 `skipped-pending`이다. 애니메이션이 불필요하면 `none`을 사용한다.
