import { useEffect, useReducer } from "react";

export interface UseStepperOptions {
  stepCount: number;
  initialStep?: number;
  allowNonLinear?: boolean;
}

export interface StepperState {
  currentStep: number;
  direction: 1 | -1;
  canGoNext: boolean;
  canGoPrevious: boolean;
  next: () => void;
  previous: () => void;
  goTo: (step: number) => void;
  reset: () => void;
}

interface InternalState {
  currentStep: number;
  direction: 1 | -1;
}

type Action =
  | { type: "next"; stepCount: number }
  | { type: "previous"; stepCount: number }
  | { type: "clamp"; stepCount: number }
  | { type: "reset"; target: number; stepCount: number }
  | {
      type: "move";
      target: number;
      stepCount: number;
      allowNonLinear: boolean;
    };

function clampStep(step: number, count: number): number {
  return Math.min(Math.max(0, step), Math.max(0, count - 1));
}

export function stepperReducer(
  state: InternalState,
  action: Action,
): InternalState {
  let target = state.currentStep;
  if (action.type === "next") target += 1;
  if (action.type === "previous") target -= 1;
  if (action.type === "move") {
    const requested = clampStep(action.target, action.stepCount);
    if (!action.allowNonLinear && Math.abs(requested - state.currentStep) > 1) {
      return state;
    }
    target = requested;
  }
  if (action.type === "reset") target = action.target;

  const nextStep = clampStep(target, action.stepCount);
  if (nextStep === state.currentStep) return state;
  return {
    currentStep: nextStep,
    direction: nextStep > state.currentStep ? 1 : -1,
  };
}

/** 0부터 시작하는 단계 상태를 관리한다. 검증과 제출은 호출부에서 처리한다.
 * 기본 이동은 한 단계로 제한되며 임의 이동이 필요하면 allowNonLinear를 켠다. */
export function useStepper({
  stepCount,
  initialStep = 0,
  allowNonLinear = false,
}: UseStepperOptions): StepperState {
  const safeInitial = clampStep(initialStep, stepCount);
  const [state, dispatch] = useReducer(stepperReducer, {
    currentStep: safeInitial,
    direction: 1,
  });
  const currentStep = clampStep(state.currentStep, stepCount);
  const direction =
    currentStep === state.currentStep
      ? state.direction
      : currentStep > state.currentStep
        ? 1
        : -1;

  useEffect(() => {
    dispatch({ type: "clamp", stepCount });
  }, [stepCount]);

  return {
    currentStep,
    direction,
    canGoNext: currentStep < stepCount - 1,
    canGoPrevious: currentStep > 0,
    next: () => dispatch({ type: "next", stepCount }),
    previous: () => dispatch({ type: "previous", stepCount }),
    goTo: (step) =>
      dispatch({ type: "move", target: step, stepCount, allowNonLinear }),
    reset: () => dispatch({ type: "reset", target: safeInitial, stepCount }),
  };
}
