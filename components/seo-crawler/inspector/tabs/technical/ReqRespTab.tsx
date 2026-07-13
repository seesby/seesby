import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatDuration, formatBytes, getMetric,
} from '../../shared';
import CollapseGroup from '../full-audit/CollapseGroup';

export default function ReqRespTab({ page }: { page: any }) {
  const statusCode = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const redirectChain = Array.isArray(page?.redirectChain) ? page.redirectChain : [];
  const redirects = redirectChain.length || Number(page?.redirectCount || 0);

  const responseHeaders: Record<string, string> = page?.responseHeaders || {};
  const headers: Array<[string, string]> = Array.isArray(page?.responseHeaders)
    ? page.responseHeaders
    : page?.headers
      ? Object.entries(page.headers)
      : Object.entries(responseHeaders);

  const cacheControl = headers.find(([k]) => k.toLowerCase() === 'cache-control')?.[1] || '';
  const etag = headers.find(([k]) => k.toLowerCase() === 'etag')?.[1] || '';
  const lastModified = headers.find(([k]) => k.toLowerCase() === 'last-modified')?.[1] || '';
  const contentType = headers.find(([k]) => k.toLowerCase() === 'content-type')?.[1] || '';
  const contentEncoding = headers.find(([k]) => k.toLowerCase() === 'content-encoding')?.[1] || '';
  const vary = headers.find(([k]) => k.toLowerCase() === 'vary')?.[1] || '';
  const server = headers.find(([k]) => k.toLowerCase() === 'server')?.[1] || '';
  const xPoweredBy = headers.find(([k]) => k.toLowerCase() === 'x-powered-by')?.[1] || '';

  const httpVersion = page?.httpVersion || '—';
  const tlsVersion = page?.sslProtocol || page?.tlsVersion || '';

  const cookies = Array.isArray(page?.cookies) ? page.cookies : [];

  return (
    <div className="space-y-4">
      {/* Status strip */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Status" value={String(statusCode || '—')} good={statusCode >= 200 && statusCode < 400} />
        <MetricPill label="Redirects" value={String(redirects)} good={redirects === 0} />
        <MetricPill label="HTTP" value={httpVersion} good={httpVersion !== '—'} />
        <MetricPill label="TLS" value={tlsVersion || '—'} good={/1\.[23]/.test(tlsVersion)} />
      </div>

      {/* Request + Response side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Card title="Request">
          <DataRow label="Method" value={page?.requestMethod || 'GET'} />
          <DataRow label="URL" value={page?.url || '—'} mono />
          <DataRow label="User-Agent" value={page?.userAgent || '—'} mono />
          <DataRow label="Accept" value={page?.requestHeaders?.accept || '—'} />
          <DataRow label="Accept-Encoding" value={page?.requestHeaders?.['accept-encoding'] || '—'} />
        </Card>

        <Card title="Response headers">
          <DataRow label="Content-Type" value={contentType || '—'} />
          <DataRow label="Content-Encoding" value={contentEncoding || '—'} />
          <DataRow label="Content-Length" value={formatBytes(page?.contentLength)} />
          <DataRow label="Vary" value={vary || '—'} />
          <DataRow label="Server" value={server || '—'} />
          <DataRow label="X-Powered-By" value={xPoweredBy || '—'} />
        </Card>
      </div>

      {/* Cache */}
      <Card title="Cache">
        <DataRow label="Cache-Control" value={cacheControl || 'Missing'} status={cacheControl ? 'pass' : 'warn'} />
        <DataRow label="ETag" value={etag || 'Missing'} status={etag ? 'pass' : 'warn'} />
        <DataRow label="Last-Modified" value={lastModified || 'Missing'} status={lastModified ? 'pass' : 'warn'} />
        <DataRow label="Expires" value={headers.find(([k]) => k.toLowerCase() === 'expires')?.[1] || '—'} />
      </Card>

      {/* Redirect chain */}
      {redirects > 0 && (
        <Card title={`Redirect chain (${redirects} hops)`}>
          <div className="space-y-1">
            {redirectChain.map((r: any, i: number) => {
              const url = typeof r === 'string' ? r : r?.url || r?.redirectUrl || '—';
              const code = typeof r === 'object' ? (r?.statusCode || r?.status || 301) : 301;
              const codeColor = code >= 300 && code < 400 ? 'text-[#f59e0b]' : code >= 400 ? 'text-[#ef4444]' : 'text-[#22c55e]';
              return (
                <div key={`${url}-${i}`} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-[var(--brand-surface-4)] w-[20px] shrink-0">#{i + 1}</span>
                  <span className="text-[var(--brand-text-mid)] truncate flex-1">{url}</span>
                  <span className={`text-[10px] shrink-0 ${codeColor}`}>{code}</span>
                </div>
              );
            })}
            {redirectChain.length === 0 && page?.redirectUrl && (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-[var(--brand-surface-4)] w-[20px] shrink-0">#1</span>
                <span className="text-[var(--brand-text-mid)] truncate flex-1">{page.redirectUrl}</span>
                <span className="text-[10px] shrink-0 text-[#f59e0b]">{page?.redirectStatusCode || 301}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Cookies */}
      {cookies.length > 0 && (
        <Card title={`Cookies (${cookies.length})`}>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Name</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Domain</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Secure</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">HttpOnly</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((c: any, i: number) => (
                  <tr key={i} className={`border-b border-[var(--brand-surface-2)] ${i % 2 === 0 ? '' : 'bg-[var(--brand-surface-0)]'} hover:bg-[var(--brand-surface-2)]`}>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-mono">{c?.name || '—'}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{c?.domain || '—'}</td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={c?.secure ? 'pass' : 'warn'} label={c?.secure ? 'Yes' : 'No'} />
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={c?.httpOnly ? 'pass' : 'warn'} label={c?.httpOnly ? 'Yes' : 'No'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
