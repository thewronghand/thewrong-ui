import { motion, useReducedMotion } from "motion/react";

import type { TypingDotsProps } from "./types";

// 점 3개가 차례로 부풀었다 가라앉는다.
const DOT_COUNT = 3;
// 한 점의 한 주기. messenger류의 관례적인 속도대(1초 남짓)에 맞춘다.
const CYCLE_DURATION_S = 1.2;
// 옆 점이 얼마나 늦게 시작하는지 — 주기를 점 수로 나누면 파도가 끊기지 않고
// 순환한다(마지막 점이 끝날 때 첫 점이 다시 시작).
const STAGGER_S = CYCLE_DURATION_S / DOT_COUNT;

/**
 * 값이 아직 없는 자리에 놓는 점 3개 인디케이터입니다. 채팅의 "입력 중"과
 * 값 로딩("잔고를 불러오는 중")에 모두 씁니다.
 *
 * **색과 크기를 스스로 정하지 않습니다.** 점은 `currentColor`를 쓰고 지름은
 * `em`이라 놓인 자리의 글자색·글자크기를 그대로 따릅니다.
 * 색을 바꾸려면 부모의 text 색을 바꿉니다.
 */
export function TypingDots({ label }: TypingDotsProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <span
      role="status"
      aria-label={label}
      // baseline 정렬 — 텍스트 자리를 대신 채우므로 옆 글자와 밑선을 맞춘다.
      className="inline-flex items-center gap-[0.2em] align-baseline"
    >
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        // reduced motion에서는 정지한 점 3개를 그대로 남긴다 — 요소를 지우면
        // "무언가 진행 중"이라는 시각 신호까지 함께 사라져 빈 자리가 된다.
        <motion.span
          key={index}
          aria-hidden="true"
          className="inline-block size-[0.35em] rounded-full bg-current"
          // 정지 상태에서도 완전 불투명이 아니라 옅게 둔다 — 확정된 값이
          // 아니라 대기 중이라는 뜻을 색 대비로도 남긴다.
          style={{ opacity: prefersReducedMotion ? 0.4 : undefined }}
          animate={
            prefersReducedMotion
              ? undefined
              : { opacity: [0.3, 1, 0.3], y: ["0em", "-0.22em", "0em"] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: CYCLE_DURATION_S,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: index * STAGGER_S,
                }
          }
        />
      ))}
    </span>
  );
}
