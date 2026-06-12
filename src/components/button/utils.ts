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
      filled:
        "border-transparent bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-secondary-200 disabled:text-secondary-300 dark:disabled:bg-secondary-700 dark:disabled:text-secondary-500",
      outlined:
        "bg-white dark:bg-transparent text-secondary-800 dark:text-secondary-100 border-secondary-400 dark:border-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 disabled:text-secondary-300 disabled:border-secondary-200 disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-secondary-800 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 disabled:text-secondary-300",
    },
    secondary: {
      filled:
        "border-transparent bg-primary-300 text-white hover:bg-primary-500 active:bg-primary-600 disabled:bg-secondary-200 disabled:text-secondary-300 dark:disabled:bg-secondary-700 dark:disabled:text-secondary-500",
      outlined:
        "bg-white dark:bg-transparent text-secondary-500 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 disabled:text-secondary-300 disabled:border-secondary-100 disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-secondary-500 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 disabled:text-secondary-300",
    },
    tertiary: {
      filled:
        "border-transparent bg-secondary-100 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600 active:bg-secondary-300 dark:active:bg-secondary-500 disabled:bg-secondary-50 dark:disabled:bg-secondary-900 disabled:text-secondary-300",
      outlined:
        "bg-white dark:bg-transparent text-secondary-400 dark:text-secondary-500 border-secondary-200 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-900 active:bg-secondary-100 dark:active:bg-secondary-800 disabled:text-secondary-300 disabled:border-secondary-100 disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-secondary-400 dark:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900 active:bg-secondary-100 dark:active:bg-secondary-800 disabled:text-secondary-300",
    },
    danger: {
      filled:
        "border-transparent bg-error-500 text-white hover:bg-error-600 active:bg-error-700 disabled:bg-secondary-200 disabled:text-secondary-300 dark:disabled:bg-secondary-700 dark:disabled:text-secondary-500",
      outlined:
        "bg-white dark:bg-transparent text-error-600 dark:text-error-400 border-error-500 dark:border-error-400 hover:bg-error-50 dark:hover:bg-error-950 active:bg-error-100 dark:active:bg-error-900 disabled:text-error-300 disabled:border-error-200 disabled:bg-transparent",
      transparent:
        "border-transparent bg-transparent text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950 active:bg-error-100 dark:active:bg-error-900 disabled:text-error-300",
    },
  };
  return map[variant][appearance];
};

export const getButtonSizeClasses = (size: ButtonSize = "medium"): string => {
  const map: Record<ButtonSize, string> = {
    mini: "h-7 px-2 text-xs gap-1 rounded-md",
    small: "h-9 px-3 text-sm gap-1.5 rounded-lg",
    medium: "h-11 px-3.5 text-sm gap-2 rounded-xl",
    large: "h-12 px-5 text-base gap-2 rounded-xl",
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

export const getButtonBaseClasses = (): string =>
  "items-center justify-center font-medium border-[1.5px] transition-colors duration-200 ease-out outline-none focus:ring-2 focus:ring-inset disabled:cursor-not-allowed disabled:pointer-events-none";

export const getButtonFocusRing = (
  variant: ButtonVariant = "primary",
): string => {
  const map: Record<ButtonVariant, string> = {
    primary: "focus:ring-primary-300",
    secondary: "focus:ring-primary-300",
    tertiary: "focus:ring-secondary-400",
    danger: "focus:ring-error-300",
  };
  return map[variant];
};
