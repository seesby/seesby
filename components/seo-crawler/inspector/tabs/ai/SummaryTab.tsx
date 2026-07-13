import React from 'react';
import {
  DataRow, StatusBadge, TruncatedUrl, Card, MetricPill,
  formatNumber, getMetric, getActions,
} from '../../shared';

const TOP_BOTS = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Gemini', 'Bingbot', 'Applebot-Extended'];

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const aiIssues = actions.filter((a: any) =>
    /bot|ai|schema|llm|crawl|gpt|claude|perplexity|entity/i.test(a.label || a.title || '')
  );

  const aiReadyScore = Number(getMetric(page, 'aiReadinessScore') ?? page?.aiReadinessScore ?? 0);
  const prevScore = page?.prevAiReadinessScore;
  const scoreDelta = prevScore != null ? aiReadyScore - Number(prevScore) : null;
  const aiTone = aiReadyScore >= 70 ? 'good' : aiReadyScore >= 40 ? 'mid' : 'bad';

  const totalCitations = page?.totalCitations ?? page?.aiTotalCitations ?? 0;
  const promptCount = page?.totalPrompts ?? page?.aiPromptCount ?? 0;
  const extractableBlocks = page?.extractableBlocks ?? page?.blockCount ?? 0;
  const schemaTypes = page?.schemaTypes || page?.aiSchemaTypes || [];
  const botMatrix = page?.botAccessMatrix || page?.aiBotMatrix || {};
  const allowedBots = TOP_BOTS.filter(name =>
    botMatrix[name]?.status === 'allowed' || botMatrix[name]?.status === 'Allowed'
  ).length;

  const citedPrompts = page?.topCitedQueries || page?.aiCitedQueries || [];

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-semibold truncate">
            {getMetric(page, 'title') || page?.title || 'AI Readiness'}
          </div>
          <div className="text-[11px] text-[#555] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={aiTone === 'good' ? '#22c55e' : aiTone === 'mid' ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${(aiReadyScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{aiReadyScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="AI ready" value={formatNumber(aiReadyScore)}
          good={aiReadyScore >= 60}
          sub={scoreDelta != null ? `${scoreDelta >= 0 ? '+' : ''}${scoreDelta} vs prev` : undefined} />
        <MetricPill label="Bots allowed" value={`${allowedBots}/${TOP_BOTS.length}`}
          good={allowedBots >= TOP_BOTS.length * 0.7} />
        <MetricPill label="Citations" value={formatNumber(totalCitations)}
          good={totalCitations > 0} />
        <MetricPill label="Blocks" value={formatNumber(extractableBlocks)}
          good={extractableBlocks > 0} />
        <MetricPill label="Schema" value={`${schemaTypes.length} types`}
          good={schemaTypes.length > 0} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* URL metadata */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2.5">URL metadata</div>
          <div className="space-y-0">
            <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
            <DataRow label="Category" value={page?.category || page?.pageCategory || '\u2014'} />
            <DataRow label="Primary entity" value={page?.primaryEntity || page?.entities?.[0]?.name || '\u2014'} />
            <DataRow label="Schema" value={
              schemaTypes.length > 0
                ? schemaTypes.slice(0, 3).join(', ') + (schemaTypes.length > 3 ? ` +${schemaTypes.length - 3}` : '')
                : '\u2014'
            } />
          </div>
        </div>

        {/* Bot access */}
        <Card title="Bot access">
          <div className="space-y-0">
            {TOP_BOTS.map(name => {
              const allowed = botMatrix[name]?.status === 'allowed' || botMatrix[name]?.status === 'Allowed';
              return (
                <div key={name} className="flex items-center justify-between py-[3px] text-[11px]">
                  <span className="text-[#666]">{name}</span>
                  <StatusBadge status={allowed ? 'pass' : 'fail'} label={allowed ? 'Yes' : 'No'} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Citations */}
        <Card title="Citations">
          <DataRow label="Total" value={`${formatNumber(totalCitations)} prompts`} />
          <DataRow label="Per 1k prompts" value={
            promptCount > 0 ? ((totalCitations / promptCount) * 1000).toFixed(1) : '\u2014'
          } />
          {Object.keys(page?.citationGeo || page?.aiCitationGeo || {}).length > 0 && (
            <DataRow label="Geo" value={
              Object.entries(page?.citationGeo || page?.aiCitationGeo || {})
                .slice(0, 3)
                .map(([geo, pct], i) => `${geo} ${String(pct)}%`)
                .join(' \u00b7 ')
            } />
          )}
        </Card>

        {/* Flags */}
        <Card title="Flags">
          <FlagRow label="No FAQ schema" fail={!page?.schemaTypes?.includes('FAQPage')} />
          <FlagRow label="Author schema missing" fail={!page?.schemaTypes?.includes('Author')} />
          <FlagRow label="No llms.txt" fail={page?.llmsTxtPresent === false} />
          <FlagRow label="No citations" fail={totalCitations === 0} />
        </Card>
      </div>

      {/* Issues summary */}
      {aiIssues.length > 0 && (
        <Card title={`Issues (${aiIssues.length})`}>
          <div className="space-y-0">
            {aiIssues.slice(0, 5).map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[#111] last:border-b-0">
                <div className="mt-0.5">
                  {a.type === 'error' || a.severity === 'CRITICAL' || a.severity === 'HIGH' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : a.type === 'warning' || a.severity === 'MEDIUM' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#ccc] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[#444] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FlagRow({ label, fail }: { label: string; fail: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[#666]">{label}</span>
      <span className={`text-[10px] font-medium ${fail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {fail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}
