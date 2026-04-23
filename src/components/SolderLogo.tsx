import { useId } from 'react';

type SolderLogoProps = {
  iconSize?: number;
  className?: string;
};

/**
 * Shared Solder brand mark used across the app shell.
 *
 * The toolbar and welcome modal both render the same icon + wordmark pair.
 * Centralizing that markup keeps spacing, sizing, and colors aligned so those
 * two surfaces do not drift apart over time.
 */
export function SolderLogo({
  iconSize = 18,
  className = 'gap-1.5',
}: SolderLogoProps) {
  const gradientId = useId();

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        viewBox="-1 -1 34 34"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect
          width="32"
          height="32"
          rx="7"
          fill="#030712"
          stroke="#374151"
          strokeWidth="1.5"
        />
        <g transform="rotate(45 16 16)">
          <path
            d="M18 5.5L11 17h4.5L13 26.5 21 15h-5L18 5.5z"
            fill={`url(#${gradientId})`}
            stroke="#93c5fd"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      <div className="font-bold font-mono text-blue-400 text-sm">solder</div>
    </div>
  );
}
