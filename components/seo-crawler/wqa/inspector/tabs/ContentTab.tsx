import React from 'react';
import {
  DataRow, MetricPill, StatusBadge, Card,
  formatNumber, formatDate, getMetric,
} from '../../../inspector/shared';

export default function ContentTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const wordCount = Number(page?.wordCount || 0);
  const readability = page?.readability;
  const fleschScore = Number(page?.fleschScore || 0);
  const sentenceCount = Number(page?.sentenceCount || 0);
  const paragraphCount = Number(page?.paragraphCount || 0);
  const h2Count = Number(page?.h2Count || 0);
  const h3Count = Number(page?.h3Count || 0);
  const contentAge = Number(page?.contentAge || 0);
  const sentiment = page?.sentiment;
  const tone = page?.tone;
  const language = page?.language || 'en';
  const readTime = Math.max(1, Math.round(wordCount / 250));
  const clusterAvg = Number(getMetric(page, 'clusterAvgWordCount') || page?.clusterAvgWordCount || 0);
  const textToHtmlRatio = Number(page?.textToHtmlRatio || 0);

  // Entities
  const primaryEntity = getMetric(page, 'primaryEntity') || page?.primaryEntity;
  const entityConfidence = Number(getMetric(page, 'entityConfidence') || page?.entityConfidence || 0);
  const relatedEntities: string[] = Array.isArray(page?.relatedEntities) ? page.relatedEntities : [];
  const missingEntities: string[] = Array.isArray(page?.missingEntities) ? page.missingEntities : [];
  const internalMentions = Number(page?.internalMentions || 0);
  const externalCitations = Number(getMetric(page, 'citationsCount') || page?.citationsCount || 0);

  // E-E-A-T
  const byline = getMetric(page, 'author') || getMetric(page, 'wpAuthorName') || page?.author;
  const authorBio = getMetric(page, 'authorBio') || page?.authorBio;
  const authorPage = page?.authorPage;
  const updatedVisually = page?.hasUpdatedDate;
  const schemaAuthor = !!getMetric(page, 'hasAuthorSchema');

  // Duplication
  const nearDuplicate = getMetric(page, 'nearDuplicateMatch') || page?.nearDuplicateMatch;
  const isCannibalized = getMetric(page, 'isCannibalized') || page?.isCannibalized;
  const cannibalUrl = page?.cannibalUrl || page?.cannibalSiblingUrl;
  const contentHash = page?.hash ? String(page.hash).slice(0, 24) : null;
  const exactDuplicate = page?.exactDuplicate;

  // Freshness
  const publishedDate = getMetric(page, 'visibleDate') || page?.visibleDate || page?.wpPublishDate;
  const updatedDate = getMetric(page, 'lastModified') || page?.lastModified;
  const clusterAvgUpdateCadence = Number(page?.clusterAvgUpdateCadence || 0);
  const daysSinceUpdate = updatedDate ? Math.floor((Date.now() - new Date(updatedDate).getTime()) / 86400000) : 0;

  // Schema
  const hasArticle = !!getMetric(page, 'hasArticleSchema');
  const hasBreadcrumb = !!getMetric(page, 'hasBreadcrumbSchema');
  const hasAuthor = !!getMetric(page, 'hasAuthorSchema');
  const hasFaq = !!getMetric(page, 'hasFaqSchema');
  const hasWebPage = !!getMetric(page, 'hasWebPageSchema');
  const hasHowTo = !!getMetric(page, 'hasHowToSchema');
  const hasReview = !!getMetric(page, 'hasReviewSchema');
  const schemaCount = [hasArticle, hasBreadcrumb, hasAuthor, hasFaq, hasWebPage, hasHowTo, hasReview].filter(Boolean).length;

  // Freshness tone
  const freshTone = contentAge < 90 ? 'good' : contentAge < 365 ? 'mid' : contentAge < 730 ? 'warn' : 'bad';
  const freshLabel = contentAge < 90 ? 'Fresh' : contentAge < 365 ? 'Recent' : contentAge < 730 ? 'Stale' : 'Decaying';
  const spellingErrors = Number(page?.spellingErrors || 0);

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 300} sub={clusterAvg > 0 ? 'avg ' + formatNumber(clusterAvg) : undefined} />
        <MetricPill label="Readability" value={fleschScore ? String(formatNumber(fleschScore)) : readability || '\u2014'} />
        <MetricPill label="Sentences" value={formatNumber(sentenceCount)} />
        <MetricPill label="Text ratio" value={textToHtmlRatio > 0 ? `${(textToHtmlRatio * 100).toFixed(1)}%` : '\u2014'} />
        <MetricPill label="Schema" value={`${schemaCount}/7`} good={schemaCount >= 3} />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={freshTone === 'good' ? 'pass' : freshTone === 'mid' ? 'info' : freshTone === 'warn' ? 'warn' : 'fail'} label={`${freshLabel} \u00B7 ${formatNumber(contentAge)}d`} />
        {page?.contentDecayRisk && <StatusBadge status={page.contentDecayRisk === 'high' ? 'fail' : 'warn'} label={`Decay ${page.contentDecayRisk}`} />}
        {isCannibalized && <StatusBadge status="fail" label="Cannibalized" />}
        {nearDuplicate && <StatusBadge status="warn" label="Near-duplicate" />}
        {spellingErrors > 0 && <StatusBadge status="warn" label={`Spelling ${formatNumber(spellingErrors)}`} />}
      </div>

      {/* E-E-A-T */}
      <Card title="E-E-A-T">
        <DataRow label="Byline" value={byline || '\u2014'} status={byline ? 'pass' : 'warn'} />
        <DataRow label="Author bio" value={authorBio ? 'Present' : 'Missing'} status={authorBio ? 'pass' : 'fail'} />
        <DataRow label="Author page" value={authorPage ? 'Present' : 'Missing'} status={authorPage ? 'pass' : 'fail'} />
        <DataRow label="Citations" value={`${externalCitations} external`}
          status={externalCitations === 0 ? 'warn' : 'pass'} />
        <DataRow label="Updated visually" value={updatedVisually ? 'Yes' : 'No'} status={updatedVisually ? 'pass' : 'fail'} />
        <DataRow label="Schema Author" value={schemaAuthor ? 'Present' : 'Missing'} status={schemaAuthor ? 'pass' : 'fail'} />
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
          {missingEntities.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Missing</div>
              <div className="flex flex-wrap gap-1">
                {missingEntities.map((e: string) => (
                  <span key={e} className="px-1.5 py-0.5 text-[10px] rounded bg-[#1a1a1a] text-[#666]">{e}</span>
                ))}
              </div>
            </div>
          )}
          <DataRow label="Mentions" value={`${internalMentions} int \u00B7 ${externalCitations} ext`}
            status={externalCitations === 0 ? 'warn' : undefined} />
        </Card>
      )}

      {/* Content Structure */}
      <Card title="Content Structure">
        <div className="grid grid-cols-2 gap-x-6">
          <DataRow label="Paragraphs" value={formatNumber(paragraphCount)} />
          <DataRow label="Reading time" value={`${readTime} min`} />
          <DataRow label="H2 headings" value={formatNumber(h2Count)} />
          <DataRow label="Language" value={language} />
          <DataRow label="H3 headings" value={formatNumber(h3Count)} />
          {sentiment != null && (
            <DataRow label="Sentiment" value={`${sentiment > 0 ? '+' : ''}${sentiment}`}
              status={sentiment > 0.1 ? 'pass' : sentiment < -0.1 ? 'warn' : undefined} />
          )}
          {tone && <DataRow label="Tone" value={tone} />}
        </div>
      </Card>

      {/* Duplication */}
      <Card title="Duplication">
        <DataRow label="Near-duplicate" value={nearDuplicate || 'None'} status={nearDuplicate ? 'warn' : 'pass'} />
        <DataRow label="Cannibalization" value={isCannibalized && cannibalUrl ? cannibalUrl : isCannibalized ? 'Yes' : 'No'}
          status={isCannibalized ? 'fail' : 'pass'} />
        {exactDuplicate && <DataRow label="Exact duplicate" value="Yes" status="fail" />}
        {contentHash && <DataRow label="Content hash" value={contentHash} mono />}
        {clusterAvg > 0 && wordCount > 0 && (
          <DataRow label="vs cluster" value={
            wordCount < clusterAvg * 0.6 ? 'Thin' : wordCount > clusterAvg * 1.5 ? 'Long' : 'Normal'
          } status={wordCount < clusterAvg * 0.6 ? 'warn' : 'pass'} />
        )}
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
        <DataRow label="Published" value={formatDate(publishedDate) || '\u2014'} />
        <DataRow label="Last updated" value={updatedDate ? `${formatDate(updatedDate)} \u00B7 ${daysSinceUpdate}d ago` : '\u2014'}
          status={daysSinceUpdate > 120 ? 'warn' : undefined} />
        {clusterAvgUpdateCadence > 0 && (
          <DataRow label="Cluster avg cadence" value={`${clusterAvgUpdateCadence}d`} />
        )}
      </Card>

      {/* Schema */}
      <Card title="Schema Present">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'Article', present: hasArticle },
            { key: 'Breadcrumb', present: hasBreadcrumb },
            { key: 'Author', present: hasAuthor },
            { key: 'FAQ', present: hasFaq },
            { key: 'WebPage', present: hasWebPage },
            { key: 'HowTo', present: hasHowTo },
            { key: 'Review', present: hasReview },
          ].map(s => (
            <div key={s.key} className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] ${
              s.present ? 'bg-[#22c55e]/5 border border-[#22c55e]/20' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
            }`}>
              <span className="text-[#ccc]">{s.key}</span>
              <span className={`text-[10px] font-medium ${s.present ? 'text-[#22c55e]' : 'text-[#555]'}`}>
                {s.present ? '\u2713 Present' : '\u2717 Missing'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
