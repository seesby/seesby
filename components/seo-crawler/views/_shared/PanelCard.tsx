import React from 'react';
import { SURFACE, TEXT, R, S } from './tokens';

/**
 * Reusable card panel used across all mode views.
 * Replaces the duplicated `CARD` / `PANEL` constants.
 */
export function PanelCard({
  title,
  children,
  className = '',
  span,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Tailwind col-span class, e.g. "col-span-12 md:col-span-6" */
  span?: string;
}) {
  return (
    <div
      className={`${span ?? ''} ${className}`}
      style={{
        borderRadius: R.md,
        border: `1px solid ${SURFACE.br1}`,
        background: SURFACE.bg1,
        padding: S[3],
        minHeight: 0,
      }}
    >
      {title && <CardHeading>{title}</CardHeading>}
      {children}
    </div>
  );
}

/** Section heading inside a card — replaces the duplicated `H` / `LABEL` components. */
export function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: TEXT.tertiary,
      marginBottom: S[2],
    }}>
      {children}
    </div>
  );
}
