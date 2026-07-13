import React from 'react';
import {
  DataRow, StatusBadge, Card, MetricPill,
  formatNumber,
} from '../../shared';

export default function LinkOverlapTab({ page }: { page: any; hasTrend?: boolean }) {
  const sharedDomains = page?.sharedRefDomains || page?.competitorSharedRefDomains || [];
  const theirExclusive = page?.theirExclusiveDomains || page?.competitorExclusiveRefDomains || [];
  const ourExclusive = page?.ourExclusiveDomains || page?.ownExclusiveRefDomains || [];

  // Anchor diff
  const ourAnchorMix = page?.ourAnchorMix || page?.ourAnchorDistribution || {};
  const theirAnchorMix = page?.theirAnchorMix || page?.theirAnchorDistribution || {};
  const ourBrandPct = Number(ourAnchorMix.brand ?? ourAnchorMix.brandPct ?? 0);
  const theirBrandPct = Number(theirAnchorMix.brand ?? theirAnchorMix.brandPct ?? 0);
  const anchorNote = page?.anchorDiffNote || page?.anchorNote || '';

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Shared" value={formatNumber(sharedDomains.length)} />
        <MetricPill label="Their Unique" value={formatNumber(theirExclusive.length)} />
        <MetricPill label="Our Unique" value={formatNumber(ourExclusive.length)} />
        <MetricPill label="Their Brand" value={`${theirBrandPct}%`} />
        <MetricPill label="Our Brand" value={`${ourBrandPct}%`} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Shared referring domains */}
        <Card title="Shared referring domains">
          {sharedDomains.length > 0 ? (
            <div className="space-y-0">
              {sharedDomains.slice(0, 8).map((d: any, i: number) => {
                const domain = typeof d === 'string' ? d : d.domain || d.referringDomain || '';
                const dr = d.domainRating ?? d.dr ?? d.authority ?? d.da ?? null;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#111] last:border-b-0">
                    <span className="text-[11px] text-[#ccc] font-mono truncate">{domain}</span>
                    {dr !== null && (
                      <StatusBadge status={dr >= 80 ? 'pass' : dr >= 60 ? 'warn' : 'info'} label={`DR ${dr}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[12px] text-[#666] py-3">No shared referring domains.</div>
          )}
        </Card>

        {/* Their unique referrers (prospects) */}
        <Card title="Their unique referrers (prospects)">
          {theirExclusive.length > 0 ? (
            <div className="space-y-0">
              {theirExclusive.slice(0, 8).map((d: any, i: number) => {
                const domain = typeof d === 'string' ? d : d.domain || d.name || '';
                const dr = d.domainRating ?? d.dr ?? d.authority ?? d.da ?? null;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#111] last:border-b-0">
                    <span className="text-[11px] text-[#ccc] font-mono truncate">{domain}</span>
                    {dr !== null && (
                      <StatusBadge status={dr >= 80 ? 'pass' : dr >= 60 ? 'warn' : 'info'} label={`DR ${dr}`} />
                    )}
                  </div>
                );
              })}
              {theirExclusive.length > 8 && (
                <div className="text-[10px] text-[#555] py-1.5">({theirExclusive.length - 8} more)</div>
              )}
            </div>
          ) : (
            <div className="text-[12px] text-[#666] py-3">No unique referrers found.</div>
          )}
        </Card>
      </div>

      {/* Our unique + Anchor diff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Our unique referrers */}
        <Card title="Our unique referrers">
          {ourExclusive.length > 0 ? (
            <div className="space-y-0">
              {ourExclusive.slice(0, 8).map((d: any, i: number) => {
                const domain = typeof d === 'string' ? d : d.domain || d.name || '';
                const dr = d.domainRating ?? d.dr ?? d.authority ?? d.da ?? null;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#111] last:border-b-0">
                    <span className="text-[11px] text-[#ccc] font-mono truncate">{domain}</span>
                    {dr !== null && (
                      <StatusBadge status={dr >= 80 ? 'pass' : dr >= 60 ? 'warn' : 'info'} label={`DR ${dr}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[12px] text-[#666] py-3">No unique referrers found.</div>
          )}
        </Card>

        {/* Anchor diff */}
        <Card title="Anchor diff">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Us</div>
                <div className="text-[12px] text-[#ccc]">
                  brand <span className="text-white font-medium">{ourBrandPct}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Competitor</div>
                <div className="text-[12px] text-[#ccc]">
                  brand <span className="text-white font-medium">{theirBrandPct}%</span>
                </div>
              </div>
            </div>
            {anchorNote && (
              <div className="text-[10px] text-[#666] leading-snug">{anchorNote}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
