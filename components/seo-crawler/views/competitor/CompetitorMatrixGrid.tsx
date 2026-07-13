import { useMemo, useState, Fragment } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import {
  COMPARISON_ROWS,
  type CompetitorProfile,
  type ComparisonRowDef,
} from '../../../../services/CompetitorMatrixConfig';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChevronsUpDown,
} from 'lucide-react';
import { YOU_BADGE } from '../../competitive/shared/styles';
import PageCompareDrawer from '../../competitive/PageCompareDrawer';

// ─── Helpers ────────────────────────────────────
function getProfileValue(
  profile: CompetitorProfile | null,
  profileKey: string
): any {
  if (!profile) return null;
  const parts = profileKey.split('.');
  let val: any = profile;
  for (const part of parts) {
    if (val == null) return null;
    val = val[part];
  }
  return val;
}

function formatCell(value: any, format: string): string {
  if (value == null || value === '') return '—';
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'score_100':
      return `${value}/100`;
    case 'rating_5':
      return `${value}/5`;
    case 'percentage':
      return `${(Number(value) * 100).toFixed(1)}%`;
    case 'currency':
      return typeof value === 'number'
        ? `$${value.toLocaleString()}`
        : `$${String(value)}`;
    case 'boolean':
      return value ? '✅' : '❌';
    case 'url': {
      try {
        const u = new URL(String(value));
        return u.pathname === '/' ? u.hostname : u.pathname;
      } catch {
        return String(value);
      }
    }
    case 'list':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'text':
    default:
      return String(value);
  }
}

type CellComparison = 'winning' | 'losing' | 'tie' | 'neutral';

function compareCells(
  ownVal: any,
  compVal: any,
  format: string
): CellComparison {
  if (ownVal == null || compVal == null) return 'neutral';
  if (format === 'boolean') {
    return ownVal === compVal ? 'tie' : ownVal ? 'winning' : 'losing';
  }
  if (['text', 'url', 'list'].includes(format)) {
    return 'neutral';
  }
  const ownNum = Number(ownVal);
  const compNum = Number(compVal);
  if (isNaN(ownNum) || isNaN(compNum)) return 'neutral';
  if (ownNum > compNum) return 'winning';
  if (ownNum < compNum) return 'losing';
  return 'tie';
}

const CELL_TEXT: Record<CellComparison, string> = {
  winning: 'text-emerald-400',
  losing: 'text-red-400',
  tie: 'text-[var(--brand-text-mid)]]',
  neutral: 'text-[var(--brand-text-mid)]]',
};

const CELL_BG: Record<CellComparison, string> = {
  winning: 'bg-emerald-500/5',
  losing: 'bg-red-500/5',
  tie: '',
  neutral: '',
};

// ─── Trend indicator ───
function TrendArrow({ comparison }: { comparison: CellComparison }) {
  if (comparison === 'winning') {
    return <span className="ml-1 text-[9px] text-emerald-500">▲</span>;
  }
  if (comparison === 'losing') {
    return <span className="ml-1 text-[9px] text-red-500">▼</span>;
  }
  return null;
}

// ─── Component ──────────────────────────────────
export default function CompetitorMatrixGrid() {
  const { competitiveState } = useSeoCrawler();
  const { ownProfile, competitorProfiles, activeCompetitorDomains } =
    competitiveState;

  const activeComps = useMemo(
    () =>
      activeCompetitorDomains
        .map((d) => competitorProfiles.get(d))
        .filter(Boolean) as CompetitorProfile[],
    [activeCompetitorDomains, competitorProfiles]
  );

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [pageCompareTarget, setPageCompareTarget] = useState<{ url: string; title: string } | null>(null);

  // Group rows by category
  const groupedRows = useMemo(() => {
    const categoryOrder = [
      'Business Profile',
      'Search Visibility',
      'Content',
      'Authority & Links',
      'Technical Health',
      'AI Discoverability',
      'User Experience & Conversion',
      'Social Media',
      'Paid & Advertising',
      'Reviews & Reputation',
      'E-commerce & Pricing',
      'Local SEO',
      'Top Pages',
      'Threat & Opportunity',
    ];

    const rowOrderByCategory: Record<string, string[]> = {
      'Search Visibility': [
        'Est. Organic Traffic',
        'Traffic Trend (30d %)',
        'Total Ranking Keywords',
        'Keywords in Top 3',
        'Keywords in Top 10',
        'Keywords in Top 20',
        'Avg Organic Position',
        'Branded Traffic %',
        'Branded Search Volume',
        'Share of Voice',
        'Keyword Overlap %',
        'SERP Features Owned',
        'Featured Snippets',
        'Has Knowledge Panel?',
        'Google Indexed Pages',
        'Monthly Growth Rate %',
      ],
      Content: [
        'Total Indexable Pages',
        'Avg Words Per Page',
        'Content Type Breakdown',
        'Actively Blogging?',
        'Blog Posts Per Month',
        'Content Quality',
        'Content Freshness Score',
        'Publishing Velocity Trend %',
        'Topic Clusters',
        'Content Efficiency',
        'Duplicate Content %',
        'Thin Content %',
        'Schema Coverage %',
        'FAQ / How-To Pages',
        'Avg Images Per Article',
        'Uses Video in Articles?',
        'Avg Internal Links Per Page',
        'Top Nav Items',
      ],
      'Authority & Links': [
        'Overall SEO Score',
        'Ahrefs DR',
        'Moz DA',
        'Trust Flow',
        'Citation Flow',
        'Spam Score',
        'Referring Domains',
        'Total Backlinks',
        'Link Velocity (60d)',
        'Backlink Quality Score',
        'Common Linking Domains',
        'Avg RD to Content Pages',
      ],
      'Technical Health': [
        'Tech Health Score',
        'Site Speed Score',
        'Core Web Vitals Pass %',
        'Mobile Friendliness',
        'Crawlability Score',
        'Security Grade',
        'JS Render Dependency %',
        'CDN Provider',
        'Hosting Provider',
        'Email Provider',
        'Tech Stack',
        'On-Page SEO Quality',
      ],
      'AI Discoverability': [
        'Avg GEO Score',
        'Avg Citation Worthiness',
        'llms.txt Present?',
        'AI Bot Access Policy',
        'Passage-Ready Content %',
        'Featured Snippet Ready %',
      ],
      'User Experience & Conversion': [
        'Avg Bounce Rate %',
        'Avg Session Duration (s)',
        'Pages Per Visit',
        'Conversion Paths',
        'CTA Density Score',
        'Trust Signal Score',
        'Email Opt-In Quality',
        'Opt-In Offer',
        'Live Chat / Chatbot?',
        'Free Trial / Freemium?',
        'Pricing Model',
      ],
      'Social Media': [
        'Total Followers',
        'Social Growth Rate %',
        'Facebook URL',
        'Facebook Fans',
        'Facebook Posts/Mo',
        'Facebook Engagement',
        'X (Twitter) URL',
        'X Followers',
        'X Posts/Mo',
        'Instagram URL',
        'Instagram Followers',
        'Instagram Avg Likes',
        'YouTube URL',
        'YouTube Subscribers',
        'YouTube Videos',
        'YouTube Uploads/Mo',
        'LinkedIn URL',
        'LinkedIn Followers',
        'TikTok URL',
        'TikTok Followers',
      ],
      'Paid & Advertising': [
        'Est. PPC Clicks/Mo',
        'Est. Ad Budget/Mo',
        'PPC Keywords Count',
        'Display Ads Count',
        'Ad Platforms Detected',
        'Conversion Tracking?',
        'Remarketing Tags?',
      ],
      'Reviews & Reputation': [
        'Overall Review Score',
        'Total Reviews',
        'Trustpilot Score',
        'Trustpilot Reviews',
        'G2 Rating',
        'G2 Reviews',
        'Capterra Rating',
        'Capterra Reviews',
        'Google Rating',
        'Google Reviews',
        'Unlinked Brand Mentions',
        'Targeted Landing Pages?',
      ],
    };

    const grouped = new Map<string, ComparisonRowDef[]>();
    for (const row of COMPARISON_ROWS) {
      if (!grouped.has(row.category)) grouped.set(row.category, []);
      grouped.get(row.category)!.push(row);
    }

    const rank = (category: string, label: string) => {
      const order = rowOrderByCategory[category];
      if (!order) return Number.MAX_SAFE_INTEGER;
      const idx = order.indexOf(label);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    return [...grouped.entries()]
      .sort((a, b) => {
        const ai = categoryOrder.indexOf(a[0]);
        const bi = categoryOrder.indexOf(b[0]);
        const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return ar - br;
      })
      .map(([category, rows]) => ({
        category,
        rows: [...rows].sort((a, b) => rank(category, a.label) - rank(category, b.label)),
      }));
  }, []);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAll = () => {
    const allCategories = groupedRows.map((g) => g.category);
    if (collapsedCategories.size === allCategories.length) {
      // All collapsed → expand all
      setCollapsedCategories(new Set());
    } else {
      // Collapse all
      setCollapsedCategories(new Set(allCategories));
    }
  };

  // Win/loss counters per competitor
  const winLossCounts = useMemo(() => {
    return activeComps.map((comp) => {
      let wins = 0;
      let losses = 0;
      let ties = 0;
      for (const row of COMPARISON_ROWS) {
        const ownVal = getProfileValue(ownProfile, String(row.profileKey));
        const compVal = getProfileValue(comp, String(row.profileKey));
        const result = compareCells(ownVal, compVal, row.format);
        if (result === 'winning') wins++;
        else if (result === 'losing') losses++;
        else if (result === 'tie') ties++;
      }
      return { domain: comp.domain, wins, losses, ties };
    });
  }, [ownProfile, activeComps]);

  const allProfiles = [ownProfile, ...activeComps].filter(
    Boolean
  ) as CompetitorProfile[];
  const compCount = allProfiles.length;

  if (compCount === 0) return null;

  const allCollapsed = collapsedCategories.size === groupedRows.length;

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-[var(--brand-surface-0)]]">
      <table className="w-full border-collapse text-[11px]">
        {/* ─── Sticky Header ─── */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-[var(--brand-surface-1)]] border-b border-[var(--brand-border-2)]]">
            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-text-faint)]] min-w-[200px] bg-[var(--brand-surface-1)]]">
              <div className="flex items-center gap-2">
                <span>Metric</span>
                <button
                  onClick={toggleAll}
                  className="p-0.5 rounded hover:bg-[var(--brand-border-2)]] text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]] transition-colors"
                  title={allCollapsed ? 'Expand all' : 'Collapse all'}
                >
                  <ChevronsUpDown size={12} />
                </button>
              </div>
            </th>
            {allProfiles.map((profile, i) => (
              <th
                key={profile.domain}
                className={`py-2.5 px-3 text-center min-w-[140px] ${
                  i === 0 ? 'bg-[#F59E0B]/[0.03]' : 'bg-[var(--brand-surface-1)]]'
                }`}
              >
                <div className="text-[11px] font-bold text-[var(--brand-text-strong)] truncate max-w-[130px] mx-auto">
                  {profile.domain}
                </div>
                {i === 0 && (
                  <span className={YOU_BADGE}>
                    YOU
                  </span>
                )}
                {i > 0 && winLossCounts[i - 1] && (
                  <div className="text-[9px] mt-0.5">
                    <span className="text-emerald-400 font-bold">
                      {winLossCounts[i - 1].wins}W
                    </span>
                    <span className="text-[var(--brand-surface-4)]] mx-0.5">/</span>
                    <span className="text-red-400 font-bold">
                      {winLossCounts[i - 1].losses}L
                    </span>
                  </div>
                )}
                <div className="mt-1">
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                    profile.dataConfidence === 'high'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : profile.dataConfidence === 'medium'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-zinc-500/10 text-zinc-300'
                  }`}>
                    {profile.dataConfidence || 'unknown'}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groupedRows.map((group) => {
            const isCollapsed = collapsedCategories.has(group.category);
            return (
              <Fragment key={group.category}>
                {/* Category header row */}
                <tr
                  onClick={() => toggleCategory(group.category)}
                  className="cursor-pointer bg-[var(--brand-surface-2)]] border-y border-[var(--brand-surface-3)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                >
                  <td colSpan={compCount + 1} className="py-2 px-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--brand-text-faint)]]">
                      {isCollapsed ? (
                        <ChevronRight size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      {group.category}
                      <span className="text-[9px] font-normal text-[var(--brand-border-2)]] ml-1">
                        ({group.rows.length})
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Data rows */}
                {!isCollapsed &&
                  group.rows.map((row) => {
                    const ownVal = getProfileValue(
                      ownProfile,
                      String(row.profileKey)
                    );
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--brand-surface-2)]] hover:bg-[var(--brand-surface-1)]] transition-colors"
                      >
                        <td className="py-1.5 px-3 text-[11px] text-[var(--brand-text-mid)]]">
                          <div className="flex items-center gap-1">
                            {row.label}
                            {row.tooltip && (
                              <span
                                title={row.tooltip}
                                className="text-[var(--brand-surface-4)]] cursor-help"
                              >
                                ⓘ
                              </span>
                            )}
                          </div>
                        </td>
                        {allProfiles.map((profile, i) => {
                          const val = getProfileValue(
                            profile,
                            String(row.profileKey)
                          );
                          const comparison: CellComparison =
                            i === 0
                              ? 'neutral'
                              : compareCells(ownVal, val, row.format);
                          const formatted = formatCell(val, row.format);
                          const isUrl = row.format === 'url' && val;
                          return (
                            <td
                              key={`${row.id}-${profile.domain}`}
                              className={`py-1.5 px-3 text-center font-mono text-[11px] ${
                                i === 0
                                  ? 'text-[var(--brand-text-strong)] bg-[#F59E0B]/[0.03]'
                                  : `${CELL_TEXT[comparison]} ${CELL_BG[comparison]}`
                              }`}
                            >
                              {isUrl ? (
                                <a
                                  href={String(val)}
                                  onClick={(event) => {
                                    if (i > 0) {
                                      event.preventDefault();
                                      setPageCompareTarget({
                                        url: String(val),
                                        title: row.label,
                                      });
                                      return;
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  {formatted}
                                  <ExternalLink size={9} />
                                </a>
                              ) : (
                                <span>
                                  {formatted}
                                  {i > 0 && (
                                    <TrendArrow comparison={comparison} />
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {pageCompareTarget && (
        <PageCompareDrawer
          competitorUrl={pageCompareTarget.url}
          competitorTitle={pageCompareTarget.title}
          onClose={() => setPageCompareTarget(null)}
        />
      )}
    </div>
  );
}
