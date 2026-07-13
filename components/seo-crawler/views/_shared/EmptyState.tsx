import React from 'react';
import { Inbox } from 'lucide-react';
import { SURFACE, TEXT, R, S } from './tokens';

export function EmptyState({
  title, subtitle, icon, cta,
}: { title: string; subtitle?: string; icon?: React.ReactNode; cta?: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[240px]" style={{ background: SURFACE.bg0 }}>
      <div className="max-w-md text-center" style={{ padding: `0 ${S[4]}px` }}>
        <div
          className="inline-flex items-center justify-center"
          style={{
            width: 40, height: 40,
            borderRadius: R.lg,
            background: SURFACE.bg2,
            border: `1px solid ${SURFACE.br1}`,
            marginBottom: S[3],
          }}
        >
          {icon || <Inbox size={16} style={{ color: TEXT.tertiary }} />}
        </div>
        <div style={{ fontSize: 14, color: TEXT.primary, fontWeight: 600, marginBottom: S[1] }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: TEXT.tertiary, lineHeight: 1.6 }}>{subtitle}</div>}
        {cta && <div style={{ marginTop: S[4] }}>{cta}</div>}
      </div>
    </div>
  );
}
