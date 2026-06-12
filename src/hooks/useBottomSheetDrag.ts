import { useDragControls, type PanInfo } from "motion/react";

const DISMISS_OFFSET_PX = 100;
const DISMISS_VELOCITY = 500;

interface UseBottomSheetDragArgs {
  /** 드래그-다운 임계 초과 시 호출 (시트 닫기). */
  onDismiss: () => void;
}

interface UseBottomSheetDragReturn {
  /** motion.div의 dragControls prop으로 그대로 전달. */
  dragControls: ReturnType<typeof useDragControls>;
  /** motion.div의 onDragEnd prop으로 그대로 전달. */
  handleDragEnd: (event: PointerEvent, info: PanInfo) => void;
  /** 핸들 바 element의 onPointerDown으로 전달. 핸들에서만 드래그 시작 — 본문 스크롤과 충돌 회피. */
  startDrag: (event: React.PointerEvent) => void;
}

/**
 * 모바일 바텀시트의 드래그-다운 닫기 훅.
 *
 * Drawer/Modal/DatePicker 등 같은 패턴 4곳에서 사용. 임계는 100px 또는 velocity 500.
 * 핸들 영역에서만 드래그 시작하려면 motion.div에 `dragListener={false}` + 핸들에서 `startDrag` 호출.
 *
 * @example
 * ```tsx
 * const { dragControls, handleDragEnd, startDrag } = useBottomSheetDrag({
 *   onDismiss: () => setOpen(false),
 * });
 *
 * <motion.div
 *   drag="y"
 *   dragListener={false}
 *   dragControls={dragControls}
 *   dragConstraints={{ top: 0 }}
 *   dragElastic={{ top: 0, bottom: 0.4 }}
 *   onDragEnd={handleDragEnd}
 * >
 *   <div onPointerDown={startDrag} className="cursor-grab touch-none">
 *     {handle}
 *   </div>
 * </motion.div>
 * ```
 */
export function useBottomSheetDrag({
  onDismiss,
}: UseBottomSheetDragArgs): UseBottomSheetDragReturn {
  const dragControls = useDragControls();

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET_PX || info.velocity.y > DISMISS_VELOCITY) {
      onDismiss();
    }
  };

  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event);
  };

  return { dragControls, handleDragEnd, startDrag };
}
