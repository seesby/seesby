import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';

export default function SecurityTab({ page }: { page: any }) {
  const isHttps = String(page?.url || '').startsWith('https://');
  const hsts = page?.hasHsts || page?.hsts || false;
  const hstsMaxAge = page?.hstsMaxAge || page?.strictTransportSecurity || '';
  const csp = page?.hasCsp || page?.contentSecurityPolicy || false;
  const cspType = page?.cspType || (csp ? (page?.cspNonce ? 'nonce-based' : 'present') : 'missing');
  const xFrame = page?.xFrameOptions || page?.xFrameOptionsHeader || '';
  const referrerPolicy = page?.referrerPolicy || page?.referrerPolicyHeader || '';
  const xContentType = page?.xContentTypeOptions || page?.xContentTypeOptionsHeader || '';
  const mixedContent = page?.mixedContent || false;
  const tlsVersion = page?.sslProtocol || page?.tlsVersion || '';
  const sslValid = page?.sslValid;
  const sslExpiry = page?.sslExpiryDate || '';
  const sslExpiringSoon = page?.sslIsExpiringSoon || false;
  const exposedApiKeys = Number(page?.exposedApiKeys || 0);

  const securityHeaders = [
    { name: 'HSTS', present: !!hsts },
    { name: 'CSP', present: cspType !== 'missing' },
    { name: 'X-Frame-Options', present: !!xFrame },
    { name: 'Referrer-Policy', present: !!referrerPolicy },
    { name: 'X-Content-Type-Options', present: !!xContentType },
  ];
  const headersPresent = securityHeaders.filter((h) => h.present).length;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="HTTPS" value={isHttps ? 'Yes' : 'No'} good={isHttps} />
        <MetricPill label="SSL" value={sslValid === true ? 'Valid' : sslValid === false ? 'Invalid' : '—'} good={sslValid === true} />
        <MetricPill label="Headers" value={`${headersPresent}/5`} good={headersPresent >= 4} />
        <MetricPill label="Mixed Content" value={mixedContent ? 'Yes' : 'No'} good={!mixedContent} />
      </div>

      {/* Security headers table */}
      <Card title="Security headers">
        <div className="bg-[#060606] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-3 py-2 text-left text-[#444] uppercase tracking-widest text-[9px] font-bold">Header</th>
                <th className="px-3 py-2 text-left text-[#444] uppercase tracking-widest text-[9px] font-bold">Value</th>
                <th className="px-3 py-2 text-left text-[#444] uppercase tracking-widest text-[9px] font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Strict-Transport-Security', value: hstsMaxAge || (hsts ? 'Set' : null), present: !!hsts },
                { name: 'Content-Security-Policy', value: csp ? 'Set' : null, present: cspType !== 'missing' },
                { name: 'X-Frame-Options', value: xFrame || null, present: !!xFrame },
                { name: 'Referrer-Policy', value: referrerPolicy || null, present: !!referrerPolicy },
                { name: 'X-Content-Type-Options', value: xContentType || null, present: !!xContentType },
                { name: 'Permissions-Policy', value: page?.permissionsPolicy || null, present: !!page?.permissionsPolicy },
                { name: 'X-XSS-Protection', value: page?.xXssProtection || null, present: !!page?.xXssProtection },
              ].map((h, i) => (
                <tr key={h.name} className={`border-b border-[#111] ${i % 2 === 0 ? '' : 'bg-[#0a0a0a]'} hover:bg-[#141414]`}>
                  <td className="px-3 py-1.5 text-[#F59E0B]/80">{h.name}</td>
                  <td className="px-3 py-1.5 text-[#888] break-all">{h.value || '(missing)'}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge status={h.present ? 'pass' : 'warn'} label={h.present ? 'OK' : 'Missing'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {/* SSL */}
        <Card title="SSL & certificate">
          <DataRow label="HTTPS" value={isHttps ? 'Yes' : 'No'} status={isHttps ? 'pass' : 'fail'} />
          <DataRow label="SSL valid" value={sslValid === true ? 'Yes' : sslValid === false ? 'No' : '—'} status={sslValid === false ? 'fail' : 'pass'} />
          <DataRow label="TLS version" value={tlsVersion || '—'} status={tlsVersion && /1\.[23]/.test(tlsVersion) ? 'pass' : 'warn'} />
          <DataRow label="Certificate expiry" value={sslExpiry || '—'} status={sslExpiringSoon ? 'warn' : 'pass'} />
          <DataRow label="HSTS" value={hsts ? 'Enabled' : 'Disabled'} status={hsts ? 'pass' : 'warn'} />
        </Card>

        {/* Additional */}
        <Card title="Additional security">
          <DataRow label="Mixed content" value={mixedContent ? 'Detected' : 'None found'} status={mixedContent ? 'fail' : 'pass'} />
          <DataRow label="Exposed API keys" value={formatNumber(exposedApiKeys)} status={exposedApiKeys > 0 ? 'fail' : 'pass'} />
          <DataRow label="Server header" value={page?.serverHeader || '—'} />
          <DataRow label="X-Powered-By" value={page?.xPoweredBy || '—'} />
          <DataRow label="Cookie security" value={page?.cookieSecure ? 'Secure' : page?.cookies ? 'Not Secure' : '—'} />
        </Card>
      </div>
    </div>
  );
}
