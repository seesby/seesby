// components/seo-crawler/views/_shared/formatters.ts
const nf0 = new Intl.NumberFormat('en-US');
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const fmtNum = (v: unknown, fr = 0): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (fr === 1) return nf1.format(n);
  if (fr === 2) return nf2.format(n);
  return nf0.format(n);
};

export const fmtCompact = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return `${nf1.format(n / 1e9)}b`;
  if (Math.abs(n) >= 1e6) return `${nf1.format(n / 1e6)}m`;
  if (Math.abs(n) >= 1e3) return `${nf1.format(n / 1e3)}k`;
  return nf0.format(n);
};

export const fmtPct = (v: unknown, scale = 1): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${nf1.format(n * scale * 100)}%`;
};

export const fmtDelta = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '▲' : n < 0 ? '▼' : '=';
  return `${sign} ${fmtPct(Math.abs(n))}`;
};

export const fmtMs = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${nf1.format(n / 1000)}s`;
};

export const fmtBytes = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n}B`;
  if (n < 1024 ** 2) return `${nf1.format(n / 1024)}kB`;
  if (n < 1024 ** 3) return `${nf1.format(n / 1024 ** 2)}MB`;
  return `${nf1.format(n / 1024 ** 3)}GB`;
};

export const fmtUrl = (raw: string | undefined | null, max = 60): string => {
  if (!raw) return '—';
  try {
    const u = new URL(raw);
    const path = u.pathname + u.search;
    const text = `${u.hostname.replace(/^www\./, '')}${path}`;
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  } catch {
    return raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
  }
};

export const fmtDate = (v: unknown): string => {
  if (!v) return '—';
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  const diff = today.getTime() - d.getTime();
  const day = 1000 * 60 * 60 * 24;
  if (diff < day) return 'today';
  if (diff < day * 2) return 'yesterday';
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  if (diff < day * 30) return `${Math.floor(diff / (day * 7))}w ago`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))}mo ago`;
  return `${Math.floor(diff / (day * 365))}y ago`;
};
