import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber,
} from '../../shared';

export default function AnchorTab({ page }: { page: any }) {
  // Primary anchor text
  const anchorText = page?.primaryAnchorText || page?.topAnchorText || page?.anchorText || '—';
  const anchorLength = anchorText !== '—' ? anchorText.length : 0;
  const anchorRel = page?.anchorRel || page?.linkRel || '—';

  // Classification
  const anchorType = page?.anchorType || page?.anchorClassification || '—';
  const anchorKwMatch = page?.anchorKeywordMatch || page?.anchorKwMatch || '—';
  const anchorBranded = page?.anchorBranded;
  const anchorGeneric = page?.anchorGeneric;

  // Target anchor mix (distribution on target page)
  const anchorMix = page?.anchorTextMix || page?.anchorMix || {};
  const brandedPct = Number(page?.brandedAnchorPct || (anchorMix.brandedPct) || 0);
  const exactPct = Number(page?.exactMatchAnchorPct || (anchorMix.exactMatchPct) || 0);
  const partialPct = Number(page?.partialMatchAnchorPct || (anchorMix.partialMatchPct) || 0);
  const genericPct = Number(page?.genericAnchorPct || (anchorMix.genericPct) || 0);
  const urlPct = Number(page?.urlAnchorPct || (anchorMix.urlPct) || 0);

  // Co-citation
  const coCitationCount = Number(page?.anchorCoCitationCount || page?.sameAnchorOtherSites || 0);
  const coCitationCompetitors = Number(page?.anchorCoCitationCompetitors || 0);

  // Keyword overlap
  const kwOverlap = Array.isArray(page?.anchorKeywordOverlap) ? page.anchorKeywordOverlap : [];
  const kwOverlapMatch = page?.anchorKeywordOverlapMatch;

  // Over-opt flag
  const overOptimized = page?.anchorOverOptimized ?? page?.anchorOverOptFlag;
  const overOptReason = page?.anchorOverOptReason || 'balanced mix';

  // Aggregate distribution (fallback)
  const branded = Number(anchorMix.branded || page?.brandedAnchorCount || 0);
  const exactMatch = Number(anchorMix.exactMatch || page?.exactMatchAnchorCount || 0);
  const partial = Number(anchorMix.partialMatch || page?.partialMatchAnchorCount || 0);
  const generic = Number(anchorMix.generic || page?.genericAnchorCount || 0);
  const urlAnchors = Number(anchorMix.url || page?.urlAnchorCount || 0);
  const imageAnchors = Number(anchorMix.image || page?.imageAnchorCount || 0);
  const totalAnchors = branded + exactMatch + partial + generic + urlAnchors + imageAnchors;

  const riskTone = exactMatch > 0 && totalAnchors > 0 && (exactMatch / totalAnchors) * 100 > 30 ? 'fail' : 'pass';

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Total Anchors" value={formatNumber(totalAnchors)} />
        <MetricPill label="Branded" value={brandedPct > 0 ? `${brandedPct}%` : totalAnchors > 0 ? `${Math.round((branded / totalAnchors) * 100)}%` : '—'} good={brandedPct >= 30 || totalAnchors > 0 && (branded / totalAnchors) * 100 >= 30} />
        <MetricPill label="Exact Match" value={exactPct > 0 ? `${exactPct}%` : totalAnchors > 0 ? `${Math.round((exactMatch / totalAnchors) * 100)}%` : '—'} good={riskTone === 'pass'} />
        <MetricPill label="Diversity" value={page?.anchorDiversityScore != null ? formatNumber(page.anchorDiversityScore) : '—'} />
      </div>

      {/* Badges */}
      {(overOptimized === true || riskTone === 'fail' || brandedPct < 20 && totalAnchors > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {overOptimized === true && <StatusBadge status="fail" label={`Over-optimized: ${overOptReason}`} />}
          {riskTone === 'fail' && <StatusBadge status="fail" label="High exact match risk" />}
          {brandedPct < 20 && totalAnchors > 0 && <StatusBadge status="warn" label={`Low branded ratio (${brandedPct || Math.round((branded / totalAnchors) * 100)}%)`} />}
        </div>
      )}

      {/* Wireframe layout: Anchor text | Classification | Target anchor mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Anchor text">
          <div className="mb-2 pb-2 border-b border-[#141414]">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">Text</div>
            <div className={`text-[11px] break-words ${anchorText !== '—' ? 'text-white' : 'text-[#555]'}`}>
              {anchorText !== '—' ? `"${anchorText}"` : <span className="italic">Missing</span>}
            </div>
          </div>
          <DataRow label="Length" value={anchorLength > 0 ? `${anchorLength} ch` : '—'} />
          <DataRow label="Rel" value={anchorRel} />
        </Card>

        <Card title="Classification">
          <DataRow label="Type" value={anchorType} status={anchorType !== '—' ? 'pass' : 'info'} />
          <DataRow label="KW match" value={anchorKwMatch} status={anchorKwMatch !== '—' ? 'pass' : 'info'} />
          <DataRow label="Branded" value={anchorBranded === true ? 'Yes' : anchorBranded === false ? 'No' : '—'} status={anchorBranded === true ? 'pass' : 'info'} />
          <DataRow label="Generic" value={anchorGeneric === true ? 'Yes' : anchorGeneric === false ? 'No' : '—'} status={anchorGeneric === true ? 'pass' : 'info'} />
        </Card>

        <Card title="Target anchor mix">
          <AnchorMixBar label="Brand" pct={brandedPct || (totalAnchors > 0 ? (branded / totalAnchors) * 100 : 0)} color="bg-blue-500" />
          <AnchorMixBar label="Exact" pct={exactPct || (totalAnchors > 0 ? (exactMatch / totalAnchors) * 100 : 0)} color="bg-red-500" />
          <AnchorMixBar label="Partial" pct={partialPct || (totalAnchors > 0 ? (partial / totalAnchors) * 100 : 0)} color="bg-orange-500" isCurrent={anchorType === 'partial'} />
          <AnchorMixBar label="Generic" pct={genericPct || (totalAnchors > 0 ? (generic / totalAnchors) * 100 : 0)} color="bg-purple-500" />
          <AnchorMixBar label="URL" pct={urlPct || (totalAnchors > 0 ? (urlAnchors / totalAnchors) * 100 : 0)} color="bg-green-500" />
        </Card>
      </div>

      {/* Second row: Co-citation | Keyword overlap | Over-opt flag */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Co-citation (other links)">
          {coCitationCount === 0 ? (
            <div className="text-[12px] text-[#666] italic">No co-citation data available.</div>
          ) : (
            <>
              <DataRow label="Used on" value={`${formatNumber(coCitationCount)} other sites`} />
              {coCitationCompetitors > 0 && (
                <DataRow label="Linking to competitors" value={formatNumber(coCitationCompetitors)} status="warn" />
              )}
            </>
          )}
        </Card>

        <Card title="Keyword overlap">
          {kwOverlap.length === 0 ? (
            <div className="text-[12px] text-[#666] italic">No keyword overlap data.</div>
          ) : (
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
              {kwOverlap.slice(0, 5).map((kw: any, i: number) => {
                const text = typeof kw === 'string' ? kw : kw?.keyword || kw?.text || '—';
                const matched = typeof kw === 'object' && (kw?.matched || kw?.overlap);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1 border-b border-[#111] last:border-b-0">
                    <span className="text-[#ccc]">{matched ? 'partial' : 'none'}</span>
                    <span className="text-white font-mono">"{text}"</span>
                    {matched && <span className="text-[#22c55e]">✓</span>}
                  </div>
                );
              })}
            </div>
          )}
          {kwOverlapMatch && (
            <div className="mt-2 pt-2 border-t border-[#141414] text-[11px]">
              <span className="text-[#666]">With target's rank kw: </span>
              <span className="text-white">{kwOverlapMatch}</span>
            </div>
          )}
        </Card>

        <Card title="Over-opt flag">
          <DataRow
            label={overOptimized === true ? 'Yes' : 'No'}
            value={overOptimized === true ? overOptReason : 'balanced mix'}
            status={overOptimized === true ? 'fail' : 'pass'}
          />
        </Card>
      </div>
    </div>
  );
}

function AnchorMixBar({ label, pct, color, isCurrent }: {
  label: string; pct: number; color: string; isCurrent?: boolean;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] ${isCurrent ? 'text-white font-medium' : 'text-[#888]'}`}>{label}{isCurrent ? ' (this)' : ''}</span>
        <span className="text-[11px] font-mono text-[#aaa]">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-[6px] bg-[#151515] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
