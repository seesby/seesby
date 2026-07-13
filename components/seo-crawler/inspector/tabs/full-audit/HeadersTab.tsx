import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, getMetric,
} from '../../shared';

export default function HeadersTab({ page }: { page: any; hasTrend?: boolean }) {
  const headers: Array<[string, string]> = Array.isArray(page?.responseHeaders)
    ? page.responseHeaders
    : page?.headers
      ? Object.entries(page.headers)
      : [];
  const redirects: string[] = Array.isArray(page?.redirects) ? page.redirects
    : page?.redirectChain ? page.redirectChain : [];
  const redirectCodes: number[] = Array.isArray(page?.redirectStatusCodes) ? page.redirectStatusCodes : [];

  const status = Number(getMetric(page, 'statusCode') || page?.statusCode || 0);
  const cacheControl = headers.find(([k]) => k.toLowerCase() === 'cache-control')?.[1] || '';
  const etag = headers.find(([k]) => k.toLowerCase() === 'etag')?.[1] || '';
  const vary = headers.find(([k]) => k.toLowerCase() === 'vary')?.[1] || '';
  const hsts = headers.find(([k]) => k.toLowerCase() === 'strict-transport-security')?.[1];
  const csp = headers.find(([k]) => k.toLowerCase() === 'content-security-policy')?.[1];
  const xFrame = headers.find(([k]) => k.toLowerCase() === 'x-frame-options')?.[1];
  const xContentType = headers.find(([k]) => k.toLowerCase() === 'x-content-type-options')?.[1];
  const referrer = headers.find(([k]) => k.toLowerCase() === 'referrer-policy')?.[1];
  const permissions = headers.find(([k]) => k.toLowerCase() === 'permissions-policy')?.[1];

  const sslValid = getMetric(page, 'sslValid') ?? page?.sslValid;
  const xRobotsNoindex = getMetric(page, 'xRobotsNoindex') ?? page?.xRobotsNoindex;
  const xRobotsNofollow = getMetric(page, 'xRobotsNofollow') ?? page?.xRobotsNofollow;
  const hasViewport = getMetric(page, 'hasViewportMeta') ?? page?.hasViewportMeta;

  return (
    <div className="space-y-4">
      {/* Status strip */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Status" value={String(status)} good={status >= 200 && status < 400} />
        <MetricPill label="SSL" value={sslValid === true ? 'Valid' : sslValid === false ? 'Invalid' : '\u2014'} good={sslValid === true} />
        <MetricPill label="Redirects" value={String(redirects.length)} good={redirects.length === 0} />
        <MetricPill label="Security" value={`${[hsts, csp, xFrame, xContentType].filter(Boolean).length}/4`} good={!!hsts && !!csp} />
      </div>

      {/* Headers */}
      {headers.length > 0 && (
        <Card title={`Response headers (${headers.length})`}>
          <div className="bg-[#060606] border border-[#1a1a1a] rounded-lg overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {headers.map(([k, v], i) => (
                  <tr key={k} className={`border-b border-[#111] ${i % 2 === 0 ? '' : 'bg-[#0a0a0a]'} hover:bg-[#141414]`}>
                    <td className="px-3 py-1.5 text-[#F59E0B]/80 w-[180px]">{k}</td>
                    <td className="px-3 py-1.5 text-[#888] break-all">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 space-y-0">
            <DataRow label="Content-Length" value={headers.find(([k]) => k.toLowerCase() === 'content-length')?.[1] || '\u2014'} mono />
            <DataRow label="Cache-Control" value={cacheControl || '\u2014'} mono />
            <DataRow label="ETag" value={etag || '\u2014'} mono />
            <DataRow label="Vary" value={vary || '\u2014'} />
          </div>
        </Card>
      )}

      {/* Security */}
      <Card title="Security headers">
        <DataRow label="HSTS" value={hsts ? 'Present' : 'Missing'} status={hsts ? 'pass' : 'warn'} />
        <DataRow label="CSP" value={csp ? 'Present' : 'Missing'} status={csp ? 'pass' : 'warn'} />
        <DataRow label="X-Frame-Options" value={xFrame || 'Missing'} status={xFrame ? 'pass' : 'info'} />
        <DataRow label="X-Content-Type" value={xContentType || 'Missing'} status={xContentType ? 'pass' : 'info'} />
        <DataRow label="Referrer-Policy" value={referrer || 'Missing'} status={referrer ? 'pass' : 'info'} />
        <DataRow label="Permissions-Policy" value={permissions ? 'Set' : 'Missing'} status={permissions ? 'pass' : 'info'} />
      </Card>

      {/* Robots & directives */}
      <Card title="Robots & directives">
        <DataRow label="X-Robots noindex" value={xRobotsNoindex ? 'Yes' : 'No'} status={xRobotsNoindex ? 'fail' : 'pass'} />
        <DataRow label="X-Robots nofollow" value={xRobotsNofollow ? 'Yes' : 'No'} status={xRobotsNofollow ? 'warn' : 'pass'} />
        <DataRow label="Viewport meta" value={hasViewport ? 'Present' : 'Missing'} status={hasViewport ? 'pass' : 'warn'} />
      </Card>

      {/* Redirect chain */}
      {redirects.length > 0 && (
        <Card title={`Redirect chain (${redirects.length} hops)`}>
          <div className="space-y-1">
            {redirects.map((u, i) => {
              const code = redirectCodes[i] || (i < redirects.length - 1 ? 301 : status);
              const codeColor = code >= 300 && code < 400 ? 'text-[#f59e0b]' : code >= 400 ? 'text-[#ef4444]' : 'text-[#22c55e]';
              return (
                <div key={`${u}-${i}`} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-[#333] w-[20px] shrink-0">#{i + 1}</span>
                  <span className="text-[#888] truncate flex-1">{u}</span>
                  <span className={`text-[10px] shrink-0 ${codeColor}`}>{code}</span>
                </div>
              );
            })}
            <div className="text-[10px] text-[#444] mt-2 pt-2 border-t border-[#1a1a1a]">
              Final: <span className="text-[#888]">{redirects[redirects.length - 1]}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
