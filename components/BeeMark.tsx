import React from 'react';

interface BeeMarkProps {
  size?: number;
  className?: string;
  /** Render the mark with a soft amber glow (for dark backgrounds) */
  glow?: boolean;
}

/**
 * The genuine Seesby bee mark, inlined from branding/assets/mark/mark.svg.
 * Static (no SMIL animation) so it stays calm inside app chrome.
 * Color is fixed amber/ink per the brand system.
 */
export const BeeMark: React.FC<BeeMarkProps> = ({ size = 32, className = '', glow = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''} ${className}`}
      role="img"
      aria-label="Seesby"
    >
      <defs>
        <clipPath id="beeMarkBodyClip">
          <ellipse cx="50" cy="58" rx="22" ry="26" />
        </clipPath>
      </defs>

      {/* Wings */}
      <path d="M48 36 C34 16 12 18 9 34 C7 48 24 58 48 48 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <path d="M52 36 C66 16 88 18 91 34 C93 48 76 58 52 48 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />

      {/* Legs */}
      <g fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" opacity="0.55">
        <path d="M30 60 Q20 68 16 76" />
        <path d="M31 67 Q22 75 19 83" />
        <path d="M33 73 Q26 81 24 89" />
        <path d="M70 60 Q80 68 84 76" />
        <path d="M69 67 Q78 75 81 83" />
        <path d="M67 73 Q74 81 76 89" />
      </g>

      {/* Stinger */}
      <path d="M44 82 L50 91 L56 82 Z" fill="#D97706" />

      {/* Body */}
      <ellipse cx="50" cy="58" rx="22" ry="26" fill="#F59E0B" stroke="#D97706" strokeWidth="1.6" />

      {/* Stripes */}
      <g clipPath="url(#beeMarkBodyClip)">
        <rect x="22" y="52" width="56" height="5" fill="#D97706" opacity="0.85" />
        <rect x="22" y="64" width="56" height="5" fill="#D97706" opacity="0.85" />
      </g>

      {/* Head */}
      <circle cx="50" cy="30" r="12" fill="#F59E0B" stroke="#D97706" strokeWidth="1.6" />

      {/* Eyes */}
      <circle cx="45" cy="30" r="3" fill="#1C1917" />
      <circle cx="55" cy="30" r="3" fill="#1C1917" />
      <circle cx="44" cy="29" r="1" fill="#FFFFFF" opacity="0.85" />
      <circle cx="54" cy="29" r="1" fill="#FFFFFF" opacity="0.85" />

      {/* Antennae */}
      <g fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
        <path d="M45 20 Q38 10 33 7" />
        <path d="M55 20 Q62 10 67 7" />
      </g>
      <circle cx="33" cy="7" r="2" fill="#D97706" />
      <circle cx="67" cy="7" r="2" fill="#D97706" />
    </svg>
  );
};

export default BeeMark;
