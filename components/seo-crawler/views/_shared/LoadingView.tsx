// LoadingView.tsx
import React from 'react';

export function LoadingView() {
  return (
    <div className="flex-1 p-3 space-y-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-[var(--brand-surface-1)]] animate-pulse" />
      ))}
    </div>
  );
}
