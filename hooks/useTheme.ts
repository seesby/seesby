import { useSeoCrawler } from '../contexts/SeoCrawlerContext';

export type Theme = 'dark' | 'light' | 'system';

/**
 * Centralized access to the app theme + setter from SeoCrawlerContext.
 * The crawler is the primary provider, so callers inside the crawler
 * (Navbar is rendered inside it) get live theme state. Falls back to
 * reading the persisted choice when no provider is present.
 */
export function useTheme(): { theme: string; setTheme: (t: Theme) => void } {
    try {
        const ctx = useSeoCrawler() as any;
        if (ctx?.theme && ctx?.setTheme) {
            return { theme: ctx.theme, setTheme: ctx.setTheme as (t: Theme) => void };
        }
    } catch {
        /* provider not mounted — fall through */
    }
    const persisted = typeof localStorage !== 'undefined'
        ? localStorage.getItem('seesby:theme') || 'system'
        : 'system';
    return {
        theme: persisted,
        setTheme: (t: Theme) => {
            if (typeof localStorage !== 'undefined') localStorage.setItem('seesby:theme', t);
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-theme', t);
            }
        },
    };
}
