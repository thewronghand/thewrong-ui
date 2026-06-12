import { forwardRef } from "react";

import type { SwitchProps } from "./types";
import { getSwitchThumbClasses, getSwitchTrackClasses } from "./utils";

/**
 * On/Off 토글 스위치.
 *
 * `<input type="checkbox">`를 시각적으로 가리고(`sr-only peer`) 트랙·노브를 그린다.
 * 키보드(스페이스), 클릭, label 클릭 모두 native 동작 그대로 작동.
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="잔여한도 지급 기능 사용"
 * />
 * ```
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      size = "medium",
      label,
      className = "",
      disabled = false,
      onCheckedChange,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={`inline-flex items-center gap-2 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
      >
        <span className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            disabled={disabled}
            onChange={handleChange}
            {...rest}
          />
          {/* peer-* utility는 input의 형제에만 적용된다. 트랙은 형제로 두고,
              thumb은 트랙 안에 있지만 형제가 아니므로 별도의 형제 span으로 분리해
              translate를 그쪽에 건다. 트랙은 색만 담당. */}
          <span aria-hidden className={getSwitchTrackClasses(size, disabled)} />
          <span aria-hidden className={getSwitchThumbClasses(size)} />
        </span>
        {label && (
          <span
            className={
              disabled
                ? "text-sm text-text-disabled"
                : "text-sm text-text-primary"
            }
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";
