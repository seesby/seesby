import React from 'react';

export const SkeletonRow = () => (
  <div className="flex gap-4 py-2 animate-pulse">
    <div className="h-4 w-64 rounded bg-[var(--brand-surface-3)]]" />
    <div className="h-4 w-16 rounded bg-[var(--brand-surface-3)]]" />
    <div className="h-4 w-48 rounded bg-[var(--brand-surface-3)]]" />
    <div className="h-4 w-12 rounded bg-[var(--brand-surface-3)]]" />
  </div>
);

export const SkeletonChart = () => (
  <div className="rounded-lg border border-[var(--brand-border-2)]] bg-[var(--brand-surface-2)]] p-4 animate-pulse">
    <div className="mb-4 h-4 w-32 rounded bg-[var(--brand-surface-3)]]" />
    <div className="h-[200px] rounded bg-[var(--brand-surface-3)]]" />
  </div>
);

export const SkeletonTable = ({ rows = 10 }: { rows?: number }) => (
  <div className="space-y-1">
    {Array.from({ length: rows }).map((_, index) => (
      <SkeletonRow key={index} />
    ))}
  </div>
);
