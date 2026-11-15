import { AnimatePresence, useReducedMotion, motion } from "motion/react";
import type { ReactNode } from "react";

import { AnimatedHeight } from "@/components/animated-height";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  /** 지난 단계는 건너뜀, 앞으로 올 단계는 건너뜀 예정으로 표시한다. 현재 단계가 우선한다. */
  skipped?: boolean;
}

export type StepperOrientation = "horizontal" | "vertical";
export type StepperStepStatus =
  | "completed"
  | "current"
  | "pending"
  | "skipped"
  | "skipped-pending";
export type StepperStepContentTransition = "height" | "none";
export type StepperTransition = "none" | "fade" | "scale" | "slide";
export type StepperSlideDirection = "left" | "right" | "up" | "down";

export interface StepperStepContentContext {
  step: StepperStep;
  index: number;
  status: StepperStepStatus;
}

export interface StepperProps {
  steps: readonly StepperStep[];
  currentStep: number;
  orientation?: StepperOrientation;
  allowNonLinear?: boolean;
  onStepChange?: (step: number) => void;
  /** 세로형 단계 콘텐츠. 대기와 건너뜀 예정(skipped-pending)은 숨긴다. */
  renderStepContent?: (context: StepperStepContentContext) => ReactNode;
  /** 세로형 단계 콘텐츠의 펼침·접힘 전환. 기본 height. */
  stepContentTransition?: StepperStepContentTransition;
  className?: string;
  /** 단계 목록의 이름. aria-labelledby가 있으면 그 이름이 우선한다. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export interface StepperContentProps {
  stepKey: string;
  direction?: 1 | -1;
  transition?: StepperTransition;
  slideDirection?: StepperSlideDirection;
  children: ReactNode;
  className?: string;
}

interface MotionCustom {
  direction: 1 | -1;
  transition: StepperTransition;
  slideDirection: StepperSlideDirection;
  reducedMotion: boolean;
}

type MotionPhase = "enter" | "center" | "exit";

export function resolveStepperMotion(
  phase: MotionPhase,
  custom: MotionCustom,
): Record<string, number> {
  if (custom.reducedMotion || custom.transition === "none") {
    return { opacity: 1, x: 0, y: 0, scale: 1 };
  }
  if (phase === "center") return { opacity: 1, x: 0, y: 0, scale: 1 };
  if (custom.transition === "fade") {
    return { opacity: 0, x: 0, y: 0, scale: 1 };
  }
  if (custom.transition === "scale") {
    return {
      opacity: 0,
      x: 0,
      y: 0,
      scale: phase === "enter" ? 0.98 : 1.02,
    };
  }
  const offset = slideOffset(custom.slideDirection);
  const phaseDirection =
    phase === "enter" ? custom.direction : -custom.direction;
  return {
    opacity: 0,
    x: (offset.x ?? 0) * phaseDirection,
    y: (offset.y ?? 0) * phaseDirection,
    scale: 1,
  };
}

const motionVariants = {
  enter: (custom: MotionCustom) => resolveStepperMotion("enter", custom),
  center: (custom: MotionCustom) => resolveStepperMotion("center", custom),
  exit: (custom: MotionCustom) => resolveStepperMotion("exit", custom),
};

/** 단계 표시는 상태와 검증을 소유하지 않는다. 유효한 단계와 이동 검증은 호출부에서 관리하고,
 * 여러 단계를 건너뛰려면 훅과 표시 양쪽에 allowNonLinear를 지정한다.
 * 예정 라벨은 일반 대기와 같은 색이다. 기본 라이트의 bg-bg-subtle에서는 대비가 4.5:1 미만이므로 bg-bg-page 또는 bg-bg-surface 등 대비가 확보된 배경을 사용한다. */
export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  allowNonLinear = false,
  onStepChange,
  renderStepContent,
  stepContentTransition = "height",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: StepperProps) {
  return (
    <ol
      className={cn(
        "flex",
        orientation === "horizontal" ? "w-full items-start" : "flex-col gap-5",
        className,
      )}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "진행 단계")}
      aria-labelledby={ariaLabelledBy}
    >
      {steps.map((step, index) => {
        const status: StepperStepStatus =
          index < currentStep
            ? step.skipped
              ? "skipped"
              : "completed"
            : index === currentStep
              ? "current"
              : step.skipped
                ? "skipped-pending"
                : "pending";
        const canSelect = allowNonLinear && Boolean(onStepChange);
        const content =
          orientation === "vertical"
            ? renderStepContent?.({ step, index, status })
            : null;
        const marker = (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-chip border text-xs font-semibold transition-colors",
              status === "current" &&
                "border-primary bg-primary text-fg-inverse",
              status === "completed" &&
                "border-primary bg-primary-subtle text-primary-fg",
              status === "pending" &&
                "border-border-subtle bg-bg-surface text-fg-subtle",
              status === "skipped" &&
                "border-dashed border-fg-default bg-bg-surface text-fg-default line-through",
              status === "skipped-pending" &&
                "border-dashed border-fg-default bg-bg-surface text-fg-default",
            )}
            aria-hidden="true"
          >
            {index + 1}
          </span>
        );

        return (
          <li
            key={step.id}
            className={cn(
              "relative flex min-w-0",
              orientation === "horizontal"
                ? "flex-1 items-start"
                : "grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3",
            )}
            aria-current={status === "current" ? "step" : undefined}
            data-status={status}
          >
            {canSelect ? (
              <button
                type="button"
                className={cn(
                  "flex min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  orientation === "horizontal"
                    ? "w-full flex-col items-center gap-1.5"
                    : "col-span-2 grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-3",
                  (status === "skipped" || status === "skipped-pending") && "focus-visible:ring-fg-default",
                )}
                onClick={() => onStepChange?.(index)}
                aria-label={`${index + 1}단계: ${step.label}${status === "skipped" ? " (건너뜀)" : status === "skipped-pending" ? " (건너뜀 예정)" : ""}`}
              >
                {marker}
                <StepText
                  step={step}
                  orientation={orientation}
                  status={status}
                />
              </button>
            ) : (
              <div
                className={cn(
                  "flex min-w-0",
                  orientation === "horizontal"
                    ? "w-full flex-col items-center gap-1.5 text-center"
                    : "col-span-2 grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-3",
                )}
              >
                {marker}
                <StepText
                  step={step}
                  orientation={orientation}
                  status={status}
                />
              </div>
            )}
            {orientation === "vertical" && renderStepContent && (
              <div className="col-start-2 min-w-0" data-step-content={step.id}>
                <AnimatedHeight
                  durationMs={stepContentTransition === "height" ? 220 : 0}
                >
                  <div hidden={status === "pending" || status === "skipped-pending"} className="px-3 pt-3">
                    {content}
                  </div>
                </AnimatedHeight>
              </div>
            )}
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "absolute bg-border-subtle",
                  orientation === "horizontal"
                    ? "left-[calc(50%+18px)] right-[calc(-50%+18px)] top-3.5 h-px"
                    : "left-3.5 top-9 h-[calc(100%+4px)] w-px",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepText({
  step,
  orientation,
  status,
}: {
  step: StepperStep;
  orientation: StepperOrientation;
  status: StepperStepStatus;
}) {
  return (
    <span className={cn("min-w-0", orientation === "horizontal" && "px-1")}>
      <span
        className={cn(
          // 가로 모드는 좁은 마커 아래 붙는 캡션이라 12px이 맞지만, 세로
          // 모드는 마커 옆에 놓이는 "행 제목"이라 같은 크기면 너무 작게
          // 읽힌다(사용자 지적) — control 스케일(14px)을 쓴다.
          "block truncate font-medium",
          orientation === "horizontal" ? "text-xs" : "text-sm",
          status === "current" && "text-fg-default",
          status === "completed" && "text-fg-muted",
          (status === "pending" || status === "skipped-pending") && "text-fg-subtle",
          status === "skipped" && "text-fg-default line-through",
        )}
      >
        {step.label}
      </span>
      {status === "skipped" && (
        <span className="block text-xs text-fg-default">건너뜀</span>
      )}
      {status === "skipped-pending" && (
        <span className="block text-xs text-fg-subtle">건너뜀 예정</span>
      )}
      {step.description && (
        <span className="mt-0.5 hidden text-xs text-fg-muted sm:block">
          {step.description}
        </span>
      )}
    </span>
  );
}

function slideOffset(slideDirection: StepperSlideDirection): {
  x?: number;
  y?: number;
} {
  if (slideDirection === "left") return { x: 20 };
  if (slideDirection === "right") return { x: -20 };
  if (slideDirection === "up") return { y: 20 };
  return { y: -20 };
}

/** 단계 콘텐츠를 전환한다. stepKey는 단계마다 고유해야 종료와 진입을 구분한다.
 * 움직임을 원치 않으면 transition="none"을 쓰며 시스템의 동작 줄이기도 따른다. */
export function StepperContent({
  stepKey,
  direction = 1,
  transition = "fade",
  slideDirection = "left",
  children,
  className,
}: StepperContentProps) {
  const reducedMotion = useReducedMotion();
  const custom: MotionCustom = {
    direction,
    transition,
    slideDirection,
    reducedMotion: Boolean(reducedMotion),
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={custom}>
      <StepperMotionContent key={stepKey} className={className} custom={custom}>
        {children}
      </StepperMotionContent>
    </AnimatePresence>
  );
}

function StepperMotionContent({
  custom,
  className,
  children,
}: {
  custom: MotionCustom;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      custom={custom}
      variants={motionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration:
          custom.reducedMotion || custom.transition === "none" ? 0 : 0.18,
      }}
    >
      {children}
    </motion.div>
  );
}
