import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';

export default function CopyTab({ page }: { page: any }) {
  const title = page?.title || '';
  const h1 = page?.h1_1 || '';
  const metaDesc = page?.metaDesc || '';
  const wordCount = Number(page?.wordCount || 0);
  const h1Count = Number(page?.h1Count || 1);
  const h2Count = Number(page?.h2Count || 0);
  const h3Count = Number(page?.h3Count || 0);
  const h4Count = Number(page?.h4Count || 0);
  const paragraphCount = Number(page?.paragraphCount || 0);
  const sentenceCount = Number(page?.sentenceCount || 0);
  const imageCount = Number(page?.imgCount || 0);
  const spellingErrors = Number(page?.spellingErrors || 0);
  const grammarErrors = Number(page?.grammarErrors || 0);
  const containsLorem = page?.containsLoremIpsum || false;
  const ctaTexts = Array.isArray(page?.ctaTexts) ? page.ctaTexts : [];
  const byline = getMetric(page, 'author') || getMetric(page, 'wpAuthorName') || page?.author;
  const authorBio = getMetric(page, 'authorBio') || page?.authorBio;
  const clusterAvg = Number(page?.clusterAvgWordCount || 0);
  const contentQualityScore = Number(getMetric(page, 'contentQualityScore') || page?.contentQualityScore || 0);

  const titleLen = title.length;
  const metaLen = metaDesc.length;
  const thinContent = wordCount > 0 && wordCount < 300;
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 300} sub={thinContent ? 'Thin' : undefined} />
        <MetricPill label="Title" value={`${titleLen}ch`} good={titleLen >= 30 && titleLen <= 60} />
        <MetricPill label="Meta" value={`${metaLen}ch`} good={metaLen >= 120 && metaLen <= 155} />
        <MetricPill label="Spelling" value={formatNumber(spellingErrors)} good={spellingErrors === 0} />
        <MetricPill label="Grammar" value={formatNumber(grammarErrors)} good={grammarErrors === 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {thinContent && <StatusBadge status="fail" label="Thin content (< 300 words)" />}
        {containsLorem && <StatusBadge status="fail" label="Lorem ipsum detected" />}
        {spellingErrors > 0 && <StatusBadge status="warn" label={`${spellingErrors} spelling errors`} />}
        {grammarErrors > 0 && <StatusBadge status="warn" label={`${grammarErrors} grammar errors`} />}
        {!byline && <StatusBadge status="warn" label="No author byline" />}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Structure */}
        <Card title="Structure">
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">H1</div>
            <div className={`text-[11px] leading-snug break-words ${h1 ? 'text-[var(--brand-text-strong)]' : 'text-[#ef4444]'}`}>
              {h1 || 'Missing'}
            </div>
          </div>
          <DataRow label="Headings" value={`H1:${h1Count} H2:${h2Count} H3:${h3Count} H4:${h4Count}`} />
          <DataRow label="Paragraphs" value={formatNumber(paragraphCount)} />
          <DataRow label="Sentences" value={formatNumber(sentenceCount)} />
          <DataRow label="Images" value={formatNumber(imageCount)} />
          <DataRow label="Avg words/sentence" value={formatNumber(avgWordsPerSentence)} status={avgWordsPerSentence > 25 ? 'warn' : 'pass'} />
        </Card>

        {/* Length vs cluster */}
        <Card title="Length vs cluster">
          <DataRow label="This page" value={`${formatNumber(wordCount)} words`} mono />
          <DataRow label="Cluster avg" value={clusterAvg > 0 ? `${formatNumber(clusterAvg)} words` : '—'} mono />
          {clusterAvg > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-[var(--brand-text-faint)] mb-1">
                <span>{formatNumber(wordCount)}w</span>
                <span>{formatNumber(clusterAvg)}w avg</span>
              </div>
              <div className="relative h-2 bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${wordCount >= clusterAvg ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`}
                  style={{ width: `${Math.min(100, (wordCount / Math.max(clusterAvg, 1)) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--brand-text-faint)] mt-1">
                {wordCount >= clusterAvg
                  ? `+${formatNumber(wordCount - clusterAvg)} words vs avg`
                  : `${formatNumber(clusterAvg - wordCount)} words below avg`}
              </div>
            </div>
          )}
        </Card>

        {/* Density */}
        <Card title="Density">
          <DataRow label="Paragraphs" value={formatNumber(paragraphCount)} />
          <DataRow label="Sentences" value={formatNumber(sentenceCount)} />
          <DataRow label="Avg para length" value={paragraphCount > 0 ? `${Math.round(wordCount / paragraphCount)} words` : '—'} />
          <DataRow label="Avg sentence length" value={formatNumber(avgWordsPerSentence)} status={avgWordsPerSentence > 25 ? 'warn' : 'pass'} />
        </Card>

        {/* Headlines & meta */}
        <Card title="Headlines & meta">
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">Title tag</div>
            <div className={`text-[11px] break-words ${titleLen >= 30 && titleLen <= 60 ? 'text-[var(--brand-text-strong)]' : 'text-[#f59e0b]'}`}>
              {title || <span className="italic text-[var(--brand-text-faint)]">Missing</span>}
            </div>
            <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5">{titleLen} characters</div>
          </div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">Meta description</div>
            <div className={`text-[11px] break-words ${metaLen >= 120 && metaLen <= 155 ? 'text-[var(--brand-text-mid)]' : 'text-[#f59e0b]'}`}>
              {metaDesc || <span className="italic text-[var(--brand-text-faint)]">Missing</span>}
            </div>
            <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5">{metaLen} characters</div>
          </div>
          <DataRow label="CTAs found" value={formatNumber(ctaTexts.length)} status={ctaTexts.length > 0 ? 'pass' : 'warn'} />
        </Card>
      </div>
    </div>
  );
}
