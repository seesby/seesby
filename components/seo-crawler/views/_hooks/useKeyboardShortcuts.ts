// useKeyboardShortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onSearch, onToggleInspector, onExport, onNextRow, onPrevRow, onOpenInspector,
}: {
  onSearch?: () => void;
  onToggleInspector?: () => void;
  onExport?: () => void;
  onNextRow?: () => void;
  onPrevRow?: () => void;
  onOpenInspector?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '/') { e.preventDefault(); onSearch?.(); return; }
      if (e.key === 'i') { e.preventDefault(); onToggleInspector?.(); return; }
      if (e.key === 'e') { e.preventDefault(); onExport?.(); return; }
      if (e.key === 'j') { e.preventDefault(); onNextRow?.(); return; }
      if (e.key === 'k') { e.preventDefault(); onPrevRow?.(); return; }
      if (e.key === 'Enter') { onOpenInspector?.(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch, onToggleInspector, onExport, onNextRow, onPrevRow, onOpenInspector]);
}
