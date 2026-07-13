import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';

export default function GbpTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const linked = page?.gbpLinked ?? page?.e_local_gbp_linked;
  const verified = page?.gbpVerified ?? page?.e_local_gbp_verified;
  const completeness = page?.gbpCompleteness ?? page?.e_local_gbp_completeness;
  const fieldGaps = page?.gbpFieldGaps || page?.gbpMissingFields || [];
  const hours = page?.gbpHours ?? page?.e_local_gbp_hours;
  const categories = page?.gbpCategories ?? page?.e_local_gbp_categories ?? [];
  const categoryList = Array.isArray(categories) ? categories : typeof categories === 'string' ? categories.split(',').map((c: string) => c.trim()) : [];
  const primaryCat = page?.gbpPrimaryCategory;
  const additionalCats = categoryList.filter((c: string) => c !== primaryCat);
  const specialHours = page?.gbpSpecialHours;
  const photoCount = page?.gbpPhotoCount ?? page?.e_local_gbp_images_count;
  const serviceCount = page?.gbpServiceCount ?? page?.e_local_services_count;
  const productCount = page?.gbpProductCount ?? page?.e_local_products_count;
  const menuPresent = page?.gbpMenu ?? page?.hasMenu;
  const appointmentUrl = page?.gbpAppointmentUrl;
  const attributes = page?.gbpAttributes || page?.localAttributes || [];
  const postCadence = page?.gbpPostCadence ?? page?.e_local_gbp_posts_cadence;
  const lastPost = page?.gbpLastPost;
  const lastPostDate = page?.gbpLastPostDate;
  const questionsAsked = page?.gbpQuestionsAsked;
  const questionsUnanswered = page?.gbpQuestionsUnanswered;
  const description = page?.gbpDescription ?? page?.businessDescription;
  const website = page?.gbpWebsite ?? page?.websiteUrl;
  const serviceAreas = (page?.gbpServiceAreas ?? page?.serviceAreas) || [];

  // Completeness field checks
  const fields = [
    { label: 'Name', present: true },
    { label: 'Phone', present: true },
    { label: 'Website', present: !!website },
    { label: 'Description', present: !!description, detail: description ? `${description.length} chars` : undefined },
    { label: 'Hours', present: !!hours, detail: specialHours ? `special \u2713` : undefined },
    { label: 'Photos', present: photoCount > 0, detail: photoCount },
    { label: 'Services', present: serviceCount > 0, detail: serviceCount },
    { label: 'Products', present: productCount > 0, detail: productCount, warn: productCount > 0 && productCount < 5 },
    { label: 'Menu', present: !!menuPresent, warn: !menuPresent },
    { label: 'Appointment', present: !!appointmentUrl, detail: appointmentUrl ? undefined : 'n/a' },
  ];

  const presentCount = fields.filter(f => f.present).length;

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Complete" value={formatPercent(completeness)} good={Number(completeness) >= 0.8} sub={`${presentCount}/${fields.length} fields`} />
        <MetricPill label="Linked" value={linked ? 'Yes' : 'No'} good={linked} />
        <MetricPill label="Verified" value={verified ? 'Yes' : 'No'} good={verified} />
        <MetricPill label="Photos" value={formatNumber(photoCount)} good={photoCount > 5} />
        <MetricPill label="Posts/mo" value={formatNumber(postCadence)} good={Number(postCadence) >= 2} />
      </div>

      {/* Top row: Profile completeness, Category, Hours */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Profile completeness */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Profile completeness</div>
          <div className="space-y-0">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{f.label}</span>
                <span className={f.present ? (f.warn ? 'text-orange-400 text-[10px]' : 'text-green-400 text-[10px]') : 'text-red-400 text-[10px]'}>
                  {f.detail !== undefined ? f.detail : f.present ? '\u2713' : '\u2717'}
                  {f.warn && ' \u26A0'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Category</div>
          <DataRow label="Primary" value={primaryCat || '\u2014'} />
          {additionalCats.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--brand-surface-2)]">
              <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-1">Additional</div>
              <div className="flex flex-wrap gap-1">
                {additionalCats.map((cat: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded text-[10px] text-[var(--brand-text-mid)]">{cat}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Hours</div>
          {hours ? (
            <div className="text-[11px] text-[var(--brand-text-mid)]">{hours}</div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">Not set</div>
          )}
          {specialHours && (
            <div className="mt-1">
              <StatusBadge status="pass" label="Special hours \u2713" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Attributes, Posts, Q&A */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Attributes */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Attributes</div>
          {attributes.length > 0 ? (
            <div className="space-y-0">
              {attributes.slice(0, 10).map((attr: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                  <span className="text-[var(--brand-text-mid)]">{typeof attr === 'string' ? attr : attr.name || attr.label}</span>
                  <span className="text-[10px] text-green-400">\u2713</span>
                </div>
              ))}
              {attributes.length > 10 && <div className="text-[10px] text-[var(--brand-text-faint)] mt-1">+{attributes.length - 10} more</div>}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No attributes set</div>
          )}
        </div>

        {/* Posts */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Posts (30d)</div>
          <DataRow label="Count" value={formatNumber(postCadence)} status={Number(postCadence) >= 2 ? 'pass' : 'warn'} />
          <DataRow label="Last post" value={lastPost || '\u2014'} />
          {lastPostDate && <DataRow label="Date" value={lastPostDate} />}
        </div>

        {/* Q&A */}
        <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-border-2)] mb-2">Q&A</div>
          <DataRow label="Asked" value={formatNumber(questionsAsked)} />
          <DataRow
            label="Unanswered"
            value={formatNumber(questionsUnanswered)}
            status={questionsUnanswered > 0 ? 'warn' : 'pass'}
          />
        </div>
      </div>

      {/* Service areas */}
      {serviceAreas.length > 0 && (
        <Card title="Service Areas">
          <div className="flex flex-wrap gap-1.5">
            {serviceAreas.map((area: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)] border border-[var(--brand-border-2)]">{area}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Field gaps */}
      {fieldGaps.length > 0 && (
        <Card title={`Field Gaps (${fieldGaps.length})`}>
          <div className="space-y-1">
            {fieldGaps.map((gap: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{typeof gap === 'string' ? gap : gap.field || gap.name}</span>
                <StatusBadge status="warn" label="Missing" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
