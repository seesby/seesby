// ErrorView.tsx
import React from 'react';

export function ErrorView({
  title = "Couldn't load this view.", error, onRetry,
}: { title?: string; error?: Error | string; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : (error ?? '');
  return (
    <div className="flex-1 grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="text-[14px] text-white font-semibold">{title}</div>
        {msg && <div className="text-[12px] text-[#888] mt-1">{msg}</div>}
        {onRetry && (
          <button onClick={onRetry} className="mt-4 h-8 px-3 text-[12px] bg-[#F59E0B] text-white rounded hover:bg-[#df3248]">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
