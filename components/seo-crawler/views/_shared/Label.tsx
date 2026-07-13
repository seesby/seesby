import React from 'react';
import { TEXT, S } from './tokens';

/**
 * Section heading inside a card.
 * Replaces the duplicated `H` / `LABEL` components across 8+ view files.
 */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT.tertiary, marginBottom: S[2] }}
    >
      {children}
    </div>
  );
}
