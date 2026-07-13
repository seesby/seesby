// components/seo-crawler/views/_shared/KpiTile.tsx
import React from 'react';
import clsx from 'clsx';
import { fmtCompact, fmtDelta } from './formatters';
import { SURFACE, TEXT, STATUS, R, S } from './tokens';

export type KpiTone = 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'accent';
const TONE_FG: Record<KpiTone, string> = {
  neutral: TEXT.primary,
  good:    STATUS.good,
  warn:    STATUS.warn,
  bad:     STATUS.bad,
  info:    STATUS.info,
  accent:  TEXT.primary,
};

export type KpiTileProps = {
  label: string;
  value: React.ReactNode;
  delta?: number;
  hint?: string;
  tone?: KpiTone;
  spark?: number[];
  onClick?: () => void;
};

export function KpiTile({ label, value, delta, hint, tone = 'neutral', spark, onClick }: KpiTileProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        'min-w-0 truncate text-left',
        onClick && 'hover:opacity-80 cursor-pointer',
      )}
      style={{
        padding: `${S[2]}px ${S[3]}px`,
        borderRadius: R.md,
        border: `1px solid ${SURFACE.br1}`,
        background: SURFACE.bg1,
      }}
    >
      <div className="truncate" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT.tertiary }}>
        {label}
      </div>
      <div className="truncate" style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: TONE_FG[tone] }}>
        {typeof value === 'number' ? fmtCompact(value) : value}
      </div>
      <div className="flex items-center truncate" style={{ gap: S[2], fontSize: 10, marginTop: 2 }}>
        {delta !== undefined && delta !== null && Number.isFinite(delta) ? (
          <span style={{ color: delta > 0 ? STATUS.good : delta < 0 ? STATUS.bad : TEXT.tertiary }}>
            {fmtDelta(delta)}
          </span>
        ) : null}
        {hint ? <span style={{ color: TEXT.tertiary }} className="truncate">{hint}</span> : null}
      </div>
      {spark && spark.length > 0 ? <Spark points={spark} /> : null}
    </Comp>
  );
}

function Spark({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 64, h = 18, step = w / Math.max(points.length - 1, 1);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg className="mt-1" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} stroke="#a78bfa" strokeWidth="1" fill="none" opacity={0.9} />
    </svg>
  );
}
