import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber,
} from '../../shared';

export default function SchemaTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const hasLocalBusiness = page?.localBusinessSchema ?? page?.p_local_localBusinessSchema ?? false;
  const hasFoodEst = page?.foodEstablishmentSchema;
  const hasPostalAddress = page?.postalAddressSchema ?? page?.p_local_postalAddress;
  const hasGeo = page?.geoCoordinates ?? page?.p_local_geo;
  const hasHoursSpec = page?.openingHoursSpec ?? page?.p_local_hoursOnPage;
  const hasPriceRange = page?.priceRange;
  const hasMenu = page?.hasMenu ?? page?.p_local_hasMenu;
  const hasSameAs = page?.sameAsLinks || page?.p_local_sameAs || [];
  const hasAggRating = page?.aggregateRating ?? page?.p_local_aggregateRating;
  const hasBreadcrumb = page?.breadcrumbSchema;
  const hasFaq = page?.faqSchema;

  // Schema data
  const allSchemas = page?.schemas || page?.structuredData || [];
  const localBizSchema = Array.isArray(allSchemas)
    ? allSchemas.find((s: any) => s.type === 'LocalBusiness' || s['@type'] === 'LocalBusiness')
    : null;

  const schemaFields = localBizSchema ? {
    type: localBizSchema['@type'] || localBizSchema.type,
    name: localBizSchema.name,
    address: localBizSchema.address?.streetAddress || localBizSchema.address,
    geo: localBizSchema.geo || localBizSchema.geoCoordinates,
    hours: localBizSchema.openingHoursSpecification || localBizSchema.openingHours,
    phone: localBizSchema.telephone || localBizSchema.phone,
    priceRange: localBizSchema.priceRange,
    sameAs: localBizSchema.sameAs || [],
    aggregateRating: localBizSchema.aggregateRating,
    description: localBizSchema.description,
  } : {};

  // Checklist
  const checks = [
    { label: 'LocalBusiness', present: hasLocalBusiness },
    { label: 'FoodEstablishment', present: hasFoodEst },
    { label: 'PostalAddress', present: hasPostalAddress },
    { label: 'GeoCoordinates', present: hasGeo },
    { label: 'OpeningHoursSpec', present: hasHoursSpec, detail: hasHoursSpec ? '7 days' : undefined },
    { label: 'priceRange', present: !!hasPriceRange },
    { label: 'hasMenu', present: !!hasMenu, warn: !hasMenu },
    { label: 'sameAs', present: hasSameAs.length > 0, detail: hasSameAs.length > 0 ? `${hasSameAs.length}` : undefined },
    { label: 'aggregateRating', present: !!hasAggRating },
    { label: 'Breadcrumb', present: !!hasBreadcrumb },
    { label: 'FAQ', present: !!hasFaq },
  ];

  const presentCount = checks.filter(c => c.present).length;
  const missingChecks = checks.filter(c => !c.present);

  // Validation errors
  const validationErrors = page?.schemaValidationErrors || page?.localSchemaErrors || [];
  const validationWarnings = page?.schemaValidationWarnings || page?.localSchemaWarnings || [];

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Present" value={`${presentCount}/${checks.length}`} good={presentCount >= 7} />
        <MetricPill label="LocalBiz" value={hasLocalBusiness ? 'Yes' : 'No'} good={hasLocalBusiness} />
        <MetricPill label="Geo" value={hasGeo ? 'Yes' : 'No'} good={hasGeo} />
        <MetricPill label="Errors" value={formatNumber(validationErrors.length)} good={validationErrors.length === 0} />
        <MetricPill label="Warnings" value={formatNumber(validationWarnings.length)} good={validationWarnings.length === 0} />
      </div>

      {/* Top row: Checklist, JSON-LD, Missing */}
      <div className="grid grid-cols-2 lg:grid-cols-[1fr_1.5fr_180px] gap-2.5">
        {/* Present on location page */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Present on location page</div>
          <div className="space-y-0">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-[3px] text-[11px]">
                <span className="text-[#888]">{c.label}</span>
                <span className={c.present ? (c.warn ? 'text-orange-400 text-[10px]' : 'text-green-400 text-[10px]') : 'text-red-400 text-[10px]'}>
                  {c.detail || (c.present ? '\u2713' : '\u2717')}
                  {c.warn && ' \u26A0'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* JSON-LD */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">JSON-LD</div>
          {schemaFields.type ? (
            <div className="bg-[#060606] border border-[#1a1a1a] rounded p-2 font-mono text-[10px] text-[#aaa] leading-relaxed overflow-x-auto">
              <div>{'{'}</div>
              <div className="pl-2">{'"@type": "' + schemaFields.type + '",'}</div>
              <div className="pl-2">{'"name": "' + (schemaFields.name || '') + '",'}</div>
              {schemaFields.address && <div className="pl-2">{'"address": {"streetAddress": "' + schemaFields.address + '"},'}</div>}
              {schemaFields.geo && <div className="pl-2">{'"geo": {"lat": "...", "lng": "..."},'}</div>}
              {schemaFields.hours && <div className="pl-2">{'"openingHoursSpecification": [...],'}</div>}
              {schemaFields.phone && <div className="pl-2">{'"telephone": "' + schemaFields.phone + '",'}</div>}
              {schemaFields.priceRange && <div className="pl-2">{'"priceRange": "' + schemaFields.priceRange + '",'}</div>}
              {schemaFields.sameAs?.length > 0 && (
                <div className="pl-2">{'"sameAs": ["' + schemaFields.sameAs.slice(0, 2).join('", "') + (schemaFields.sameAs.length > 2 ? '", ...' : '"') + '],'}</div>
              )}
              {schemaFields.aggregateRating && (
                <div className="pl-2">{'"aggregateRating": {"ratingValue": ' + (schemaFields.aggregateRating.ratingValue || '4.6') + ', "reviewCount": ' + (schemaFields.aggregateRating.reviewCount || '412') + '}'}</div>
              )}
              {schemaFields.description && (
                <div className="pl-2">{'"description": "' + schemaFields.description.slice(0, 60) + (schemaFields.description.length > 60 ? '...' : '') + '"}'}</div>
              )}
              <div>{'}'}</div>
            </div>
          ) : (
            <div className="text-[11px] text-[#555]">No LocalBusiness schema found</div>
          )}
        </div>

        {/* Missing */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Missing</div>
          <div className="space-y-1">
            {missingChecks.length > 0 ? missingChecks.map((c, i) => (
              <div key={i} className="text-[11px] text-[#ccc]">{c.label}</div>
            )) : (
              <div className="text-[11px] text-green-400">All present</div>
            )}
          </div>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Card title={`Validation Errors (${validationErrors.length})`}>
          <div className="space-y-1">
            {validationErrors.map((err: any, i: number) => (
              <div key={i} className="flex items-start gap-2 py-[3px] text-[11px]">
                <span className="text-red-400 shrink-0">\u2717</span>
                <span className="text-[#ccc]">{typeof err === 'string' ? err : err.message || err.error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Validation warnings */}
      {validationWarnings.length > 0 && (
        <Card title={`Validation Warnings (${validationWarnings.length})`}>
          <div className="space-y-1">
            {validationWarnings.map((warn: any, i: number) => (
              <div key={i} className="flex items-start gap-2 py-[3px] text-[11px]">
                <span className="text-orange-400 shrink-0">\u26A0</span>
                <span className="text-[#ccc]">{typeof warn === 'string' ? warn : warn.message || warn.warning}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All schema types */}
      {Array.isArray(allSchemas) && allSchemas.length > 0 && (
        <Card title={`All Schema Types (${allSchemas.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {allSchemas.map((s: any, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[#1a1a1a] text-[#888] border border-[#222]">
                {s.type || s['@type'] || 'Unknown'}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
