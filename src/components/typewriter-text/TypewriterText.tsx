import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { TypewriterTextProps } from "./types";

const CHARACTER_INTERVAL_MS = 32;
/** 단어 단위는 한 틱에 드러나는 양이 훨씬 많으므로 간격을 늘린다. 글자 간격을
 * 그대로 쓰면 문장이 순식간에 끝나 "스트리밍 중"이라는 감각 자체가 사라진다. */
const WORD_INTERVAL_MS = 90;

/**
 * 공백 단위 경계의 끝 인덱스 목록. 각 값은 "여기까지 드러낸다"는 slice 길이다.
 *
 * 공백을 단어에 **붙여서** 끊는다(`/(\s+)/`로 잘라 앞 조각에 합침) — 공백을
 * 별도 스텝으로 두면 단어가 나온 뒤 공백만 추가되는 빈 틱이 생겨 리듬이
 * 끊긴다. 줄바꿈도 공백이라 이 규칙에 자연스럽게 포함된다(봇 스크립트가
 * `\n`으로 문단을 나눈다).
 */
function buildWordBoundaries(text: string): number[] {
  const boundaries: number[] = [];
  const pattern = /\S+\s*/g;
  let match = pattern.exec(text);
  while (match !== null) {
    boundaries.push(match.index + match[0].length);
    match = pattern.exec(text);
  }
  // 공백으로만 이뤄졌거나 빈 문자열이면 경계가 없다 — 전체를 한 번에 드러낸다.
  if (boundaries.length === 0 && text.length > 0) boundaries.push(text.length);
  return boundaries;
}

/**
 * 값이 로드된 직후에만 짧게 사용하는 텍스트 표시 효과입니다.
 * 보조기기에는 전체 문자열을 즉시 제공하고, 모션 감소 환경 또는 `animate={false}`에서는
 * 애니메이션 없이 표시합니다.
 */
export function TypewriterText({
  text,
  delay = 0,
  animate = true,
  onComplete,
  unit = "character",
}: TypewriterTextProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const shouldAnimate = animate && !prefersReducedMotion;
  const [visibleLength, setVisibleLength] = useState(() =>
    shouldAnimate ? 0 : text.length,
  );

  // 콜백이 바뀌어도 타이핑이 재시작되지 않도록 최신 콜백만 ref에 보관한다.
  const onCompleteRef = useRef(onComplete);
  const immediateCompletionRef = useRef<string | null>(null);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!shouldAnimate || text.length === 0) {
      setVisibleLength(text.length);
      // StrictMode에서 effect가 재실행되어도 같은 즉시 표시를 중복 알리지 않는다.
      if (immediateCompletionRef.current !== text) {
        immediateCompletionRef.current = text;
        onCompleteRef.current?.();
      }
      return;
    }

    immediateCompletionRef.current = null;
    setVisibleLength(0);
    let intervalId: number | undefined;
    // 드러낼 지점을 미리 계산해 둔다. 글자 단위는 1,2,3…이고 단어 단위는 공백
    // 경계다 — 두 모드의 차이를 이 배열 하나로 흡수해 아래 타이머 로직은
    // "다음 지점으로 간다"만 하게 남긴다.
    const stops =
      unit === "word"
        ? buildWordBoundaries(text)
        : Array.from({ length: text.length }, (_, index) => index + 1);
    const intervalMs =
      unit === "word" ? WORD_INTERVAL_MS : CHARACTER_INTERVAL_MS;

    // 진행 위치를 effect 스코프에서 따로 센다 — 완료 판정과 onComplete 호출을
    // setState updater 밖에서 해야 하기 때문이다. updater는 순수해야 하는데
    // onComplete는 외부 상태를 바꿀 수 있고, StrictMode가
    // updater를 두 번 호출하면 "Cannot update a component while rendering a
    // different component" 경고와 중복 호출이 발생한다.
    let stopIndex = 0;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        const nextLength = stops[stopIndex] ?? text.length;
        stopIndex += 1;
        setVisibleLength(nextLength);
        if (stopIndex >= stops.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          onCompleteRef.current?.();
        }
      }, intervalMs);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [delay, shouldAnimate, text, unit]);

  const isTyping = shouldAnimate && visibleLength < text.length;

  return (
    <span aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleLength)}</span>
      {isTyping ? (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
        >
          |
        </motion.span>
      ) : null}
    </span>
  );
}
