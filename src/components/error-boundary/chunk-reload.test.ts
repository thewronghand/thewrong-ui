import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHUNK_RELOAD_TTL_MS,
  clearChunkReloadGuard,
  isChunkLoadError,
  listenForChunkPreloadError,
  reloadOnceForChunkError,
} from "./chunk-reload";
import type { ChunkReloadPort } from "./chunk-reload";

function createPort() {
  let reloadedAt: number | null = null;
  const reload = vi.fn(() => Promise.resolve());
  const report = vi.fn<ChunkReloadPort["report"]>();
  const port: ChunkReloadPort = {
    get: () => reloadedAt,
    set: (nextReloadedAt) => {
      reloadedAt = nextReloadedAt;
    },
    remove: () => {
      reloadedAt = null;
    },
    report,
    reload,
  };

  return { port, reload, report, getReloadedAt: () => reloadedAt };
}

let currentPort: ChunkReloadPort;

beforeEach(() => {
  currentPort = createPort().port;
  clearChunkReloadGuard(currentPort);
});

afterEach(() => {
  clearChunkReloadGuard(currentPort);
});

describe("isChunkLoadError", () => {
  it.each([
    Object.assign(new Error("ignored"), { name: "ChunkLoadError" }),
    new Error("Loading chunk dashboard-42 failed"),
    new TypeError("Failed to fetch dynamically imported module: /assets/a.js"),
    new TypeError("error loading dynamically imported module"),
    new TypeError("Importing a module script failed"),
    new Error("Unable to preload CSS for /assets/a.css"),
  ])("브라우저별 청크 오류를 판별한다", (error) => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("일반 렌더 오류와 원시값은 제외한다", () => {
    expect(isChunkLoadError(new Error("render failed"))).toBe(false);
    expect(isChunkLoadError("Loading chunk 1 failed")).toBe(false);
  });
});

describe("reloadOnceForChunkError", () => {
  it("TTL 안의 중복 호출은 한 번만 reload한다", () => {
    const { port, reload, getReloadedAt } = createPort();
    currentPort = port;

    expect(reloadOnceForChunkError(port, { now: () => 1_000 })).toBe(true);
    expect(reloadOnceForChunkError(port, { now: () => 1_001 })).toBe(false);
    expect(getReloadedAt()).toBe(1_000);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("영속 가드는 새 문서의 모듈 생명주기에서도 TTL 내 reload를 한 번으로 제한한다", async () => {
    const { port, reload } = createPort();
    currentPort = port;

    vi.resetModules();
    const firstDocument = await import("./chunk-reload");
    expect(
      firstDocument.reloadOnceForChunkError(port, { now: () => 2_000 }),
    ).toBe(true);

    vi.resetModules();
    const secondDocument = await import("./chunk-reload");
    expect(
      secondDocument.reloadOnceForChunkError(port, { now: () => 2_001 }),
    ).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("TTL이 지나면 다음 배포의 복구를 다시 허용한다", () => {
    const { port, reload } = createPort();
    currentPort = port;

    expect(reloadOnceForChunkError(port, { now: () => 5_000 })).toBe(true);
    expect(
      reloadOnceForChunkError(port, {
        now: () => 5_000 + CHUNK_RELOAD_TTL_MS - 1,
      }),
    ).toBe(false);
    expect(
      reloadOnceForChunkError(port, {
        now: () => 5_000 + CHUNK_RELOAD_TTL_MS,
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("새 문서마다 스토리지 접근이 실패해도 자동 reload하지 않는다", async () => {
    const reload = vi.fn(() => Promise.resolve());
    const blockedPort: ChunkReloadPort = {
      get: () => {
        throw new Error("storage blocked");
      },
      set: () => {
        throw new Error("storage blocked");
      },
      remove: () => {
        throw new Error("storage blocked");
      },
      report: vi.fn(),
      reload,
    };
    currentPort = blockedPort;
    clearChunkReloadGuard(blockedPort);

    vi.resetModules();
    const firstDocument = await import("./chunk-reload");
    expect(
      firstDocument.reloadOnceForChunkError(blockedPort, {
        now: () => 10_000,
      }),
    ).toBe(false);

    vi.resetModules();
    const secondDocument = await import("./chunk-reload");
    expect(
      secondDocument.reloadOnceForChunkError(blockedPort, {
        now: () => 10_001,
      }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("스토리지 쓰기가 실패하면 자동 reload하지 않는다", () => {
    const reload = vi.fn(() => Promise.resolve());
    const writeBlockedPort: ChunkReloadPort = {
      get: () => null,
      set: () => {
        throw new Error("storage full");
      },
      remove: () => {},
      report: vi.fn(),
      reload,
    };
    currentPort = writeBlockedPort;
    clearChunkReloadGuard(writeBlockedPort);

    expect(
      reloadOnceForChunkError(writeBlockedPort, { now: () => 15_000 }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("쓰기 값이 재조회되지 않으면 자동 reload하지 않는다", () => {
    const reload = vi.fn(() => Promise.resolve());
    const nonPersistentPort: ChunkReloadPort = {
      get: () => null,
      set: () => {},
      remove: () => {},
      report: vi.fn(),
      reload,
    };
    currentPort = nonPersistentPort;
    clearChunkReloadGuard(nonPersistentPort);

    expect(
      reloadOnceForChunkError(nonPersistentPort, { now: () => 20_000 }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("listenForChunkPreloadError", () => {
  /**
   * 실제 Vite가 dispatch하는 이벤트를 재현한다. `cancelable: true`는 실제 vite 배선과
   * 형태를 맞추기 위함이지만, 이 리스너는 더 이상 `preventDefault()`를 호출하지
   * 않는다(2026-08-14) — 아래 테스트들이 `event.defaultPrevented`가 항상 `false`로
   * 남는 것을 실증한다.
   */
  const dispatchPreloadError = (
    target: EventTarget,
    payload?: unknown,
  ): Event => {
    const event = new Event("vite:preloadError", { cancelable: true });
    if (payload !== undefined) {
      (event as Event & { payload?: unknown }).payload = payload;
    }
    target.dispatchEvent(event);
    return event;
  };

  it("청크 preload 실패에 백그라운드 reload를 예약하고 Vite의 기본 throw는 막지 않는다", () => {
    const { port, reload, report } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;
    const originalError = new TypeError(
      "Failed to fetch dynamically imported module: /assets/page.js",
    );
    const get = vi.spyOn(port, "get");
    const set = vi.spyOn(port, "set");

    listenForChunkPreloadError(port, target);
    const event = dispatchPreloadError(target, originalError);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(originalError, "navigation");
    expect(report.mock.invocationCallOrder[0]).toBeLessThan(
      get.mock.invocationCallOrder[0]!,
    );
    expect(report.mock.invocationCallOrder[0]).toBeLessThan(
      set.mock.invocationCallOrder[0]!,
    );
    expect(report.mock.invocationCallOrder[0]).toBeLessThan(
      reload.mock.invocationCallOrder[0]!,
    );
    // preventDefault를 호출하지 않는다 — Vite가 원래 오류를 그대로 throw하게 둔다.
    expect(event.defaultPrevented).toBe(false);
  });

  it("비 Error payload를 Error로 감싸서 동기 보고한다", () => {
    const { port, report } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;

    listenForChunkPreloadError(port, target);
    dispatchPreloadError(target, "css request failed");

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error",
        message: "css request failed",
      }),
      "navigation",
    );
  });

  it("보고가 throw해도 reload를 계속한다", () => {
    const { port, reload } = createPort();
    port.report = vi.fn(() => {
      throw new Error("report failed");
    });
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;

    listenForChunkPreloadError(port, target);
    dispatchPreloadError(target, new Error("preload failed"));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("TTL 안에서 재발생하면 reload를 예약하지 않는다", () => {
    // 무한 새로고침 루프 방지가 이 항목의 핵심이다. 청크가 계속 404인 배포 파손
    // 상태에서 reload를 반복하면 사용자가 아무것도 할 수 없게 된다.
    const { port, reload, report } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;

    listenForChunkPreloadError(port, target);
    dispatchPreloadError(target);
    expect(reload).toHaveBeenCalledTimes(1);

    dispatchPreloadError(target);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("TTL이 지나면 다음 배포의 복구를 다시 허용한다", () => {
    const { port, reload } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);

    listenForChunkPreloadError(port, target);
    dispatchPreloadError(target);
    expect(reload).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_000 + CHUNK_RELOAD_TTL_MS + 1);
    dispatchPreloadError(target);

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("shouldReload가 false면 reload를 예약하지 않는다", () => {
    const { port, reload, report } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;
    const shouldReload = vi.fn(() => false);
    const originalError = new Error("hover preload failed");

    listenForChunkPreloadError(port, target, shouldReload);
    dispatchPreloadError(target, originalError);

    expect(reload).not.toHaveBeenCalled();
    expect(shouldReload).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(originalError, "preload");
  });

  it.each([false, true])(
    "지연 보고도 이벤트 시점 trigger와 보고 후 reload 순서를 지킨다(navigating %s)",
    async (navigating) => {
      vi.useFakeTimers();
      const { port, reload, report } = createPort();
      currentPort = port;
      const get = vi.spyOn(port, "get");
      const target = new EventTarget();
      let currentNavigation = navigating;
      let importSettled = false;
      const shouldReport = vi.fn(() => () => importSettled);
      const stop = listenForChunkPreloadError(
        port,
        target,
        () => currentNavigation,
        undefined,
        shouldReport,
      );
      const error = new TypeError("Importing a module script failed");
      try {
        const event = dispatchPreloadError(target, error);
        expect(report).not.toHaveBeenCalled();
        expect(get).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
        currentNavigation = !navigating;
        importSettled = true;
        await vi.advanceTimersByTimeAsync(0);
        expect(report).toHaveBeenCalledExactlyOnceWith(
          error,
          navigating ? "navigation" : "preload",
        );
        expect(shouldReport).toHaveBeenCalledOnce();
        expect(reload).toHaveBeenCalledTimes(navigating ? 1 : 0);
        if (navigating)
          expect(report.mock.invocationCallOrder[0]).toBeLessThan(
            get.mock.invocationCallOrder[0]!,
          );
        else expect(get).not.toHaveBeenCalled();
      } finally {
        stop();
        vi.useRealTimers();
      }
    },
  );

  it.each([false, true])(
    "보고를 제외해도 청크 복구와 Vite 오류 전파는 유지한다(deferred %s)",
    async (deferred) => {
      vi.useFakeTimers();
      const { port, reload, report } = createPort();
      currentPort = port;
      const target = new EventTarget();
      const stop = listenForChunkPreloadError(
        port,
        target,
        () => true,
        undefined,
        () => (deferred ? () => false : false),
      );
      try {
        const event = dispatchPreloadError(target, new Error("preload failed"));
        await vi.advanceTimersByTimeAsync(0);
        expect(report).not.toHaveBeenCalled();
        expect(reload).toHaveBeenCalledOnce();
        expect(event.defaultPrevented).toBe(false);
      } finally {
        stop();
        vi.useRealTimers();
      }
    },
  );

  it("해제하면 preload의 지연 보고도 취소한다", async () => {
    vi.useFakeTimers();
    const { port, reload, report } = createPort();
    currentPort = port;
    const target = new EventTarget();
    const stop = listenForChunkPreloadError(
      port,
      target,
      () => false,
      undefined,
      () => () => true,
    );
    try {
      dispatchPreloadError(target, new Error("preload failed"));
      stop();
      await vi.advanceTimersByTimeAsync(0);
      expect(report).not.toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
    } finally {
      stop();
      vi.useRealTimers();
    }
  });

  it("shouldReload false 통과는 TTL 가드를 소모하지 않는다", () => {
    // 이 리스너에 전달된 다음 네비게이션 이벤트는 preload 실패 때문에 가드에 막히지 않는다.
    const { port, reload } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;
    let navigating = false;

    listenForChunkPreloadError(port, target, () => navigating);
    dispatchPreloadError(target); // intent preload — 보고하고 통과
    expect(reload).not.toHaveBeenCalled();

    navigating = true;
    dispatchPreloadError(target); // 네비게이션 실패 — 즉시 reload 예약

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("해제 함수를 호출하면 더 이상 반응하지 않는다", () => {
    const { port, reload } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;

    const stop = listenForChunkPreloadError(port, target);
    stop();
    dispatchPreloadError(target);

    expect(reload).not.toHaveBeenCalled();
  });

  it("스토리지가 막혀 가드를 영속할 수 없으면 reload를 예약하지 않는다", () => {
    // TTL 가드를 영속할 수 없는 환경에서는 자동 복구를 포기하고 사후 복구 층
    // (라우트 에러 경계의 수동 새로고침 버튼)에 맡긴다.
    const reload = vi.fn(() => Promise.resolve());
    const report = vi.fn();
    const blockedPort: ChunkReloadPort = {
      get: () => null,
      set: () => {
        throw new Error("storage blocked");
      },
      remove: () => {},
      report,
      reload,
    };
    currentPort = blockedPort;
    clearChunkReloadGuard(blockedPort);
    const target = new EventTarget() as unknown as Window;

    listenForChunkPreloadError(blockedPort, target);
    dispatchPreloadError(target);

    expect(reload).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledTimes(1);
  });

  it("undefined로 fulfilled되는 소비 창이 없다 — preventDefault를 하지 않으므로 원본 에러가 그대로 전파된다", async () => {
    // 회귀 실증: 이 리스너가 다시 preventDefault()를 호출하도록 되돌리면, vite
    // 내부(`baseModule().catch(handlePreloadError)`)가 원래 에러를 삼키고 import
    // promise가 undefined로 fulfilled된다 — 그 undefined를 소비하는 곳(예:
    // `lazyRouteComponent`의 `res["component"]`)에서 새 TypeError가 자기 유발된다.
    // 이 테스트는 그 자기 유발 조건(리스너가 이벤트를 삼킴)이 제거됐음을, vite와
    // 동일한 형태의 소비자를 흉내내 확인한다.
    const { port } = createPort();
    currentPort = port;
    clearChunkReloadGuard(port);
    const target = new EventTarget() as unknown as Window;

    listenForChunkPreloadError(port, target);

    // vite 내부 handlePreloadError와 동일한 조건문을 재현한다: 이벤트가
    // preventDefault되지 않았으면 원본 에러를 throw하고, import promise는
    // 그 reject를 그대로 전파한다(undefined로 조용히 fulfilled되지 않는다).
    const originalError = new TypeError(
      "Failed to fetch dynamically imported module: /assets/heavy.js",
    );
    const simulateViteImport = (): Promise<
      { component: unknown } | undefined
    > => {
      const event = new Event("vite:preloadError", { cancelable: true });
      (event as Event & { payload?: unknown }).payload = originalError;
      target.dispatchEvent(event);
      if (!event.defaultPrevented) {
        return Promise.reject(originalError);
      }
      return Promise.resolve(undefined);
    };

    // lazyRouteComponent의 소비 패턴(res["component"])을 그대로 재현한다.
    const consumeLikeLazyRouteComponent = async (): Promise<void> => {
      const res = await simulateViteImport();
      // res가 undefined면 여기서 새 TypeError가 자기 유발된다(회귀 시 실패 지점).
      void (res as { component: unknown })["component"];
    };

    // 원본 vite 에러(정확한 청크 실패 메시지)로 reject해야 한다 — undefined 소비로
    // 인한 별개의 TypeError(`Cannot read properties of undefined`)가 아니어야 한다.
    await expect(consumeLikeLazyRouteComponent()).rejects.toBe(originalError);
  });
});
