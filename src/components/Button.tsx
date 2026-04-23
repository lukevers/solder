import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Visual variants for the shared app button primitive.
 *
 * `chrome` matches the dark utility buttons used throughout the editor shell.
 * `ghost` is a lighter treatment for less-prominent actions that still need
 * the same sizing and typography rules.
 */
const BUTTON_VARIANT = {
  chrome: 'border border-gray-700 bg-gray-800 hover:bg-gray-700',
  ghost: 'border border-transparent bg-transparent hover:bg-gray-800',
} as const;

/**
 * Semantic text-color variants layered on top of the button chrome.
 *
 * These map to the color treatments already used by the toolbar and other
 * editor controls, so callers can choose intent without rewriting classes.
 */
const BUTTON_TONE = {
  neutral: 'text-gray-200',
  blue: 'text-blue-400',
  red: 'text-red-400',
  green: 'text-green-400',
  amber: 'text-amber-400',
  muted: 'text-gray-300',
} as const;

/**
 * Shared padding and font sizes for the common shell button sizes.
 *
 * The app mostly uses compact buttons, so the default is the same small size
 * seen in the toolbar and welcome modal.
 */
const BUTTON_SIZE = {
  xs: 'px-2 py-1 text-[10px]',
  sm: 'px-3 py-1.5 text-[11px]',
} as const;

type ButtonTone = keyof typeof BUTTON_TONE;
type ButtonSize = keyof typeof BUTTON_SIZE;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof BUTTON_VARIANT;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullHeight?: boolean;
};

/**
 * Concatenate optional class name fragments into one string.
 *
 * The project does not currently use a dedicated `clsx`-style helper, so this
 * tiny local utility keeps the button primitive dependency-free.
 */
function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Shared button primitive for the editor shell.
 *
 * This centralizes the compact monospace button language used by controls
 * across the app so variant changes can happen in one place instead of through
 * repeated Tailwind strings.
 */
export function Button({
  children,
  className,
  disabled,
  fullHeight = false,
  size = 'sm',
  tone = 'neutral',
  type = 'button',
  variant = 'chrome',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={joinClasses(
        'rounded font-mono uppercase tracking-wider transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        fullHeight && 'h-full',
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        BUTTON_TONE[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
