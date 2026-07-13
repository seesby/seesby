import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function NapTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const napScore = page?.napConsistencyScore ?? page?.localNapScore ?? page?.e_local_nap_score;
  const napDetails = page?.napDetails || page?.localNapDetails || [];

  const officialName = page?.businessName ?? page?.napName ?? page?.title;
  const officialAddress = page?.businessAddress ?? page?.napAddress;
  const officialPhone = page?.businessPhone ?? page?.napPhone;

  // Build table rows: official + each directory
  const rows = [
    { source: 'Site', name: officialName, address: officialAddress, phone: officialPhone, status: 'pass', nameMatch: true, addressMatch: true, phoneMatch: true },
    ...napDetails.map((d: any) => ({
      source: d.directory || d.source || d.name || 'Unknown',
      name: d.name || officialName,
      address: d.address || officialAddress,
      phone: d.phone || officialPhone,
      status: d.nameMatch !== false && d.addressMatch !== false && d.phoneMatch !== false
        ? 'pass'
        : d.nameMatch === false || d.addressMatch === false ? 'warn' : 'fail',
      nameMatch: d.nameMatch !== false,
      addressMatch: d.addressMatch !== false,
      phoneMatch: d.phoneMatch !== false,
    })),
  ];

  // Breakdown
  const nameMatches = rows.filter(r => r.nameMatch).length;
  const addrMatches = rows.filter(r => r.addressMatch).length;
  const phoneMatches = rows.filter(r => r.phoneMatch).length;
  const exactMatches = rows.filter(r => r.status === 'pass').length;

  // Schema NAP comparison
  const schemaNap = page?.schemaNap || {};
  const schemaName = schemaNap.name || page?.schemaName;
  const schemaAddress = schemaNap.address || page?.schemaAddress;
  const schemaPhone = schemaNap.phone || page?.schemaPhone;

  // Next steps
  const nextSteps: string[] = [];
  napDetails.forEach((d: any) => {
    if (d.nameMatch === false) nextSteps.push(`Fix name on ${d.directory || d.source}`);
    if (d.addressMatch === false) nextSteps.push(`Fix address format on ${d.directory || d.source}`);
    if (d.phoneMatch === false) nextSteps.push(`Fix phone on ${d.directory || d.source}`);
  });

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Score" value={formatNumber(napScore)} good={Number(napScore) >= 80} />
        <MetricPill label="Sources" value={formatNumber(rows.length)} />
        <MetricPill label="Exact" value={`${exactMatches}/${rows.length}`} good={exactMatches === rows.length} />
        <MetricPill label="Name" value={`${nameMatches}/${rows.length}`} good={nameMatches === rows.length} />
        <MetricPill label="Address" value={`${addrMatches}/${rows.length}`} good={addrMatches === rows.length} />
      </div>

      {/* NAP consistency table */}
      <Card title="NAP Consistency">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--brand-surface-3)]">
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Source</th>
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Name</th>
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Address</th>
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Phone</th>
                <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Name</th>
                <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Addr</th>
                <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Phone</th>
                <th className="px-3 py-1.5 text-right text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                  <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-medium">{row.source}</td>
                  <td className="px-3 py-1.5 text-[var(--brand-text-mid)] truncate max-w-[120px]">{row.name || '\u2014'}</td>
                  <td className="px-3 py-1.5 text-[var(--brand-text-mid)] truncate max-w-[150px]">{row.address || '\u2014'}</td>
                  <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-mono">{row.phone || '\u2014'}</td>
                  <td className="px-3 py-1.5 text-center">
                    <StatusBadge status={row.nameMatch ? 'pass' : 'fail'} label={row.nameMatch ? '\u2713' : '\u2717'} />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <StatusBadge status={row.addressMatch ? 'pass' : 'warn'} label={row.addressMatch ? '\u2713' : '\u26A0'} />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <StatusBadge status={row.phoneMatch ? 'pass' : 'fail'} label={row.phoneMatch ? '\u2713' : '\u2717'} />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <StatusBadge
                      status={row.status === 'pass' ? 'pass' : row.status === 'warn' ? 'warn' : 'fail'}
                      label={row.status === 'pass' ? 'Exact' : row.status === 'warn' ? 'Format' : 'Mismatch'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3 text-center">
          <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-1">Name match</div>
          <div className={`text-[20px] font-black ${nameMatches === rows.length ? 'text-green-400' : 'text-orange-400'}`}>
            {nameMatches}/{rows.length}
          </div>
        </div>
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3 text-center">
          <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-1">Address match</div>
          <div className={`text-[20px] font-black ${addrMatches === rows.length ? 'text-green-400' : 'text-orange-400'}`}>
            {addrMatches}/{rows.length}
          </div>
        </div>
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3 text-center">
          <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-1">Phone match</div>
          <div className={`text-[20px] font-black ${phoneMatches === rows.length ? 'text-green-400' : 'text-orange-400'}`}>
            {phoneMatches}/{rows.length}
          </div>
        </div>
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3 text-center">
          <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-1">Exact all</div>
          <div className={`text-[20px] font-black ${exactMatches === rows.length ? 'text-green-400' : 'text-red-400'}`}>
            {exactMatches}/{rows.length}
          </div>
        </div>
      </div>

      {/* Schema NAP vs Official NAP */}
      <Card title="Schema NAP vs Official">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--brand-surface-3)]">
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Field</th>
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Official</th>
                <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Schema</th>
                <th className="px-3 py-1.5 text-center text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Match</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)]">
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">Name</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{officialName || '\u2014'}</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{schemaName || '\u2014'}</td>
                <td className="px-3 py-1.5 text-center"><StatusBadge status={schemaName === officialName ? 'pass' : 'warn'} label={schemaName === officialName ? '\u2713' : '\u26A0'} /></td>
              </tr>
              <tr className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)]">
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">Address</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{officialAddress || '\u2014'}</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{schemaAddress || '\u2014'}</td>
                <td className="px-3 py-1.5 text-center"><StatusBadge status={schemaAddress === officialAddress ? 'pass' : 'warn'} label={schemaAddress === officialAddress ? '\u2713' : '\u26A0'} /></td>
              </tr>
              <tr className="bg-[var(--brand-surface-0)]">
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">Phone</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{officialPhone || '\u2014'}</td>
                <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{schemaPhone || '\u2014'}</td>
                <td className="px-3 py-1.5 text-center"><StatusBadge status={schemaPhone === officialPhone ? 'pass' : 'warn'} label={schemaPhone === officialPhone ? '\u2713' : '\u26A0'} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trend */}
      {hasTrend && (
        <Card title="NAP Score Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={page?.napScoreTrend || []} tone="info" />
          </div>
        </Card>
      )}

      {/* Next steps */}
      {nextSteps.length > 0 && (
        <Card title="Next Steps">
          <div className="space-y-1">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 py-[3px] text-[11px]">
                <span className="text-orange-400">\u2022</span>
                <span className="text-[var(--brand-text-mid)]">{step}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
