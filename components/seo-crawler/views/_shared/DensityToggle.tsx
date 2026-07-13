import React from 'react';
import { useDensity } from '../_hooks/useDensity';
import { SURFACE, TEXT, R, S } from './tokens';

const LABELS = { compact: '1', comfy: '2', cozy: '3' } as const;

export function DensityToggle() {
  const [density, setDensity] = useDensity();
  const next = density === 'compact' ? 'comfy' : density === 'comfy' ? 'cozy' : 'compact';
  return (
    <button
      onClick={() => setDensity(next)}
      title={`Density: ${density}`}
      style={{
        height: 28,
        padding: `0 ${S[2]}px`,
        fontSize: 11,
        color: TEXT.secondary,
        border: `1px solid ${SURFACE.br1}`,
        borderRadius: R.sm,
        background: SURFACE.bg1,
        display: 'flex',
        alignItems: 'center',
        gap: S[1],
      }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{LABELS[density]}</span>
      <span style={{ color: TEXT.tertiary }}>{density}</span>
    </button>
  );
}
