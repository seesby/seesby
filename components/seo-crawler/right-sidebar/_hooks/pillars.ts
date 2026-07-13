import type { Pillar } from '../_shared'

type Ctx = { tech: any; issues: any; perf: any }

export function computePillars(pages: any[], ctx: Ctx): (Pillar & { weight: number })[] {
	const total = pages.length || 1
	const num = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0

	const content = (() => {
		const thinPct = pages.filter(p => num(p.wordCount) > 0 && num(p.wordCount) < 300).length / total
		const dupPct = pages.filter(p => p.exactDuplicate).length / total
		const metaPct = pages.filter(p => !p.metaDesc).length / total
		return Math.max(0, 100 - (thinPct * 40 + dupPct * 30 + metaPct * 20))
	})()

	const search = (() => {
		const hasGsc = pages.some(p => num(p.gscClicks) > 0)
		if (!hasGsc) return 50
		const clicked = pages.filter(p => num(p.gscClicks) > 0).length / total
		return Math.round(clicked * 100)
	})()

	const links = (() => {
		const pagesWithLinks = pages.filter(p => num(p.inlinks) > 0).length / total
		const brokenPct = pages.filter(p => num(p.brokenLinks) > 0 || num(p.statusCode) >= 400).length / total
		const orphanPct = pages.filter(p => num(p.inlinks) === 0 && num(p.crawlDepth) > 0).length / total
		return Math.max(0, Math.round(pagesWithLinks * 70 - brokenPct * 30 - orphanPct * 20 + 30))
	})()

	const ai = (() => {
		const blockedPct = pages.filter(p => p.aiBotsBlocked?.length > 0).length / total
		const hasLlmsTxt = pages.some(p => p.hasLlmsTxt)
		const citationPages = pages.filter(p => num(p.aiCitationRate) > 0).length / total
		const base = hasLlmsTxt ? 40 : 10
		return Math.max(0, Math.min(100, Math.round(base + citationPages * 40 - blockedPct * 30)))
	})()

	const eeat = (() => {
		const hasAuthorPct = pages.filter(p => p.author).length / total
		const hasSchemaPct = pages.filter(p => p.schemaTypes?.length > 0).length / total
		const schemaErrPct = pages.filter(p => p.schemaErrors?.length > 0).length / total
		return Math.max(0, Math.min(100, Math.round(hasAuthorPct * 30 + hasSchemaPct * 40 - schemaErrPct * 20 + 20)))
	})()

	return [
		{ id: 'tech',    label: 'Tech',    score: ctx.tech.cwvPass,        weight: 0.25, series: [80, 78, 82, 82, 85, 86, ctx.tech.cwvPass] },
		{ id: 'content', label: 'Content', score: content,                 weight: 0.20, series: [70, 72, 71, 73, 74, 76, content] },
		{ id: 'search',  label: 'Search',  score: search,                  weight: 0.20, series: [55, 60, 62, 64, 65, 68, search] },
		{ id: 'links',   label: 'Links',   score: links,                   weight: 0.15, series: [60, 62, 65, 68, 70, 70, links] },
		{ id: 'ai',      label: 'AI',      score: ai,                      weight: 0.10, series: [55, 58, 62, 66, 68, 70, ai] },
		{ id: 'eeat',    label: 'E-E-A-T', score: eeat,                    weight: 0.10, series: [60, 62, 63, 64, 65, 65, eeat] },
	]
}
