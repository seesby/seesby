import React from 'react';
import { Card, formatNumber } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

const BOT_LABELS: Record<string, string> = {
  gptbot: 'GPTBot',
  perplexitybot: 'PerplexityBot',
  claudebot: 'ClaudeBot',
};

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  if (!hasTrend) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[#666] max-w-[280px]">
          Trend data available after 2+ crawls. Run another crawl to see historical trends.
        </div>
      </div>
    );
  }

  // Citation share over 12w
  const citationTrend = page?.citationTrend || page?.aiCitationTrend || [];
  const prevCitations = page?.prevTotalCitations ?? 0;
  const currCitations = page?.totalCitations ?? 0;
  const citationDelta = currCitations - prevCitations;

  // Bot hits per week
  const botHitsTrend = page?.botHitsTrend || page?.aiBotHitsTrend || {};
  const botKeys = Object.keys(botHitsTrend).length > 0
    ? Object.keys(botHitsTrend)
    : ['gptbot', 'perplexitybot', 'claudebot'];

  // Events
  const events = page?.events || page?.aiEvents || buildEvents(page);

  return (
    <div className="space-y-4">
      {/* Citation share over 12w */}
      <Card title="Citation share over 12w">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-[13px] font-bold text-white">{formatNumber(currCitations)}</span>
            <span className={`text-[11px] ${citationDelta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {citationDelta >= 0 ? '+' : ''}{citationDelta} vs prev
            </span>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <Sparkline values={citationTrend} tone="info" />
          </div>
        </div>
      </Card>

      {/* Bot hits per week */}
      <Card title="Bot hits per week">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {botKeys.map(botKey => {
            const label = BOT_LABELS[botKey.toLowerCase()] || botKey;
            const trend = botHitsTrend[botKey] || [];
            return (
              <div key={botKey} className="space-y-1">
                <div className="text-[11px] text-[#888]">{label}</div>
                <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                  <Sparkline values={trend} tone="info" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Events */}
      {events.length > 0 && (
        <Card title="Events">
          <div className="space-y-2">
            {events.map((event: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  event.type === 'schema' ? 'bg-[#3b82f6]' :
                  event.type === 'bot' ? 'bg-[#f59e0b]' :
                  event.type === 'citation' ? 'bg-[#22c55e]' :
                  'bg-[#555]'
                }`} />
                <div className="min-w-0">
                  <span className="text-[#ccc]">{event.label}</span>
                  {event.date && <span className="text-[#555] ml-1">{event.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function buildEvents(page: any) {
  const events: Array<{ type: string; label: string; date?: string }> = [];

  if (page?.schemaChanged) {
    events.push({ type: 'schema', label: 'Schema types changed', date: page?.schemaChangedDate });
  }
  if (page?.botAccessChanged) {
    events.push({ type: 'bot', label: 'Bot access changed', date: page?.botAccessChangedDate });
  }
  if (page?.citationJump) {
    events.push({ type: 'citation', label: 'Citation count changed', date: page?.citationJumpDate });
  }

  return events;
}
