import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill, TruncatedUrl,
  formatNumber,
} from '../../shared';

export default function TheirPageTab({ page }: { page: any; hasTrend?: boolean }) {
  const their = page?.theirPage || page?.competitorPage || {};
  const compDomain = page?.competitor?.domain || page?.competitorDomain || 'Competitor';

  // URL block
  const url = their.url || page?.competitorUrl || '';
  const title = their.title || page?.competitorTitle || '\u2014';
  const metaDesc = their.metaDescription || page?.competitorMetaDesc || '';
  const metaDescLen = metaDesc ? metaDesc.length : 0;
  const metaHasYear = /\b(20\d{2})\b/.test(metaDesc);
  const h1 = their.h1 || page?.competitorH1 || '\u2014';

  // Structure
  const wordCount = Number(their.wordCount || page?.competitorWordCount || 0);
  const h2Count = Number(their.h2Count || page?.competitorH2Count || 0);
  const h3Count = Number(their.h3Count || page?.competitorH3Count || 0);
  const imageCount = Number(their.imageCount || page?.competitorImageCount || 0);
  const tableCount = Number(their.tableCount || page?.competitorTableCount || 0);
  const listCount = Number(their.listCount || page?.competitorListCount || 0);

  // Why it ranks
  const backlinks = Number(their.backlinks || page?.competitorBacklinks || 0);
  const domainAuthority = Number(their.domainAuthority || page?.competitorDA || 0);
  const freshnessDays = Number(their.freshnessDays || page?.competitorFreshnessDays || 0);
  const hasComparisonTable = tableCount > 0;
  const hasBrandDA = domainAuthority >= 50;
  const matchesIntent = their.matchesIntent || page?.competitorMatchesIntent || false;

  // Why it ranks signals
  const whySignals: string[] = [];
  if (hasComparisonTable) whySignals.push('Deep comparison table');
  if (backlinks > 0) whySignals.push(`${formatNumber(backlinks)} backlinks (DR ${domainAuthority} avg)`);
  if (freshnessDays > 0 && freshnessDays < 30) whySignals.push(`Updated ${freshnessDays}d ago`);
  if (hasBrandDA) whySignals.push('Brand DA + E-E-A-T');
  if (matchesIntent) whySignals.push('Matches query intent precisely');

  // Schema
  const schemaTypes = their.schemaTypes || page?.competitorSchemaTypes || [];
  const schemaList = Array.isArray(schemaTypes) ? schemaTypes : [];
  const schemaChecks = [
    { label: 'Article', present: schemaList.some((s: string) => s.toLowerCase().includes('article')) },
    { label: 'FAQ', present: schemaList.some((s: string) => s.toLowerCase().includes('faq')) },
    { label: 'Review', present: schemaList.some((s: string) => s.toLowerCase().includes('review')) },
    { label: 'AggregateRating', present: schemaList.some((s: string) => s.toLowerCase().includes('aggregaterating') || s.toLowerCase().includes('rating')) },
  ];

  // Score (for gauge)
  const pageScore = Number(their.score || page?.competitorPageScore || 0);
  const scoreColor = pageScore >= 70 ? '#22c55e' : pageScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-3">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-semibold truncate">{compDomain}</div>
          {url && <div className="text-[11px] text-[#555] font-mono truncate mt-0.5">{url}</div>}
        </div>
        <div className="shrink-0">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={`${(pageScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{pageScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Words" value={formatNumber(wordCount)} good={wordCount >= 1000} />
        <MetricPill label="H2/H3" value={`${h2Count}/${h3Count}`} />
        <MetricPill label="Images" value={formatNumber(imageCount)} />
        <MetricPill label="Backlinks" value={formatNumber(backlinks)} />
        <MetricPill label="DA" value={formatNumber(domainAuthority)} good={domainAuthority >= 50} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* URL block */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="mb-2 pb-2 border-b border-[#141414]">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-[11px] text-white leading-snug break-words">{title}</div>
          </div>
          <div className="mb-2 pb-2 border-b border-[#141414]">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">Meta</div>
            <div className="text-[11px] text-[#ccc] leading-snug break-words">
              {metaDescLen > 0 ? `${metaDescLen} ch` : '\u2014'}
              {metaHasYear && <span className="text-[10px] text-[#666]"> \u00b7 includes year</span>}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">H1</div>
            <div className="text-[11px] text-white leading-snug break-words">{h1}</div>
          </div>
        </div>

        {/* Why it ranks */}
        <Card title="Why it ranks">
          {whySignals.length > 0 ? (
            <div className="space-y-1.5">
              {whySignals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-green-400 text-[11px] shrink-0">+</span>
                  <span className="text-[11px] text-[#ccc] leading-snug">{signal}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#666]">No ranking signals detected.</div>
          )}
        </Card>
      </div>

      {/* Schema */}
      <Card title="Schema">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {schemaChecks.map((check, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className={`text-[11px] font-medium ${check.present ? 'text-green-400' : 'text-[#444]'}`}>
                {check.present ? '\u2713' : '\u2717'}
              </span>
              <span className={`text-[11px] ${check.present ? 'text-[#ccc]' : 'text-[#555]'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
        {schemaList.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#141414]">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">All types</div>
            <div className="flex flex-wrap gap-1">
              {schemaList.map((s: string, i: number) => (
                <StatusBadge key={i} status="info" label={s} />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
