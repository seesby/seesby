import React from 'react';
import { SURFACE, TEXT, S } from './tokens';

type ViewHeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function ViewHeader({ title, subtitle, badge, actions, className }: ViewHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2 shrink-0 ${className ?? ''}`}
      style={{
        height: 36,
        padding: `0 ${S[3]}px`,
        borderBottom: `1px solid ${SURFACE.br0}`,
        background: SURFACE.bg0,
      }}
    >
      <h2 style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{title}</h2>
      {badge}
      {subtitle && <span style={{ fontSize: 11, color: TEXT.tertiary }}>{subtitle}</span>}
      <div className="flex-1" />
      {actions}
    </div>
  );
}
