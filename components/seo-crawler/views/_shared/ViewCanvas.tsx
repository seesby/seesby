import React from 'react';
import clsx from 'clsx';
import { SURFACE, TEXT, R, S } from './tokens';

type ViewCanvasProps = {
  children: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
  loading?: boolean;
  loadingFallback?: React.ReactNode;
  error?: Error | null;
  errorFallback?: React.ReactNode;
  isEmpty?: boolean;
};

export function ViewCanvas({
  children, className, empty, loading, loadingFallback, error, errorFallback, isEmpty,
}: ViewCanvasProps) {
  if (error) return <>{errorFallback ?? <DefaultError error={error} />}</>;
  if (loading) return <>{loadingFallback ?? <DefaultLoading />}</>;
  if (isEmpty && empty) return <>{empty}</>;
  return (
    <div
      className={clsx('flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden', className)}
      style={{ background: SURFACE.bg0, color: TEXT.primary }}
    >
      {children}
    </div>
  );
}

function DefaultLoading() {
  return (
    <div className="flex-1 grid place-items-center animate-pulse" style={{ fontSize: 12, color: TEXT.tertiary }}>
      Loading...
    </div>
  );
}

function DefaultError({ error }: { error: Error }) {
  return (
    <div className="flex-1 grid place-items-center" style={{ padding: S[6] }}>
      <div className="max-w-md text-center">
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT.primary, marginBottom: 4 }}>Could not load this view.</div>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>{error.message}</div>
      </div>
    </div>
  );
}
