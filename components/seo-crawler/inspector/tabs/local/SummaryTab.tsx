import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, FlagRow,
  formatNumber, formatPercent, getActions,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const localIssues = actions.filter((a: any) =>
    /nap|gbp|local|review|pack|map|directory|citation|schema|ranking/i.test(a.label || a.title || '')
  ).slice(0, 5);

  // Identity
  const locationName = page?.locationName ?? page?.title ?? 'Location';
  const url = page?.url;
  const address = page?.businessAddress ?? page?.napAddress ?? page?.address;
  const phone = page?.businessPhone ?? page?.napPhone ?? page?.phone;
  const category = page?.businessCategory ?? page?.gbpPrimaryCategory ?? page?.category;
  const description = page?.businessDescription ?? page?.gbpDescription;
  const website = page?.websiteUrl ?? page?.gbpWebsite;

  // Core scores
  const napScore = page?.napConsistencyScore ?? page?.e_local_nap_score;
  const gbpHealth = page?.gbpHealthScore ?? page?.gbpCompleteness ?? page?.e_local_gbp_completeness;
  const reviewAvg = page?.reviewAverage ?? page?.e_local_reviews_avg_google;
  const reviewCount = page?.totalReviews ?? page?.e_local_reviews_count_google;
  const responseRate = page?.reviewResponseRate ?? page?.e_local_reviews_responseRate;
  const reviewVelocity = page?.reviewVelocity ?? page?.e_local_reviews_velocity;
  const packPos = page?.packAveragePosition ?? page?.localPackAvgPosition;
  const packPresence = page?.localPackShare ?? page?.packVisibilityShare;
  const citationCount = page?.citationCount ?? page?.e_local_citations_count;
  const citationQuality = page?.citationQuality ?? page?.e_local_citations_quality;

  // GBP
  const gbpLinked = page?.gbpLinked ?? page?.e_local_gbp_linked;
  const gbpVerified = page?.gbpVerified ?? page?.e_local_gbp_verified;
  const gbpSuspension = page?.gbpSuspension ?? 'no';
  const gbpPrimaryCat = page?.gbpPrimaryCategory ?? page?.e_local_gbp_categories;
  const photoCount = page?.gbpPhotoCount ?? page?.e_local_gbp_images_count;
  const serviceCount = page?.gbpServiceCount ?? page?.e_local_services_count;
  const hours = page?.gbpHours ?? page?.e_local_gbp_hours;
  const locationCount = page?.locationCount ?? page?.e_local_locations_count;

  // Schema
  const hasLocalBusiness = page?.localBusinessSchema ?? page?.p_local_localBusinessSchema;
  const hasGeo = page?.geoCoordinates ?? page?.p_local_geo;
  const hasHours = page?.hoursOnPage ?? page?.p_local_hoursOnPage;
  const hasMenu = page?.hasMenu ?? page?.p_local_hasMenu;

  // NAP details
  const napDetails = page?.napDetails || page?.localNapDetails || [];
  const exactCount = napDetails.filter((d: any) => d.nameMatch !== false && d.addressMatch !== false && d.phoneMatch !== false).length;

  // Local score (computed)
  const localScore = (() => {
    const scores = [
      Number(napScore) || 0,
      Number(gbpHealth) || 0,
      Math.min((Number(reviewAvg) || 0) * 20, 100),
      Number(packPresence) ? Number(packPresence) * 100 : 0,
      Number(citationQuality) || 0,
    ].filter(s => s > 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  })();
  const gaugeColor = localScore >= 80 ? '#22c55e' : localScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-3">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{locationName}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{url || address || ''}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={gaugeColor}
                strokeWidth="3"
                strokeDasharray={`${(localScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{localScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="NAP" value={formatNumber(napScore)} good={Number(napScore) >= 80} sub={`${exactCount}/${napDetails.length} exact`} />
        <MetricPill label="GBP" value={formatPercent(gbpHealth)} good={Number(gbpHealth) >= 0.8} sub={gbpVerified ? 'Verified' : 'Not verified'} />
        <MetricPill label="Reviews" value={reviewAvg ? `${Number(reviewAvg).toFixed(1)}` : '\u2014'} good={Number(reviewAvg) >= 4} sub={`${formatNumber(reviewCount)} total`} />
        <MetricPill label="Pack" value={packPos ? `#${Number(packPos).toFixed(1)}` : '\u2014'} good={Number(packPos) <= 5} sub={formatPercent(packPresence)} />
        <MetricPill label="Citations" value={formatNumber(citationCount)} good={Number(citationQuality) >= 80} sub={formatPercent(citationQuality)} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Identity */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Location</div>
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">Name</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug break-words">{locationName}</div>
          </div>
          <div className="space-y-0">
            <DataRow label="Address" value={address || '\u2014'} />
            <DataRow label="Phone" value={phone || '\u2014'} mono />
            <DataRow label="Category" value={category || '\u2014'} />
            <DataRow label="Website" value={website || url || '\u2014'} />
            {description && <DataRow label="Description" value={description.length > 80 ? description.slice(0, 80) + '...' : description} />}
            <DataRow label="Locations" value={formatNumber(locationCount)} />
          </div>
        </div>

        {/* GBP */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">GBP</div>
          <div className="space-y-0">
            <DataRow label="Linked" value={gbpLinked ? 'Yes' : 'No'} status={gbpLinked ? 'pass' : 'fail'} />
            <DataRow label="Verified" value={gbpVerified ? 'Yes' : 'No'} status={gbpVerified ? 'pass' : 'fail'} />
            <DataRow label="Suspension" value={gbpSuspension || 'no'} status={gbpSuspension === 'no' || !gbpSuspension ? 'pass' : 'fail'} />
            <DataRow label="Primary cat" value={gbpPrimaryCat || '\u2014'} />
            <DataRow label="Hours" value={hours || 'Not set'} status={hours ? 'pass' : 'warn'} />
            <DataRow label="Photos" value={formatNumber(photoCount)} />
            <DataRow label="Services" value={formatNumber(serviceCount)} />
          </div>
        </div>

        {/* NAP consistency */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">NAP consistency</div>
          <div className="space-y-0">
            <DataRow label="Score" value={formatNumber(napScore)} status={Number(napScore) >= 80 ? 'pass' : Number(napScore) >= 50 ? 'warn' : 'fail'} />
            <DataRow label="Exact matches" value={`${exactCount} / ${napDetails.length || '\u2014'}`} status={exactCount === napDetails.length && napDetails.length > 0 ? 'pass' : 'warn'} />
            <DataRow label="Name" value={`${napDetails.filter((d: any) => d.nameMatch !== false).length} / ${napDetails.length || '\u2014'}`} />
            <DataRow label="Address" value={`${napDetails.filter((d: any) => d.addressMatch !== false).length} / ${napDetails.length || '\u2014'}`} />
            <DataRow label="Phone" value={`${napDetails.filter((d: any) => d.phoneMatch !== false).length} / ${napDetails.length || '\u2014'}`} />
          </div>
          {hasTrend && (
            <div className="mt-2 pt-2 border-t border-[var(--brand-surface-2)]">
              <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-2">
                <Sparkline values={page?.napScoreTrend || []} tone="info" />
              </div>
            </div>
          )}
        </div>

        {/* Schema */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Schema</div>
          <div className="space-y-0">
            <DataRow label="LocalBusiness" value={hasLocalBusiness ? 'Yes' : 'No'} status={hasLocalBusiness ? 'pass' : 'fail'} />
            <DataRow label="GeoCoordinates" value={hasGeo ? 'Yes' : 'No'} status={hasGeo ? 'pass' : 'warn'} />
            <DataRow label="OpeningHours" value={hasHours ? 'Yes' : 'No'} status={hasHours ? 'pass' : 'warn'} />
            <DataRow label="Menu" value={hasMenu ? 'Yes' : 'No'} status={hasMenu ? 'pass' : 'warn'} />
          </div>
        </div>
      </div>

      {/* Bottom row: Reviews, Pack, Flags */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Reviews</div>
          <DataRow label="Average" value={reviewAvg ? `${Number(reviewAvg).toFixed(1)} / 5` : '\u2014'} status={Number(reviewAvg) >= 4 ? 'pass' : Number(reviewAvg) >= 3 ? 'warn' : 'fail'} />
          <DataRow label="Count" value={formatNumber(reviewCount)} />
          <DataRow label="Response" value={formatPercent(responseRate)} status={Number(responseRate) >= 0.8 ? 'pass' : 'warn'} />
          <DataRow label="Velocity" value={`${formatNumber(reviewVelocity)}/mo`} />
        </div>

        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Pack</div>
          <DataRow label="Avg position" value={packPos ? Number(packPos).toFixed(1) : '\u2014'} status={Number(packPos) <= 3 ? 'pass' : Number(packPos) <= 10 ? 'warn' : 'fail'} />
          <DataRow label="Visibility" value={formatPercent(packPresence)} status={Number(packPresence) >= 0.3 ? 'pass' : 'warn'} />
        </div>

        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2.5">Flags</div>
          <FlagRow label="NAP inconsistent" fail={Number(napScore) < 70} />
          <FlagRow label="GBP incomplete" fail={Number(gbpHealth) < 0.7} />
          <FlagRow label="Low review count" fail={Number(reviewCount) < 10} />
          <FlagRow label="Poor rating" fail={Number(reviewAvg) < 3.5} />
          <FlagRow label="No local pack" fail={!packPresence || Number(packPresence) === 0} />
          <FlagRow label="Missing schema" fail={!hasLocalBusiness} />
          <FlagRow label="No photos" fail={photoCount === 0} />
        </div>
      </div>

      {/* Issues */}
      {localIssues.length > 0 && (
        <Card title={`Issues (${localIssues.length})`}>
          <div className="space-y-0">
            {localIssues.map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
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
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
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
