import type { ErrorInfo, ReactNode } from "react";
import type { ChunkReloadPort } from "./chunk-reload";

export interface ErrorBoundaryFallbackProps {
  error: Error;
  isChunkError: boolean;
  reset: () => void;
  reload: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** 영속 가드와 보고·새로고침 구현. 없으면 청크 자동 새로고침을 시도하지 않는다. */
  chunkReloadPort?: ChunkReloadPort;
  /** 기본 안내 대신 표시할 폴백. reset과 reload를 직접 연결할 수 있다. */
  fallbackRender?: (props: ErrorBoundaryFallbackProps) => ReactNode;
  /** 기본 폴백의 안내 문구. */
  message?: string;
  /** 일반 오류에서 다시 렌더할 버튼의 문구. */
  retryLabel?: string;
  /** 청크 오류에서 페이지를 새로고침할 버튼의 문구. */
  reloadLabel?: string;
  /** 청크 오류를 포함한 렌더 오류마다 호출된다. */
  onError?: (error: Error, errorInfo: ErrorInfo, isChunkError: boolean) => void;
}
