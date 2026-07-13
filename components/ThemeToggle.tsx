import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeToggleProps {
    theme: string;
    setTheme: (t: Theme) => void;
    /** Visual size variant. */
    size?: 'sm' | 'md';
    /** When true, uses a dark glass surface (for use inside dark chrome). */
    dark?: boolean;
}

const OPTIONS: { key: Theme; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { key: 'dark', label: 'Dark', Icon: Moon },
    { key: 'light', label: 'Light', Icon: Sun },
    { key: 'system', label: 'System', Icon: Monitor },
];

/**
 * Segmented Dark / Light / System control.
 * Wire to the existing `theme` / `setTheme` from SeoCrawlerContext.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme, size = 'md', dark = false }) => {
    const btn = size === 'sm' ? 22 : 28;
    const icon = size === 'sm' ? 12 : 14;
    const active = theme as Theme;

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className="inline-flex items-center rounded-full"
            style={{
                padding: 2,
                gap: 2,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.06)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(28,25,23,0.10)'}`,
            }}
        >
            {OPTIONS.map(({ key, label, Icon }) => {
                const isActive = active === key;
                return (
                    <button
                        key={key}
                        role="radio"
                        aria-checked={isActive}
                        title={label}
                        aria-label={label}
                        onClick={() => setTheme(key)}
                        className="flex items-center justify-center rounded-full transition-colors"
                        style={{
                            width: btn,
                            height: btn,
                            color: isActive
                                ? dark ? '#FFFFFF' : '#1C1917'
                                : dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,25,23,0.45)',
                            background: isActive
                                ? dark ? 'rgba(245,158,11,0.22)' : 'var(--brand-amber)'
                                : 'transparent',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = dark ? '#FFFFFF' : '#1C1917'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,25,23,0.45)'; }}
                    >
                        <Icon size={icon} />
                    </button>
                );
            })}
        </div>
    );
};
