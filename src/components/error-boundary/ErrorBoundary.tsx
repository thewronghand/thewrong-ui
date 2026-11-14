import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  isChunkLoadError,
  reloadAfterClearingChunkGuard,
  reloadOnceForChunkError,
} from "./chunk-reload";
import type { ErrorBoundaryProps } from "./types";

interface ErrorBoundaryState {
  error: Error | null;
  isChunkError: boolean;
}

const INITIAL_STATE: ErrorBoundaryState = { error: null, isChunkError: false };

/**
 * 자손의 렌더 오류를 포착하고 다시 시도할 수 있는 경계.
 *
 * 청크 오류의 자동 새로고침에는 영속 가드가 필요하다. 저장소 접근이 막히거나
 * chunkReloadPort가 없으면 반복 새로고침을 피하기 위해 폴백을 유지한다.
 * 포트와 fallbackRender를 주입하면 복구·안내 방식을 직접 지정할 수 있다.
 * 이벤트 핸들러나 비동기 콜백의 오류는 React 경계가 포착하지 않으므로 호출부에서 처리한다.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = INITIAL_STATE;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, isChunkError: isChunkLoadError(error) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const isChunkError = isChunkLoadError(error);
    this.props.onError?.(error, info, isChunkError);
    if (isChunkError && this.props.chunkReloadPort) {
      reloadOnceForChunkError(this.props.chunkReloadPort);
    }
  }

  private reset = (): void => {
    this.setState(INITIAL_STATE);
  };

  private reload = (): void => {
    if (this.props.chunkReloadPort)
      reloadAfterClearingChunkGuard(this.props.chunkReloadPort);
    else if (typeof window !== "undefined") window.location.reload();
  };

  override render(): ReactNode {
    const { error, isChunkError } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallbackRender) {
      return this.props.fallbackRender({
        error,
        isChunkError,
        reset: this.reset,
        reload: this.reload,
      });
    }
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-control-medium border-control border-border-subtle bg-bg-surface p-4 text-fg-default"
      >
        <p>{this.props.message ?? "문제가 발생했습니다."}</p>
        <button
          type="button"
          className="rounded-control-small bg-primary px-3 py-2 text-fg-inverse"
          onClick={isChunkError ? this.reload : this.reset}
        >
          {isChunkError
            ? (this.props.reloadLabel ?? "새로고침")
            : (this.props.retryLabel ?? "다시 시도")}
        </button>
      </div>
    );
  }
}
