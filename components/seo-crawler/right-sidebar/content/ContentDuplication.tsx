import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { safePct } from '../_shared/format'

export function ContentDuplication() {
  const { pages } = useSeoCrawler() as any
  const s = useContentInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const html = pages?.filter((p: any) => p.isHtmlPage !== false) ?? []

  const totalDupes = s.dup.exact + s.dup.near
  const dupePct = safePct(totalDupes, s.total)
  const uniquePct = 100 - dupePct

  // ── Similarity buckets ──
  const similarityGroups = useMemo(() => {
    const groups: Record<string, number> = {
      '90-100%': 0,
      '80-90%': 0,
      '70-80%': 0,
      '60-70%': 0,
      '40-60%': 0,
      '<40%': 0,
    }
    html.forEach((p: any) => {
      const sim = p.nearDuplicateGroup ? 85 : 0
      if (sim >= 90) groups['90-100%']++
      else if (sim >= 80) groups['80-90%']++
      else if (sim >= 70) groups['70-80%']++
      else if (sim >= 60) groups['60-70%']++
      else if (sim >= 40) groups['40-60%']++
      else groups['<40%']++
    })
    return Object.entries(groups).filter(([, v]) => v > 0)
  }, [html])

  // ── Top duplicate groups ──
  const dupGroups = useMemo(() => {
    const groupMap: Record<string, any[]> = {}
    html.forEach((p: any) => {
      const g = p.nearDuplicateGroup
      if (g) {
        if (!groupMap[g]) groupMap[g] = []
        groupMap[g].push(p)
      }
    })
    return Object.entries(groupMap)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([label, pgs]) => ({
        label,
        pages: pgs.length,
        avgSimilarity: 85,
      }))
  }, [html])

  // ── Cannibalization pairs ──
  const cannibalGroups = useMemo(() => {
    const groupMap: Record<string, any[]> = {}
    html.forEach((p: any) => {
      const g = p.cannibalizedBy
      if (g) {
        if (!groupMap[g]) groupMap[g] = []
        groupMap[g].push(p)
      }
    })
    return Object.entries(groupMap)
      .filter(([, pgs]) => pgs.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([label, pgs]) => ({
        label,
        pages: pgs.length,
        keywords: pgs.reduce((a: number, p: any) => a + (p.keywords?.length || 0), 0),
      }))
  }, [html])

  // ── Cross-language duplicates ──
  const crossLangDupes = useMemo(() => {
    const byLang: Record<string, number> = {}
    html.forEach((p: any) => {
      if (p.nearDuplicateGroup || p.exactDuplicate) {
        const lang = p.language || 'unknown'
        byLang[lang] = (byLang[lang] || 0) + 1
      }
    })
    return Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [html])

  // ── Title duplicates ──
  const titleDupes = useMemo(() => {
    const titleMap: Record<string, any[]> = {}
    html.forEach((p: any) => {
      const title = (p.title || '').toLowerCase().trim()
      if (title.length > 10) {
        if (!titleMap[title]) titleMap[title] = []
        titleMap[title].push(p)
      }
    })
    return Object.entries(titleMap)
      .filter(([, pgs]) => pgs.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([title, pgs]) => ({
        label: title.slice(0, 50),
        pages: pgs.length,
      }))
  }, [html])

  // ── Canonical mismatches ──
  const canonMismatches = useMemo(() => html
    .filter((p: any) => p.canonical && p.canonical !== p.url)
    .slice(0, 6), [html])

  // ── Recommended actions ──
  const recommendedMerges = s.dup.exact + s.dup.near
  const recommendedDeprecations = html.filter((p: any) =>
    (p.wordCount || 0) < 100 && (p.gscClicks || 0) === 0
  ).length

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Overview HealthStrip */}
      <Card title="Duplication overview">
        <HealthStrip
          total={s.total}
          segments={[
            { label: 'Unique', value: s.total - totalDupes, color: '#22c55e' },
            { label: 'Near-dupes', value: s.dup.near, color: '#f59e0b' },
            { label: 'Exact dupes', value: s.dup.exact, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <KpiTile label="Near-dupes" value={String(s.dup.near)} tone={s.dup.near > 0 ? 'warn' : 'good'} />
          <KpiTile label="Exact dupes" value={String(s.dup.exact)} tone={s.dup.exact > 0 ? 'bad' : 'good'} />
          <KpiTile label="Cannibal." value={String(s.dup.cannibal)} tone={s.dup.cannibal > 0 ? 'warn' : 'good'} />
        </div>
      </Card>

      {/* Similarity — always show */}
      <Card title="Similarity distribution">
        {similarityGroups.length > 0 ? (
          <HealthStrip
            total={similarityGroups.reduce((a, [, v]) => a + v, 0)}
            segments={similarityGroups.map(([range, count]) => ({
              label: range,
              value: count,
              color: range === '90-100%' ? '#ef4444' : range === '80-90%' ? '#f59e0b' : '#f97316',
            }))}
          />
        ) : (
          <div className="text-[11px] text-[#555] py-2">No similarity data available</div>
        )}
      </Card>

      {/* Duplicate groups — always show */}
      <Card title={`Duplicate groups ${dupGroups.length}`} padded={false}>
        <div className="px-2 pt-2 pb-1 text-[10px] text-[#666]">
          Groups of pages with similar content
        </div>
        {dupGroups.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {dupGroups.map((g, i) => (
              <RowItem
                key={i}
                title={g.label}
                meta={`${g.pages} pages · ${g.avgSimilarity}% similarity`}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{g.pages}</span>}
                onClick={() => drill.toCategory('content', g.label)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#555] px-2 py-2 border-t border-[#1f1f1f]">No duplicate groups found</div>
        )}
      </Card>

      {/* Cannibalization — always show */}
      <Card title={`Cannibalization ${cannibalGroups.length}`} padded={false}>
        <div className="px-2 pt-2 pb-1 text-[10px] text-[#666]">
          Pages competing for the same keywords
        </div>
        {cannibalGroups.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {cannibalGroups.map((g, i) => (
              <RowItem
                key={i}
                title={g.label}
                meta={`${g.pages} pages · ${g.keywords} keywords`}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{g.pages}</span>}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#555] px-2 py-2 border-t border-[#1f1f1f]">No cannibalization detected</div>
        )}
      </Card>

      {/* Title overlap — always show */}
      <Card title="Title overlap">
        {titleDupes.length > 0 ? (
          <Distribution rows={titleDupes.map(g => ({
            label: g.label,
            value: g.pages,
            tone: 'warn' as const,
          }))} />
        ) : (
          <div className="text-[11px] text-[#555] py-2">No title duplicates found</div>
        )}
      </Card>

      {/* Cross-language — always show */}
      <Card title="Cross-language dupes">
        {crossLangDupes.length > 0 ? (
          <Distribution rows={crossLangDupes.map(([lang, count]) => ({
            label: lang,
            value: count,
            tone: 'warn' as const,
          }))} />
        ) : (
          <div className="text-[11px] text-[#555] py-2">No cross-language duplicates</div>
        )}
      </Card>

      {/* Canonical mismatches — always show */}
      <Card title={`Canonical mismatches ${canonMismatches.length}`} padded={false}>
        {canonMismatches.length > 0 ? (
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {canonMismatches.map((p: any, i: number) => (
              <RowItem
                key={i}
                title={(p.title || p.url || '').slice(0, 50)}
                meta={`canonical: ${(p.canonical || '').slice(0, 40)}`}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">mismatch</span>}
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#555] px-2 py-2 border-t border-[#1f1f1f]">All canonicals match</div>
        )}
      </Card>

      {/* Recommended actions — always show */}
      <Card title="Recommended actions" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {recommendedMerges > 0 && (
            <RowItem
              title="Merge duplicate pages"
              meta="Combine near-duplicates into single canonical pages"
              badge={<span className="text-[10px] font-mono text-[#f59e0b]">{recommendedMerges}</span>}
            />
          )}
          {recommendedDeprecations > 0 && (
            <RowItem
              title="Deprecate thin pages"
              meta="Pages with <100 words and no traffic"
              badge={<span className="text-[10px] font-mono text-[#ef4444]">{recommendedDeprecations}</span>}
            />
          )}
          {recommendedMerges === 0 && recommendedDeprecations === 0 && (
            <div className="text-[11px] text-[#555] px-2 py-2">No actions needed</div>
          )}
        </div>
      </Card>
    </div>
  )
}
