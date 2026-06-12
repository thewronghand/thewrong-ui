import { forwardRef } from "react";

import type { BadgeProps } from "./types";
import {
  getBadgeBaseClasses,
  getBadgeColorClasses,
  getBadgeSizeClasses,
} from "./utils";

export const Badge = forwardRef<HTMLSpanElement | HTMLDivElement, BadgeProps>(
  (props, ref) => {
    const {
      size = "medium",
      variant = "fill",
      color = "neutral",
      className = "",
      children,
      ...restProps
    } = props;

    const classes = [
      getBadgeBaseClasses(),
      getBadgeColorClasses(color, variant),
      getBadgeSizeClasses(size),
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const isDiv = "as" in props && props.as === "div";

    if (isDiv) {
      const { as: _as, ...divProps } = restProps as Extract<
        BadgeProps,
        { as: "div" }
      >;
      return (
        <div
          ref={ref as React.ForwardedRef<HTMLDivElement>}
          className={classes}
          {...divProps}
        >
          {children}
        </div>
      );
    }

    return (
      <span
        ref={ref as React.ForwardedRef<HTMLSpanElement>}
        className={classes}
        {...(restProps as React.ComponentPropsWithoutRef<"span">)}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
