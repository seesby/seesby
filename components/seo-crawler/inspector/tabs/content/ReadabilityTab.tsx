import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function ReadabilityTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const wordCount = Number(page?.wordCount || 0);
  const fleschScore = Number(page?.fleschScore || 0);
  const fleschGrade = Number(page?.fleschKincaidGrade || 0);
  const sentenceCount = Number(page?.sentenceCount || 0);
  const avgWordsPerSentence = Number(page?.avgWordsPerSentence || 0) || (sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0);
  const complexWordPercent = Number(page?.complexWordPercent || 0);
  const textRatio = Number(page?.textRatio || 0);
  const readingTimeMin = Math.max(1, Math.round(wordCount / 238));
  const passiveVoicePercent = Number(page?.passiveVoicePercent || 0);
  const contentDecay = page?.contentDecayRisk || '—';
  const isLosingTraffic = page?.isLosingTraffic || false;

  const clusterAvgFlesch = Number(page?.clusterAvgFlesch || 0);
  const benchmarkFlesch = 60;

  const fleschLabel = fleschScore >= 60 ? 'Easy' : fleschScore >= 40 ? 'Standard' : fleschScore > 0 ? 'Difficult' : '—';
  const fleschTone = fleschScore >= 60 ? 'pass' : fleschScore >= 40 ? 'info' : 'warn';
  const thinContent = wordCount > 0 && wordCount < 300;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Flesch" value={fleschScore > 0 ? `${fleschScore}` : '—'} good={fleschScore >= 60} sub={fleschLabel} />
        <MetricPill label="Grade" value={fleschGrade > 0 ? `${fleschGrade.toFixed(1)}` : '—'} good={fleschGrade <= 8} />
        <MetricPill label="Read time" value={`${readingTimeMin} min`} />
        <MetricPill label="Passive" value={passiveVoicePercent > 0 ? `${passiveVoicePercent.toFixed(0)}%` : '—'} good={passiveVoicePercent <= 10} />
        <MetricPill label="Text/HTML" value={textRatio > 0 ? `${textRatio.toFixed(1)}%` : '—'} good={textRatio >= 15} />
      </div>

      <div className="flex flex-wrap gap-2">
        {fleschScore > 0 && fleschScore < 40 && <StatusBadge status="warn" label="Difficult to read" />}
        {complexWordPercent > 20 && <StatusBadge status="warn" label={`${complexWordPercent.toFixed(0)}% complex words`} />}
        {thinContent && <StatusBadge status="fail" label="Thin content (< 300 words)" />}
        {contentDecay !== '—' && <StatusBadge status={String(contentDecay).toLowerCase().includes('high') ? 'fail' : 'warn'} label={`Decay: ${contentDecay}`} />}
        {isLosingTraffic && <StatusBadge status="fail" label="Traffic declining" />}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Scores */}
        <Card title="Scores">
          <DataRow label="Flesch reading ease" value={`${fleschScore} (${fleschLabel})`} status={fleschTone} />
          <DataRow label="Flesch-Kincaid grade" value={fleschGrade > 0 ? `${fleschGrade.toFixed(1)}` : '—'} />
          <DataRow label="Reading time" value={`${readingTimeMin} min`} />
          <DataRow label="Word count" value={formatNumber(wordCount)} mono />
          <DataRow label="Passive voice" value={passiveVoicePercent > 0 ? `${passiveVoicePercent.toFixed(0)}%` : '—'} status={passiveVoicePercent > 10 ? 'warn' : 'pass'} />
        </Card>

        {/* Grade distribution */}
        <Card title="Grade distribution">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]]">Cluster avg</span>
              <span className="text-[var(--brand-text-mid)]] font-mono">{clusterAvgFlesch > 0 ? clusterAvgFlesch.toFixed(0) : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]]">Benchmark (article)</span>
              <span className="text-[var(--brand-text-mid)]] font-mono">{benchmarkFlesch}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]]">This page</span>
              <span className={`font-mono ${fleschTone === 'pass' ? 'text-[#22c55e]' : fleschTone === 'warn' ? 'text-[#ef4444]' : 'text-[var(--brand-text-mid)]]'}`}>{fleschScore || '—'}</span>
            </div>
          </div>
          {clusterAvgFlesch > 0 && fleschScore > 0 && (
            <div className="mt-3">
              <div className="relative h-2 bg-[var(--brand-surface-3)]] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fleschScore >= clusterAvgFlesch ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`}
                  style={{ width: `${Math.min(100, (fleschScore / 100) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--brand-text-faint)]] mt-1">
                {fleschScore >= clusterAvgFlesch ? 'Above cluster average' : 'Below cluster average'}
              </div>
            </div>
          )}
        </Card>

        {/* Sentence length */}
        <Card title="Sentence length">
          <DataRow label="Avg words/sentence" value={formatNumber(avgWordsPerSentence)} status={avgWordsPerSentence > 25 ? 'warn' : 'pass'} />
          <DataRow label="Sentence count" value={formatNumber(sentenceCount)} />
          <DataRow label="Complex words" value={complexWordPercent > 0 ? `${complexWordPercent.toFixed(1)}%` : '—'} status={complexWordPercent > 20 ? 'warn' : 'pass'} />
          <DataRow label="Avg syllables/word" value={page?.avgSyllablesPerWord ? Number(page.avgSyllablesPerWord).toFixed(1) : '—'} />
        </Card>

        {/* Content decay */}
        <Card title="Content decay">
          <DataRow label="Decay risk" value={contentDecay} status={String(contentDecay).toLowerCase().includes('high') ? 'fail' : contentDecay !== '—' ? 'warn' : 'pass'} />
          <DataRow label="Traffic trend" value={isLosingTraffic ? 'Declining' : 'Stable'} status={isLosingTraffic ? 'fail' : 'pass'} />
          <DataRow label="Engagement" value={formatNumber(page?.engagementScore)} />
          <DataRow label="Text ratio" value={textRatio > 0 ? `${textRatio.toFixed(1)}%` : '—'} status={textRatio > 0 && textRatio < 15 ? 'warn' : 'pass'} />
        </Card>
      </div>

      {hasTrend && (
        <Card title="Flesch trend">
          <Sparkline values={seriesOf(page, 'fleschScore')} tone="info" />
        </Card>
      )}
    </div>
  );
}
