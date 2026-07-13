import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatDate,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const history = Array.isArray(page?.crawlSessions) ? page.crawlSessions : [];
  const wordCount = Number(page?.wordCount || 0);
  const fleschScore = Number(page?.fleschScore || 0);

  if (!hasTrend && history.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-[#222] rounded p-8 text-center">
        <div className="text-[14px] text-white font-semibold mb-2">Trend data available after 2+ crawls</div>
        <div className="text-[12px] text-[#666]">Run additional crawls to see content trends and historical changes.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} />
        <MetricPill label="Flesch" value={fleschScore > 0 ? `${fleschScore}` : '—'} />
        <MetricPill label="Crawls" value={formatNumber(history.length)} />
        <MetricPill label="Quality" value={formatNumber(page?.contentQualityScore)} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Edits timeline */}
        <Card title="Edits timeline">
          {history.length === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No edit history available.</div>
          ) : (
            <div className="space-y-0">
              {history.slice(0, 8).map((session: any, i: number) => {
                const date = session?.date || session?.crawlDate || session?.timestamp || '';
                const wc = Number(session?.wordCount || 0);
                const prevWc = i < history.length - 1 ? Number(history[i + 1]?.wordCount || 0) : 0;
                const wcDelta = wc - prevWc;
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#111] last:border-b-0">
                    <span className="text-[10px] text-[#555] w-[70px] shrink-0">{formatDate(date)}</span>
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                    <span className="text-[11px] text-[#ccc] flex-1">
                      Crawl {history.length - i}
                      {wcDelta !== 0 && (
                        <span className={`ml-1 text-[10px] font-mono ${wcDelta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {wcDelta > 0 ? '+' : ''}{wcDelta}w
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Word count over time */}
        <Card title="Word count over time">
          {hasTrend ? (
            <Sparkline values={seriesOf(page, 'wordCount')} tone="info" />
          ) : (
            <div className="text-[11px] text-[#444] py-2">No trend data available.</div>
          )}
        </Card>

        {/* Readability over time */}
        <Card title="Readability over time">
          {hasTrend ? (
            <Sparkline values={seriesOf(page, 'fleschScore')} tone="info" />
          ) : (
            <div className="text-[11px] text-[#444] py-2">No trend data available.</div>
          )}
        </Card>

        {/* Quality over time */}
        <Card title="Quality over time">
          {hasTrend ? (
            <Sparkline values={seriesOf(page, 'contentQualityScore')} tone="info" />
          ) : (
            <div className="text-[11px] text-[#444] py-2">No trend data available.</div>
          )}
        </Card>
      </div>

      {/* Crawl history */}
      {history.length > 0 && (
        <Card title={`Crawl history (${history.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Date</th>
                  <th className="text-right text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Words</th>
                  <th className="text-right text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Flesch</th>
                  <th className="text-right text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Quality</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session: any, i: number) => (
                  <tr key={i} className="border-b border-[#111] last:border-b-0">
                    <td className="py-1.5 text-[#ccc]">{formatDate(session?.date || session?.crawlDate)}</td>
                    <td className="py-1.5 text-[#666] text-right font-mono">{formatNumber(session?.wordCount)}</td>
                    <td className="py-1.5 text-[#666] text-right font-mono">{session?.fleschScore || '—'}</td>
                    <td className="py-1.5 text-[#666] text-right font-mono">{session?.contentQualityScore || '—'}</td>
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
