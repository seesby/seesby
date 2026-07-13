import React from 'react';

export default function FactorChips({ factors }: { factors?: unknown }) {
  const list = parseFactors(factors);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {list.map((f, i) => (
        <span
          key={`${f}-${i}`}
          className="px-1.5 py-0.5 rounded border border-[var(--brand-border-3)] bg-[var(--brand-surface-0)] text-[10px] text-[var(--brand-text-mid)] font-mono"
        >
          {f}
        </span>
      ))}
    </div>
  );
}

function parseFactors(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
