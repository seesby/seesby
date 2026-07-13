import React from 'react';
import {
  StatusBadge, Card, MetricPill,
  formatNumber,
} from '../../shared';

export default function KwOverlapTab({ page }: { page: any; hasTrend?: boolean }) {
  const topic = page?.topic || page?.query || page?.keyword || '';
  const sharedKws = page?.sharedKeywordsList || page?.competitorSharedKeywords || [];
  const theirUnique = page?.theirUniqueKeywords || page?.competitorUniqueKeywords || [];
  const competitors = page?.competitors || page?.competitorRankings || [];
  const ourUnique = page?.ourUniqueKeywords || page?.ownUniqueKeywords || [];

  // Compute metrics
  const gapCount = sharedKws.filter((kw: any) => {
    const ourPos = kw.ourPosition ?? kw.ourPos ?? null;
    const theirPos = kw.theirPosition ?? kw.theirPos ?? null;
    return ourPos !== null && theirPos !== null && ourPos - theirPos >= 5;
  }).length;
  const missCount = sharedKws.filter((kw: any) => (kw.ourPosition ?? kw.ourPos ?? null) === null).length;

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Shared" value={formatNumber(sharedKws.length)} />
        <MetricPill label="Their Unique" value={formatNumber(theirUnique.length)} />
        <MetricPill label="Our Unique" value={formatNumber(ourUnique.length)} />
        <MetricPill label="Gaps" value={formatNumber(gapCount)} good={gapCount === 0} />
        <MetricPill label="Misses" value={formatNumber(missCount)} good={missCount === 0} />
      </div>

      {/* Shared queries table */}
      <Card title={`Shared queries for topic "${topic || '...'}"`}>
        {sharedKws.length > 0 ? (
          <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-3 py-2 text-left text-[#555] uppercase tracking-widest font-bold">Query</th>
                  <th className="px-3 py-2 text-center text-[#555] uppercase tracking-widest font-bold">Us</th>
                  {competitors.slice(0, 3).map((comp: any, i: number) => (
                    <th key={i} className="px-3 py-2 text-center text-[#555] uppercase tracking-widest font-bold">
                      {comp.domain || comp.name || `Comp ${i + 1}`}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-[#555] uppercase tracking-widest font-bold">Vol</th>
                  <th className="px-3 py-2 text-center text-[#555] uppercase tracking-widest font-bold">Intent</th>
                  <th className="px-3 py-2 text-center text-[#555] uppercase tracking-widest font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sharedKws.slice(0, 20).map((kw: any, i: number) => {
                  const query = typeof kw === 'string' ? kw : kw.keyword || kw.query || '';
                  const ourPos = kw.ourPosition ?? kw.ourPos ?? null;
                  const theirPositions = kw.competitorPositions || kw.theirPositions || [];
                  const vol = kw.volume || kw.searchVolume || null;
                  const intent = kw.intent || kw.searchIntent || '';
                  const theirPos = kw.theirPosition ?? kw.theirPos ?? (theirPositions[0] ?? null);

                  let status: { label: string; type: 'pass' | 'warn' | 'fail' | 'info' } = { label: 'ok', type: 'pass' };
                  if (ourPos === null) {
                    status = { label: 'miss', type: 'fail' };
                  } else if (theirPos && ourPos - theirPos >= 5) {
                    status = { label: 'gap', type: 'warn' };
                  }

                  return (
                    <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                      <td className="px-3 py-2 text-[#ccc] truncate max-w-[200px]">{query}</td>
                      <td className="px-3 py-2 text-center text-green-400">{ourPos ?? '\u2014'}</td>
                      {competitors.slice(0, 3).map((comp: any, j: number) => {
                        const pos = theirPositions[j] ?? (j === 0 ? theirPos : null);
                        return (
                          <td key={j} className="px-3 py-2 text-center text-orange-400">{pos ?? '\u2014'}</td>
                        );
                      })}
                      <td className="px-3 py-2 text-right text-[#888]">{vol ? formatNumber(vol) : '\u2014'}</td>
                      <td className="px-3 py-2 text-center text-[#666]">{intent || '\u2014'}</td>
                      <td className="px-3 py-2 text-center">
                        <StatusBadge status={status.type} label={status.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-[12px] text-[#666] py-3">No shared queries found.</div>
        )}
      </Card>

      {/* Their unique winners */}
      {theirUnique.length > 0 && (
        <Card title="Their unique winners (we don't rank)">
          <div className="flex flex-wrap gap-2">
            {theirUnique.slice(0, 20).map((kw: any, i: number) => {
              const keyword = typeof kw === 'string' ? kw : kw.keyword || kw.query || '';
              return (
                <StatusBadge key={i} status="info" label={keyword} />
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
