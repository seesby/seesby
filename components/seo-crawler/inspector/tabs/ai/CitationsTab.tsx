import React from 'react';
import { Card, formatNumber } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

const MODEL_LABELS: Record<string, string> = {
  gpt: 'GPT-5',
  gpt5: 'GPT-5',
  gpt4: 'GPT-4',
  sonnet: 'Sonnet',
  claude: 'Sonnet',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

export default function CitationsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const totalCitations = page?.totalCitations ?? page?.aiTotalCitations ?? 0;
  const notCitedCount = page?.notCitedPrompts ?? page?.aiNotCitedPrompts ?? 0;
  const citedByGeo = page?.citedByAllGeos ?? true;
  const citationRankAvg = page?.citationRankAvg ?? page?.aiCitationRankAvg ?? null;

  // Per-model data
  const modelData = page?.citationByModel || page?.aiCitationByModel || buildModelData(page);

  // Geo variation
  const geoVariation = page?.citationGeo || page?.aiCitationGeo || {};

  // Shared citations
  const sharedCitations = page?.sharedCitations || page?.aiSharedCitations || [];

  // Citation trend
  const citationTrend = page?.citationTrend || page?.aiCitationTrend || [];

  return (
    <div className="space-y-4">
      {/* Top row: Summary + Per model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Summary */}
        <Card title="Summary">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]">Cited in</span>
              <span className="text-[var(--brand-text-strong)] font-bold">{formatNumber(totalCitations)} prompts</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]">Not cited</span>
              <span className={notCitedCount > 0 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]'}>
                {formatNumber(notCitedCount)}
                {notCitedCount > 0 && ' \u26a0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]">Cited by &ge;1</span>
              <span className="text-[var(--brand-text-strong)]">{citedByGeo ? '100% geos' : '\u2014'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]">Citation rank avg</span>
              <span className="text-[var(--brand-text-strong)]">{citationRankAvg != null ? Number(citationRankAvg).toFixed(1) : '\u2014'}</span>
            </div>
          </div>
        </Card>

        {/* Per model */}
        <div className="lg:col-span-2">
          <Card title="Per model">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--brand-surface-3)]">
                    <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Model</th>
                    <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Cited</th>
                    <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Position avg</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)] uppercase tracking-widest font-bold">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {modelData.map((model: any) => (
                    <tr key={model.name} className="border-b border-[var(--brand-surface-2)] hover:bg-[var(--brand-surface-2)]">
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)]">{model.label}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-strong)]">{model.cited}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-strong)]">{model.positionAvg != null ? model.positionAvg.toFixed(1) : '\u2014'}</td>
                      <td className="px-2 py-1.5 text-center">
                        {model.answerAvailable != null ? (
                          <span className={model.answerAvailable ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {model.answerAvailable ? '\u2713' : '\u2717'}
                          </span>
                        ) : (
                          <span className="text-[var(--brand-text-faint)]">&mdash;</span>
                        )}
                        {model.answerLength != null && (
                          <span className="text-[var(--brand-text-mid)] ml-1">/ {model.answerLength} words</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row: Geo variation + Shared citations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Geo variation */}
        <Card title="Geo variation">
          {Object.keys(geoVariation).length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {Object.entries(geoVariation).map(([geo, pct]) => (
                <div key={geo} className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[var(--brand-text-strong)] font-bold">{geo}</span>
                  <span className="text-[var(--brand-text-mid)]">{String(pct)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No geo data</div>
          )}
        </Card>

        {/* Shared citations with */}
        <Card title="Shared citations with">
          {sharedCitations.length > 0 ? (
            <div className="text-[11px] text-[var(--brand-text-mid)]">
              {sharedCitations.map((item: any, i: number) => (
                <span key={i}>
                  {i > 0 && ' \u00b7 '}
                  {typeof item === 'string' ? item : item.domain || item.url}
                  {typeof item === 'object' && item.count != null && (
                    <span className="text-[var(--brand-text-faint)]"> {item.count} times</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No shared citation data</div>
          )}
        </Card>
      </div>

      {/* Citation trend */}
      {hasTrend && citationTrend.length > 0 && (
        <Card title="Citation trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={citationTrend} tone="info" />
          </div>
        </Card>
      )}
    </div>
  );
}

function buildModelData(page: any) {
  const models = [
    { key: 'gpt', name: 'gpt', label: 'GPT-5' },
    { key: 'sonnet', name: 'sonnet', label: 'Sonnet' },
    { key: 'perplexity', name: 'perplexity', label: 'Perplexity' },
    { key: 'gemini', name: 'gemini', label: 'Gemini' },
  ];

  return models.map(m => ({
    ...m,
    cited: page?.[`${m.key}Citations`] ?? page?.citationEngines?.[m.key] ?? 0,
    positionAvg: page?.[`${m.key}AvgPosition`] ?? page?.citationByModel?.[m.key]?.positionAvg ?? null,
    answerAvailable: page?.[`${m.key}AnswerAvailable`] ?? page?.citationByModel?.[m.key]?.answerAvailable ?? null,
    answerLength: page?.[`${m.key}AnswerLength`] ?? page?.citationByModel?.[m.key]?.answerLength ?? null,
  }));
}
