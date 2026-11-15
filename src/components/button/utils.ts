import type {
  ButtonAppearance,
  ButtonDisplay,
  ButtonSize,
  ButtonVariant,
} from "./types";

export const getButtonColorClasses = (
  variant: ButtonVariant = "primary",
  appearance: ButtonAppearance = "filled",
): string => {
  const map: Record<ButtonVariant, Record<ButtonAppearance, string>> = {
    primary: {
      link: "border-transparent bg-transparent text-primary-fg disabled:text-fg-disabled aria-disabled:text-fg-disabled",
      filled:
        "border-transparent bg-primary text-fg-inverse hover:bg-primary-hover active:bg-primary-active disabled:bg-bg-disabled disabled:text-fg-disabled",
      outlined:
        "bg-bg-surface text-fg-default border-border-default hover:bg-bg-subtle active:bg-bg-muted disabled:text-fg-disabled disabled:border-border-subtle disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-fg-default hover:bg-bg-subtle active:bg-bg-muted disabled:text-fg-disabled",
    },
    secondary: {
      link: "border-transparent bg-transparent text-fg-muted hover:text-fg-default active:text-fg-default disabled:text-fg-disabled aria-disabled:text-fg-disabled",
      filled:
        "border-transparent bg-primary-subtle text-primary-fg hover:bg-button-secondary-hover active:bg-button-secondary-active disabled:bg-bg-disabled disabled:text-fg-disabled",
      outlined:
        "bg-bg-surface text-fg-muted border-border-subtle hover:bg-bg-subtle active:bg-bg-muted disabled:text-fg-disabled disabled:border-border-faint disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-fg-muted hover:bg-bg-subtle active:bg-bg-muted disabled:text-fg-disabled",
    },
    tertiary: {
      link: "border-transparent bg-transparent text-fg-subtle hover:text-fg-default active:text-fg-default disabled:text-fg-disabled aria-disabled:text-fg-disabled",
      filled:
        "border-transparent bg-bg-subtle text-fg-muted hover:bg-bg-muted active:bg-bg-disabled disabled:bg-bg-page disabled:text-fg-disabled",
      outlined:
        "bg-bg-surface text-fg-subtle border-border-subtle hover:bg-bg-page active:bg-bg-subtle disabled:text-fg-disabled disabled:border-border-faint disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-fg-subtle hover:bg-bg-page active:bg-bg-subtle disabled:text-fg-disabled",
    },
    danger: {
      link: "border-transparent bg-transparent text-error-fg disabled:text-fg-disabled aria-disabled:text-fg-disabled",
      filled:
        "border-transparent bg-error text-fg-inverse hover:bg-error-hover active:bg-error-active disabled:bg-bg-disabled disabled:text-fg-disabled",
      outlined:
        "bg-bg-surface text-error-fg border-border-danger hover:bg-error-subtle active:bg-error-muted disabled:text-error-border disabled:border-error-border disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-error-fg hover:bg-error-subtle active:bg-error-muted disabled:text-error-border",
    },
  };
  return map[variant][appearance];
};

export const getButtonSizeClasses = (size: ButtonSize = "medium"): string => {
  const map: Record<ButtonSize, string> = {
    mini: "h-control-mini px-control-pad-mini text-control-mini gap-button-mini rounded-control-mini",
    small: "h-control-small px-control-pad-small text-control-small gap-button-small rounded-control-small",
    medium: "h-control-medium px-control-pad-medium text-control-medium gap-button-medium rounded-control-medium",
    large: "h-control-large px-control-pad-large text-control-large gap-button-large rounded-control-large",
  };
  return map[size];
};

export const getButtonDisplayClasses = (
  display: ButtonDisplay = "inline",
): string => {
  const map: Record<ButtonDisplay, string> = {
    inline: "inline-flex",
    block: "flex w-full",
  };
  return map[display];
};

export const getButtonBaseClasses = (appearance: ButtonAppearance = "filled"): string =>
  `items-center justify-center ${appearance === "link" ? "" : "font-control-action "}border-button transition-colors duration-button ease-button outline-none focus-visible:ring-button ${appearance === "link" ? "box-decoration-clone focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" : "focus-visible:ring-inset"} disabled:cursor-not-allowed disabled:pointer-events-none`;

export const getButtonFocusRing = (
  variant: ButtonVariant = "primary",
): string => {
  const map: Record<ButtonVariant, string> = {
    primary: "focus-visible:ring-focus-primary",
    secondary: "focus-visible:ring-focus-primary",
    tertiary: "focus-visible:ring-border-default",
    danger: "focus-visible:ring-focus-danger",
  };
  return map[variant];
};
