import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill,
  formatNumber, formatDate, getMetric,
} from '../../shared';

export default function ContentTab({ page }: { page: any; hasTrend?: boolean }) {
  const wordCount = Number(getMetric(page, 'wordCount') || page?.wordCount || 0);
  const readability = getMetric(page, 'readability') || page?.readability;
  const fleschScore = Number(getMetric(page, 'fleschScore') || page?.fleschScore || 0);
  const sentenceCount = Number(getMetric(page, 'sentenceCount') || page?.sentenceCount || 0);
  const textToHtmlRatio = Number(getMetric(page, 'textToHtmlRatio') || page?.textToHtmlRatio || 0);
  const contentAge = Number(getMetric(page, 'contentAge') || page?.contentAge || 0);
  const primaryEntity = getMetric(page, 'primaryEntity') || page?.primaryEntity;
  const entityConfidence = Number(getMetric(page, 'entityConfidence') || page?.entityConfidence || 0);
  const relatedEntities: string[] = Array.isArray(page?.relatedEntities) ? page.relatedEntities : [];
  const byline = getMetric(page, 'author') || getMetric(page, 'wpAuthorName') || page?.author;
  const authorBio = getMetric(page, 'authorBio') || page?.authorBio;
  const citationsCount = Number(getMetric(page, 'citationsCount') || page?.citationsCount || 0);
  const publishedDate = getMetric(page, 'visibleDate') || page?.visibleDate || page?.wpPublishDate;
  const updatedDate = getMetric(page, 'lastModified') || page?.lastModified;
  const clusterAvg = Number(getMetric(page, 'clusterAvgWordCount') || page?.clusterAvgWordCount || 0);
  const nearDuplicate = getMetric(page, 'nearDuplicateMatch') || page?.nearDuplicateMatch;
  const isCannibalized = getMetric(page, 'isCannibalized') || page?.isCannibalized;

  const freshTone = contentAge < 90 ? 'good' : contentAge < 365 ? 'mid' : contentAge < 730 ? 'warn' : 'bad';
  const freshLabel = contentAge < 90 ? 'Fresh' : contentAge < 365 ? 'Recent' : contentAge < 730 ? 'Stale' : 'Decaying';

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 300} />
        <MetricPill label="Readability" value={readability || '\u2014'} sub={fleschScore ? `Flesch ${formatNumber(fleschScore)}` : undefined} />
        <MetricPill label="Sentences" value={formatNumber(sentenceCount)} />
        <MetricPill label="Text ratio" value={textToHtmlRatio > 0 ? `${(textToHtmlRatio * 100).toFixed(1)}%` : '\u2014'} />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={freshTone === 'good' ? 'pass' : freshTone === 'mid' ? 'info' : freshTone === 'warn' ? 'warn' : 'fail'} label={`${freshLabel} \u00B7 ${formatNumber(contentAge)}d`} />
        {page?.contentDecayRisk && <StatusBadge status={page.contentDecayRisk === 'high' ? 'fail' : 'warn'} label={`Decay ${page.contentDecayRisk}`} />}
        {isCannibalized && <StatusBadge status="fail" label="Cannibalized" />}
        {nearDuplicate && <StatusBadge status="warn" label="Near-duplicate" />}
        {Number(page?.spellingErrors || 0) > 0 && <StatusBadge status="warn" label={`Spelling ${formatNumber(page.spellingErrors)}`} />}
      </div>

      {/* E-E-A-T */}
      <Card title="E-E-A-T signals">
        <DataRow label="Byline" value={byline || '\u2014'} status={byline ? 'pass' : 'warn'} />
        <DataRow label="Author bio" value={authorBio ? 'Present' : 'Missing'} status={authorBio ? 'pass' : 'info'} />
        <DataRow label="Citations" value={formatNumber(citationsCount)} />
        <DataRow label="Updated visually" value={getMetric(page, 'updatedVisually') || page?.updatedVisually ? 'Yes' : 'No'} />
      </Card>

      {/* Entities */}
      {primaryEntity && (
        <Card title="Entities">
          <DataRow label="Primary entity" value={primaryEntity || '\u2014'} />
          <DataRow label="Confidence" value={entityConfidence > 0 ? `${formatNumber(entityConfidence)}%` : '\u2014'} />
          {relatedEntities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {relatedEntities.map((e: string) => (
                <StatusBadge key={e} status="info" label={e} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Duplication */}
      <Card title="Duplication">
        <DataRow label="Near-duplicate" value={nearDuplicate || 'None'} status={nearDuplicate ? 'warn' : 'pass'} />
        <DataRow label="Cannibalization" value={isCannibalized ? 'Yes' : 'No'} status={isCannibalized ? 'fail' : 'pass'} />
        <DataRow label="Content hash" value={page?.hash ? String(page.hash).slice(0, 24) : '\u2014'} mono />
        <DataRow label="Exact duplicate" value={page?.exactDuplicate ? 'Yes' : 'No'} status={page?.exactDuplicate ? 'fail' : 'pass'} />
      </Card>

      {/* Freshness */}
      <Card title="Freshness">
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#666]">Content age</span>
            <span className={`font-bold ${freshTone === 'good' ? 'text-[#22c55e]' : freshTone === 'mid' ? 'text-[#3b82f6]' : freshTone === 'warn' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
              {formatNumber(contentAge)}d
            </span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (contentAge / 730) * 100)}%`,
                background: freshTone === 'good' ? '#22c55e' : freshTone === 'mid' ? '#3b82f6' : freshTone === 'warn' ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#333] mt-1">
            <span>Fresh</span>
            <span>Decaying</span>
          </div>
        </div>
        <DataRow label="Published" value={formatDate(publishedDate)} />
        <DataRow label="Last updated" value={formatDate(updatedDate)} />
        <DataRow label="Cluster avg" value={clusterAvg > 0 ? formatNumber(clusterAvg) : '\u2014'} />
        {clusterAvg > 0 && wordCount > 0 && (
          <DataRow label="vs cluster" value={
            wordCount < clusterAvg * 0.6 ? 'Thin' : wordCount > clusterAvg * 1.5 ? 'Long' : 'Normal'
          } status={wordCount < clusterAvg * 0.6 ? 'warn' : 'pass'} />
        )}
      </Card>
    </div>
  );
}
