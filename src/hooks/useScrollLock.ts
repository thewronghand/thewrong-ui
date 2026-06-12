import { useEffect } from "react";

/**
 * 여러 컴포넌트가 동시에 body 스크롤을 잠그더라도 안전하게 동작하도록
 * 참조 카운트로 관리. 마지막 잠금이 풀릴 때만 실제 overflow를 복원한다.
 */
let lockCount = 0;
let originalOverflow = "";

function acquire() {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function release() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    originalOverflow = "";
  }
}

/**
 * `enabled`가 true일 때 body 스크롤을 잠근다. 컴포넌트 언마운트 또는 enabled가
 * false로 바뀌면 자동 해제. 동시 잠금이 여러 개여도 마지막 해제 시점까지 유지된다.
 *
 * @example
 * useScrollLock(isModalOpen);
 */
export function useScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    acquire();
    return release;
  }, [enabled]);
}
