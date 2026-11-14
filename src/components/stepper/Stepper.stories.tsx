/* eslint-disable no-restricted-imports -- 이관 지시에 따라 @/ 별칭 대신 상대 경로를 사용한다. */
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Stepper, StepperContent } from "./Stepper";
import { useStepper } from "./use-stepper";

const steps = [
  { id: "details", label: "정보 입력", description: "기본 정보를 입력합니다" },
  { id: "review", label: "내용 확인", description: "입력한 내용을 확인합니다" },
  { id: "done", label: "완료", description: "모든 단계가 완료됩니다" },
];
const meta = {
  title: "Components/Stepper",
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component:
          "상태와 검증은 호출부가 관리합니다. 임의 이동에는 훅과 표시에 allowNonLinear를 함께 지정합니다.",
      },
    },
  },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Horizontal: Story = {
  args: { steps, currentStep: 0 },
  render: () => {
    const state = useStepper({ stepCount: steps.length, allowNonLinear: true });
    return (
      <div className="w-[560px] max-w-full space-y-6">
        <Stepper
          steps={steps}
          currentStep={state.currentStep}
          allowNonLinear
          onStepChange={state.goTo}
        />
        <StepperContent
          stepKey={steps[state.currentStep].id}
          direction={state.direction}
          transition="slide"
        >
          <p className="rounded-surface bg-bg-subtle p-5 text-fg-default">
            {steps[state.currentStep].label} 내용을 진행하세요.
          </p>
        </StepperContent>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={state.previous}
            disabled={!state.canGoPrevious}
          >
            이전
          </Button>
          <Button onClick={state.next} disabled={!state.canGoNext}>
            다음
          </Button>
        </div>
      </div>
    );
  },
};
export const Vertical: Story = {
  args: { steps, currentStep: 1 },
  render: () => (
    <div className="w-80">
      <Stepper
        steps={steps}
        currentStep={1}
        orientation="vertical"
        renderStepContent={({ step, status }) => (
          <p className="text-sm text-fg-muted">
            {step.label}: {status === "completed" ? "완료됨" : "진행 중"}
          </p>
        )}
      />
    </div>
  ),
};
