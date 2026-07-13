// components/seo-crawler/views/_shared/KpiStrip.tsx
import React from 'react';
import { KpiTile, KpiTileProps } from './KpiTile';
import { SURFACE, S } from './tokens';

export function KpiStrip({
  items, cols = items.length, className,
}: {
  items: ReadonlyArray<KpiTileProps>;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gap: S[2],
        padding: `${S[2]}px ${S[3]}px`,
        borderBottom: `1px solid ${SURFACE.br0}`,
        background: SURFACE.bg1,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {items.map((it, i) => <KpiTile key={i} {...it} />)}
    </div>
  );
}
