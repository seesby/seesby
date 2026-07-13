import React from 'react';
import { Card, StatusBadge } from '../../shared';

function BoolIcon({ val }: { val: boolean | undefined }) {
  if (val === true) return <StatusBadge status="pass" label="Yes" />;
  if (val === false) return <StatusBadge status="fail" label="No" />;
  return <span className="text-[var(--brand-text-faint)]] text-[11px]">&mdash;</span>;
}

const SCHEMA_FOR_LLMS = [
  { key: 'Article', match: ['article'], siteWide: false },
  { key: 'Organization', match: ['organization'], siteWide: true },
  { key: 'Author', match: ['author', 'person'], siteWide: false },
  { key: 'FAQPage', match: ['faqpage'], siteWide: false },
  { key: 'HowTo', match: ['howto'], siteWide: false },
  { key: 'BreadcrumbList', match: ['breadcrumblist', 'breadcrumb'], siteWide: false },
  { key: 'AggregateRating', match: ['aggregaterating'], siteWide: false },
];

const RICH_RESULTS = [
  { key: 'Article', match: ['article'] },
  { key: 'Breadcrumb', match: ['breadcrumblist', 'breadcrumb'] },
  { key: 'FAQ', match: ['faqpage'] },
  { key: 'HowTo', match: ['howto'] },
  { key: 'Review', match: ['review', 'aggregaterating'] },
];

export default function SchemaTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const schemaTypes = page?.schemaTypes || page?.aiSchemaTypes || [];
  const presentSet = new Set((Array.isArray(schemaTypes) ? schemaTypes : []).map((s: string) => s.toLowerCase()));
  const structuredData = page?.structuredData || page?.jsonLd || [];

  // SameAs coverage
  const entities = page?.entities || [];
  const primaryEntity = entities[0] || page?.primaryEntity;
  const sameAsLinks = page?.sameAsLinks || page?.entitySameAs || {};

  // Entity anchoring
  const entityConfidence = page?.entityConfidence || primaryEntity?.confidence || null;
  const wikidataId = page?.wikidataId || primaryEntity?.wikidataId || null;
  const wikipediaUrl = page?.wikipediaUrl || primaryEntity?.wikipediaUrl || null;

  return (
    <div className="space-y-4">
      {/* Top row: 2 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Present for LLMs */}
        <Card title="Present for LLMs">
          <div className="space-y-1">
            {SCHEMA_FOR_LLMS.map(s => {
              const found = s.match.some(m => presentSet.has(m));
              return (
                <div key={s.key} className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--brand-text-mid)]]">
                    {s.key}
                    {s.siteWide && found && <span className="text-[var(--brand-text-faint)]] ml-1">(site-wide)</span>}
                  </span>
                  <BoolIcon val={found} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* sameAs coverage */}
        <Card title="sameAs coverage">
          <div className="space-y-1">
            <SameAsRow entity="Organization" source="Wikipedia" val={sameAsLinks.organization?.wikipedia} />
            <SameAsRow entity="Organization" source="LinkedIn" val={sameAsLinks.organization?.linkedin} />
            <SameAsRow entity="Organization" source="Crunchbase" val={sameAsLinks.organization?.crunchbase} />
            <SameAsRow entity="Author" source="(none)" val={sameAsLinks.author?.sameAs} />
          </div>
        </Card>
      </div>

      {/* Bottom row: 2 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Rich result eligibility */}
        <Card title="Rich result eligibility">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {RICH_RESULTS.map(r => {
              const found = r.match.some(m => presentSet.has(m));
              return (
                <div key={r.key} className="flex items-center gap-1.5 text-[11px]">
                  <BoolIcon val={found} />
                  <span className="text-[var(--brand-text-mid)]]">{r.key}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Entity anchoring */}
        <Card title="Entity anchoring">
          <div className="space-y-1.5">
            {primaryEntity && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">Primary entity</span>
                <span className="text-[var(--brand-text-strong)]">
                  {typeof primaryEntity === 'string' ? primaryEntity : primaryEntity.name || '\u2014'}
                  {entityConfidence != null && (
                    <span className="text-[var(--brand-text-faint)]] ml-1">({(entityConfidence * 100).toFixed(0)}% conf)</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]]">Wikidata QID</span>
              {wikidataId ? (
                <span className="text-[#22c55e]">{wikidataId} &#10003;</span>
              ) : (
                <span className="text-[var(--brand-text-faint)]]">&mdash;</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--brand-text-faint)]]">Wikipedia</span>
              {wikipediaUrl ? (
                <span className="text-[#22c55e]">{wikipediaUrl} &#10003;</span>
              ) : (
                <span className="text-[var(--brand-text-faint)]]">&mdash;</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SameAsRow({ entity, source, val }: { entity: string; source: string; val: boolean | string | undefined }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--brand-text-mid)]]">
        {entity} sameAs {source}
      </span>
      {val === true || val === 'present' ? (
        <StatusBadge status="pass" label="Yes" />
      ) : val === false || val === 'missing' ? (
        <StatusBadge status="fail" label="No" />
      ) : (
        <span className="text-[var(--brand-text-faint)]]">&mdash;</span>
      )}
    </div>
  );
}
