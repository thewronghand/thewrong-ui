/** 저장·보고·새로고침을 소비자가 제공하는 청크 복구 포트. */
export interface ChunkReloadPort {
  get(): number | null;
  set(reloadedAt: number): void;
  remove(): void;
  report(error: Error, trigger: "navigation" | "preload"): void;
  /** 새로고침 전 필요한 대기를 마친 뒤 reload한다. */
  reload(): Promise<void>;
}

export const CHUNK_RELOAD_TTL_MS = 30_000;

let inMemoryReloadedAt: number | null = null;

function getStringProperty(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}

/** 브라우저와 번들러마다 다른 dynamic import 실패 형태를 판별한다. */
export function isChunkLoadError(error: unknown): boolean {
  const name = getStringProperty(error, "name");
  if (name === "ChunkLoadError") {
    return true;
  }

  const message = getStringProperty(error, "message");
  if (!message) {
    return false;
  }

  return (
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Unable to preload CSS for/i.test(message)
  );
}

function isWithinTtl(
  reloadedAt: number | null,
  now: number,
  ttlMs: number,
): boolean {
  if (reloadedAt === null || !Number.isFinite(reloadedAt)) {
    return false;
  }

  return now - reloadedAt < ttlMs;
}

interface ReloadOnceOptions {
  now?: () => number;
  ttlMs?: number;
}

/**
 * TTL 가드를 판정하고 통과하면 가드 상태를 영속한다. 이 함수는 보고나 reload를
 * 실행하지 않는다. `reloadOnceForChunkError`는 가드 통과 뒤 reload까지 잇는 래퍼다.
 */
export function tryAcquireChunkReloadGuard(
  port: ChunkReloadPort,
  options: ReloadOnceOptions = {},
): boolean {
  const now = (options.now ?? Date.now)();
  const ttlMs = options.ttlMs ?? CHUNK_RELOAD_TTL_MS;

  let persistedReloadedAt: number | null;
  try {
    persistedReloadedAt = port.get();
  } catch {
    return false;
  }

  if (
    isWithinTtl(persistedReloadedAt, now, ttlMs) ||
    isWithinTtl(inMemoryReloadedAt, now, ttlMs)
  ) {
    return false;
  }

  try {
    port.set(now);
    if (port.get() !== now) {
      return false;
    }
  } catch {
    return false;
  }

  inMemoryReloadedAt = now;
  return true;
}

/**
 * 청크 실패를 한 번만 자동 새로고침한다.
 *
 * hard reload 뒤에도 가드가 남는다는 것을 쓰기 후 재조회로 확인한 경우에만
 * reload한다. 스토리지가 차단되거나 가득 찬 환경에서는 자동 복구를 포기하고
 * 앱 fallback에 머문다. 메모리 가드는 영속에 성공한 같은 페이지 생명주기의
 * 중복 호출만 보조한다. TTL 뒤에는 다음 배포의 복구를 허용한다.
 *
 * `port.reload()`를 즉시 호출한다. 가드 통과 여부만 알고 reload는 직접 제어하려는
 * 호출자는 `tryAcquireChunkReloadGuard`를 쓴다.
 */
export function reloadOnceForChunkError(
  port: ChunkReloadPort,
  options: ReloadOnceOptions = {},
): boolean {
  const acquired = tryAcquireChunkReloadGuard(port, options);
  if (acquired) {
    void port.reload();
  }
  return acquired;
}

/** 사용자가 명시적으로 reload를 선택했을 때 다음 복구 사이클을 연다. */
export function clearChunkReloadGuard(port: ChunkReloadPort): void {
  inMemoryReloadedAt = null;
  try {
    port.remove();
  } catch {
    // 스토리지 접근 불가 환경에서는 메모리 가드만 비운다.
  }
}

export function reloadAfterClearingChunkGuard(port: ChunkReloadPort): void {
  clearChunkReloadGuard(port);
  void port.reload();
}

/**
 * Vite의 `vite:preloadError` payload를 보고한 뒤, 허용된 경우 1회 reload한다.
 * 기본 보고는 동기이며, import catch의 식별이 필요하면 기존 다음 task에서 보고한다.
 * `preventDefault()`를 호출하지 않아 Vite가 원래 실패를 다시 throw하게 둔다.
 *
 * 동적 import 실패에서 `preventDefault()`로 Vite의 throw를 막으면 import promise가
 * `undefined`로 완료된다. TanStack `lazyRouteComponent`가 그 값을 `res[exportName]`에서
 * 읽다가 원래 오류 대신 TypeError를 만들기 때문에, 원래 오류가 그대로 전파되도록 둔다.
 *
 * TanStack `lazyRouteComponent`는 세션의 `tanstack_router_reload:<message>` 표식이 없는
 * 첫 인식 실패를 컴포넌트 렌더 중 reload한다. 이때 pending promise를 던져 route boundary를
 * 건너뛸 수 있다. 실패한 import를 캐시해 후속 클릭에서 다시 import하거나 Vite 이벤트를
 * 내지 않고, 캐시된 실패를 렌더에서 처리한다: 표식이 없으면 TanStack이 자체 reload하고,
 * 표식이 있으면 같은 Error를 던진다. 앱의 `reportError`는 같은 Error 객체를 중복 제거한다.
 *
 * Vite 이벤트는 TanStack의 동작보다 먼저 발생한다. `shouldReload`는 이벤트 시점에
 * 한 번 평가해 네비게이션 상태와 보고용 trigger를 보존한다. 결과가 false인 intent
 * preload 실패도 보고하되 TTL 가드를 소모하거나 자체 reload를 예약하지 않는다.
 * 다음 task에서 평가하는 `shouldIgnoreAfterImport`와 평가 시점이 다르다.
 *
 * 이동 보존: 네비게이션 발 이벤트 시점에는 주소창이 이미 목표 URL이다.
 * 같은 URL을 reload하면 목표 화면에 착지하므로 별도 경로 저장은 필요 없다.
 * 실측: Vite 8.1.3 + @tanstack/react-router 1.170.17의 코드 분할 라우트 이동.
 *
 * 무한 루프 가드: TTL 30초(`CHUNK_RELOAD_TTL_MS`) 안에서는 reload를 다시 예약하지 않는다.
 * 가드에 걸리면 원래 오류가 전파되고, 경계가 수동 새로고침 화면을 보여준다.
 *
 * @param port 앱이 조립한 스토리지·보고·reload 경계. 다른 청크 복구 층과 같은 포트를 써야
 *   TTL 가드가 공유된다.
 * @param target 리스너를 붙일 대상. 기본값은 `window`이며 테스트에서 교체한다.
 * @param shouldReload 네비게이션 발 이벤트에 reload를 허용할지 판별한다. 원본 이벤트도
 *   전달하므로 선택 기능 청크를 구분해 제외할 수 있다. 기본값은 true.
 * @param shouldIgnoreAfterImport 선택 기능 import의 catch가 오류 객체를 식별할 시간을
 *   주도록 다음 task에서 평가하는 reload 제외 조건. 보고는 이 판정과 무관하게 먼저 한다.
 *   제외된 오류는 TTL 가드를 소모하지 않는다.
 * @param shouldReport 보고 허용 조건. 함수를 반환하면 import catch 뒤 기존 다음 task에서
 *   평가한다. 이 경우에도 이벤트 시점 trigger를 쓰고 reload 전에 보고한다.
 * @returns 리스너를 해제하는 함수.
 */
export function listenForChunkPreloadError(
  port: ChunkReloadPort,
  target: Pick<Window, "addEventListener" | "removeEventListener"> = window,
  shouldReload: (event: Event) => boolean = () => true,
  shouldIgnoreAfterImport?: (event: Event) => boolean,
  shouldReport?: (event: Event) => boolean | (() => boolean),
): () => void {
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const handlePreloadError = (event: Event) => {
    const payload = (event as Event & { payload?: unknown }).payload;
    const error =
      payload instanceof Error
        ? payload
        : new Error(
            typeof payload === "string"
              ? payload
              : (getStringProperty(payload, "message") ??
                  "Vite preload failed"),
          );
    const reloadAllowed = shouldReload(event);

    let reportDecision: boolean | (() => boolean) = true;
    try {
      reportDecision = shouldReport?.(event) ?? true;
    } catch {
      // 보고 조건의 예외도 원래 Vite 오류의 전파와 reload 흐름을 막지 않는다.
    }
    const report = () => {
      // 보고가 실패해도 복구 동작은 계속되도록 보고 예외를 격리한다.
      try {
        if (
          typeof reportDecision === "function"
            ? reportDecision()
            : reportDecision
        )
          port.report(error, reloadAllowed ? "navigation" : "preload");
      } catch {
        // 원래 Vite 오류의 전파와 reload 흐름을 유지한다.
      }
    };
    const deferReport = typeof reportDecision === "function";
    if (!deferReport) report();

    // intent preload 실패도 보고하되 공유 TTL 가드는 소모하지 않는다.
    if (!reloadAllowed && !deferReport) return;

    // 이벤트를 막지 않아 Vite가 원래 오류를 importer로 throw하게 둔다.
    const reload = () => {
      if (tryAcquireChunkReloadGuard(port)) {
        void port.reload();
      }
    };
    if (shouldIgnoreAfterImport || deferReport) {
      // Vite는 payload를 dispatch한 뒤 같은 오류를 rethrow한다. microtask만
      // 미루면 import의 후속 catch보다 먼저 실행될 수 있어 다음 task가 필요하다.
      const timeout = setTimeout(() => {
        pending.delete(timeout);
        if (deferReport) report();
        if (reloadAllowed && !shouldIgnoreAfterImport?.(event)) reload();
      }, 0);
      pending.add(timeout);
    } else {
      reload();
    }
  };

  target.addEventListener("vite:preloadError", handlePreloadError);
  return () => {
    target.removeEventListener("vite:preloadError", handlePreloadError);
    for (const timeout of pending) clearTimeout(timeout);
    pending.clear();
  };
}
