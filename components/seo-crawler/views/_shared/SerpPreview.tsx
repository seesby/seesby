// SerpPreview.tsx — SERP card mock for inspector / canvases
import React from 'react';
import clsx from 'clsx';

export function SerpPreview({
  url, title, description, device = 'desktop',
  rating, reviewCount, lastUpdated,
}: {
  url: string;
  title: string;
  description: string;
  device?: 'desktop' | 'mobile';
  rating?: number;
  reviewCount?: number;
  lastUpdated?: string;
}) {
  const titleMax = device === 'desktop' ? 60 : 70;
  const descMax  = device === 'desktop' ? 160 : 130;
  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  return (
    <div className={clsx(
      'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)] p-3',
      device === 'mobile' ? 'max-w-[360px]' : 'max-w-[580px]',
    )}>
      <div className="text-[11px] text-[var(--brand-text-mid)]">{url}</div>
      <div className="text-[14px] text-[#7c8cff] hover:underline cursor-pointer">{truncate(title, titleMax)}</div>
      <div className="text-[12px] text-[var(--brand-text-mid)] mt-0.5">{truncate(description, descMax)}</div>
      {(rating || lastUpdated) && (
        <div className="text-[11px] text-[var(--brand-text-mid)] mt-1">
          {rating ? `★ ${rating.toFixed(1)} · ${reviewCount ?? 0} reviews · ` : ''}{lastUpdated ?? ''}
        </div>
      )}
    </div>
  );
}
