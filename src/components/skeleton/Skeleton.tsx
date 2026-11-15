import { cn } from "@/lib/utils";

import type { SkeletonProps } from "./types";

/**
 * 장식용 로딩 블록. 크기와 레이아웃은 소비자가 className으로 지정한다.
 * 보조기기에는 숨겨지므로 로딩 상태 설명이 필요하면 별도 상태 문구를 제공한다.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-control-small bg-bg-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}
