import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'
import { safePct } from '../_shared/format'

const KNOWN_AI_BOTS = [
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot',
  'CCBot', 'Bytespider', 'OAI-SearchBot', 'Applebot-Extended',
  'Amazonbot', 'anthropic-ai', 'cohere-ai', 'YouBot', 'Diffbot',
  'MistralAI-User', 'Meta-ExternalAgent', 'DuckAssistBot',
]

export function useAiInsights() {
  const { pages, robotsTxt, compareSession } = useSeoCrawler() as any
  const hasTrend = useHasTrend()

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage)

    // --- previous session (for comparison) ---
    const prevPages = compareSession?.pages || []

    // --- robots.txt analysis ---
    const rawRules = robotsTxt?.raw || ''
    const aiBotRules = robotsTxt?.aiBotRules || {}
    const hasLlmsTxt = robotsTxt?.hasLlmsTxt ?? false
    const sitemaps = robotsTxt?.sitemaps || []

    // Per-bot access
    const botList = KNOWN_AI_BOTS.map(name => {
      const status = aiBotRules[name]
        ? (aiBotRules[name] ? 'Allowed' : 'Blocked')
        : parseBotFromRobotsTxt(rawRules, name)
      return { name, status }
    })

    const botsAllowed = botList.filter(b => b.status === 'Allowed').length
    const botsPartial = botList.filter(b => b.status === 'Partial').length
    const botsBlocked = botList.filter(b => b.status === 'Blocked').length
    const botsUnknown = botList.filter(b => b.status === 'Unknown').length
    const botsTotal = botsAllowed + botsPartial + botsBlocked + botsUnknown

    // --- crawlability ---
    const blockedPages = html.filter((p: any) => {
      const access = p.aiBotAccessSummary || ''
      return access.toLowerCase().includes('blocked')
    }).slice(0, 10)

    const partialPages = html.filter((p: any) => {
      const access = p.aiBotAccessSummary || ''
      return access.toLowerCase().includes('partial')
    }).slice(0, 10)

    const uncitedPages = html.filter((p: any) => (p.citationCount || 0) === 0)

    // Group by template
    const templateMap = new Map<string, { pages: number; allowed: number; blocked: number; partial: number; cited: number }>()
    html.forEach((p: any) => {
      const tmpl = p.template || p.pageTemplate || guessTemplate(p.url)
      const existing = templateMap.get(tmpl) || { pages: 0, allowed: 0, blocked: 0, partial: 0, cited: 0 }
      existing.pages++
      const access = (p.aiBotAccessSummary || '').toLowerCase()
      if (access.includes('blocked')) existing.blocked++
      else if (access.includes('partial')) existing.partial++
      else existing.allowed++
      if ((p.citationCount || 0) > 0) existing.cited++
      templateMap.set(tmpl, existing)
    })

    const byTemplate = Array.from(templateMap.entries())
      .map(([id, data]) => ({ id, label: id, ...data }))
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 8)

    const crawlabilityScore = computeCrawlabilityScore(botsAllowed, botsPartial, botsBlocked, html.length, blockedPages.length)
    const allowedPages = html.length - blockedPages.length - partialPages.length

    // Previous session crawlability
    const prevHtml = prevPages.filter((p: any) => p.isHtmlPage)
    const prevBlockedPages = prevHtml.filter((p: any) => (p.aiBotAccessSummary || '').toLowerCase().includes('blocked'))
    const prevCrawlabilityScore = prevHtml.length > 0
      ? computeCrawlabilityScore(
          countBots(prevHtml, 'allowed'), countBots(prevHtml, 'partial'),
          countBots(prevHtml, 'blocked'), prevHtml.length, prevBlockedPages.length
        )
      : NaN

    // --- citations ---
    const citedPages = html.filter((p: any) => (p.citationCount || 0) > 0)
    const totalCitations = citedPages.reduce((sum: number, p: any) => sum + (p.citationCount || 0), 0)

    const byEngine = {
      chatgpt: citedPages.filter((p: any) => p.citedByChatGpt).length,
      gemini: citedPages.filter((p: any) => p.citedByGemini).length,
      perplexity: citedPages.filter((p: any) => p.citedByPerplexity).length,
      claude: citedPages.filter((p: any) => p.citedByClaude).length,
      bing: citedPages.filter((p: any) => p.citedByBing).length,
    }

    // Intent mix
    const intentMap = { info: 0, comm: 0, tx: 0, nav: 0 }
    citedPages.forEach((p: any) => {
      const intent = p.searchIntent || ''
      if (intent === 'informational') intentMap.info++
      else if (intent === 'commercial') intentMap.comm++
      else if (intent === 'transactional') intentMap.tx++
      else if (intent === 'navigational') intentMap.nav++
    })

    // Top cited pages
    const topCitedPages = [...citedPages]
      .sort((a: any, b: any) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 10)
      .map((p: any) => ({ ...p, citations: p.citationCount || 0 }))

    // Top queries
    const topQueries = html
      .flatMap((p: any) => (p.citationQueries || []).map((q: string) => ({ query: q, url: p.url })))
      .reduce((acc: Map<string, number>, item) => {
        acc.set(item.query, (acc.get(item.query) || 0) + 1)
        return acc
      }, new Map())
    const topQueriesList = Array.from(topQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    const citationRate = safePct(citedPages.length, html.length)

    // Previous session citations
    const prevCitedPages = prevHtml.filter((p: any) => (p.citationCount || 0) > 0)
    const prevTotalCitations = prevCitedPages.reduce((sum: number, p: any) => sum + (p.citationCount || 0), 0)

    // --- entities ---
    const entityMap = new Map<string, { type: string; pages: Set<string>; citations: number }>()
    html.forEach((p: any) => {
      const entities = p.entities || []
      entities.forEach((e: any) => {
        const key = e.name || e.label
        if (!key) return
        const existing = entityMap.get(key) || { type: e.type || 'Unknown', pages: new Set(), citations: 0 }
        existing.pages.add(p.url)
        existing.citations += e.count || 1
        entityMap.set(key, existing)
      })
    })

    const entityList = Array.from(entityMap.entries())
      .map(([name, data]) => ({
        label: name,
        type: data.type,
        pages: data.pages.size,
        citations: data.citations,
      }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 20)

    // Entity type breakdown
    const typeMap = new Map<string, number>()
    entityList.forEach(e => typeMap.set(e.type, (typeMap.get(e.type) || 0) + 1))
    const entityTypes = {
      person: typeMap.get('Person') || 0,
      org: typeMap.get('Organization') || 0,
      product: typeMap.get('Product') || 0,
      event: typeMap.get('Event') || 0,
      place: typeMap.get('Place') || 0,
      other: Array.from(typeMap.values()).reduce((s, v) => s + v, 0)
        - (typeMap.get('Person') || 0) - (typeMap.get('Organization') || 0)
        - (typeMap.get('Product') || 0) - (typeMap.get('Event') || 0)
        - (typeMap.get('Place') || 0),
    }

    // SameAs coverage
    const entitiesWithSameAs = entityList.filter(e => e.type !== 'Unknown').length
    const sameAsCoverage = safePct(entitiesWithSameAs, entityList.length)

    // Entity density
    const totalEntityMentions = entityList.reduce((sum, e) => sum + e.citations, 0)
    const entityDensity = html.length > 0 ? (totalEntityMentions / html.length).toFixed(1) : '0'

    // Pages with most entities (for top list)
    const pagesByEntities = [...html]
      .map((p: any) => ({ url: p.url, title: p.title, count: (p.entities || []).length }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Previous session entities
    const prevEntityMap = new Map<string, number>()
    prevHtml.forEach((p: any) => {
      (p.entities || []).forEach((e: any) => {
        const key = e.name || e.label
        if (key) prevEntityMap.set(key, (prevEntityMap.get(key) || 0) + 1)
      })
    })
    const prevEntityCount = prevEntityMap.size

    // --- schema ---
    const pagesWithSchema = html.filter((p: any) => {
      const types = p.schemaTypes || []
      return types.length > 0
    })

    const schemaTypeMap = new Map<string, number>()
    pagesWithSchema.forEach((p: any) => {
      const types = p.schemaTypes || []
      types.forEach((t: string) => schemaTypeMap.set(t, (schemaTypeMap.get(t) || 0) + 1))
    })

    const schemaTypes = Array.from(schemaTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // AI-key fields coverage
    const fieldsAbout = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.about || sd.mentions
    }).length
    const fieldsSameAs = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.sameAs
    }).length
    const fieldsAuthor = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.author
    }).length
    const fieldsDatePublished = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.datePublished || sd.dateModified
    }).length
    const fieldsDescription = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.description
    }).length
    const fieldsImage = html.filter((p: any) => {
      const sd = p.structuredData || {}
      return sd.image
    }).length

    const schemaFields = {
      about: safePct(fieldsAbout, html.length),
      sameAs: safePct(fieldsSameAs, html.length),
      author: safePct(fieldsAuthor, html.length),
      datePublished: safePct(fieldsDatePublished, html.length),
      description: safePct(fieldsDescription, html.length),
      image: safePct(fieldsImage, html.length),
    }

    const schemaScore = computeSchemaScore(pagesWithSchema.length, html.length, schemaFields)

    // Pages missing schema
    const missingSchemaPages = html
      .filter((p: any) => !p.schemaTypes || p.schemaTypes.length === 0)
      .slice(0, 10)

    // Pages with schema errors
    const schemaErrorPages = html
      .filter((p: any) => p.schemaErrors && p.schemaErrors.length > 0)
      .slice(0, 10)

    const schemaCoverage = safePct(pagesWithSchema.length, html.length)

    // Previous session schema
    const prevPagesWithSchema = prevHtml.filter((p: any) => (p.schemaTypes || []).length > 0)
    const prevSchemaScore = prevHtml.length > 0
      ? computeSchemaScore(prevPagesWithSchema.length, prevHtml.length, {
          about: safePct(prevHtml.filter((p: any) => p.structuredData?.about || p.structuredData?.mentions).length, prevHtml.length),
          sameAs: safePct(prevHtml.filter((p: any) => p.structuredData?.sameAs).length, prevHtml.length),
          author: safePct(prevHtml.filter((p: any) => p.structuredData?.author).length, prevHtml.length),
          datePublished: safePct(prevHtml.filter((p: any) => p.structuredData?.datePublished || p.structuredData?.dateModified).length, prevHtml.length),
        })
      : NaN

    // --- overall score ---
    const score = computeOverallScore(crawlabilityScore, totalCitations, entityList.length, schemaScore)
    const prevScore = !Number.isNaN(prevCrawlabilityScore) && prevHtml.length > 0
      ? computeOverallScore(
          prevCrawlabilityScore,
          prevTotalCitations,
          prevEntityCount,
          prevSchemaScore
        )
      : NaN

    // --- quick issues (for overview) ---
    const quickIssues: Array<{ label: string; tone: 'bad' | 'warn' | 'info'; tab: string }> = []
    if (botsBlocked > 0) quickIssues.push({ label: `${botsBlocked} AI bot(s) blocked`, tone: 'bad', tab: 'crawlability' })
    if (!hasLlmsTxt) quickIssues.push({ label: 'llms.txt not found', tone: 'warn', tab: 'crawlability' })
    if (schemaScore < 50) quickIssues.push({ label: 'Schema coverage is low', tone: 'warn', tab: 'schema' })
    if (blockedPages.length > 0) quickIssues.push({ label: `${blockedPages.length} pages blocked from AI`, tone: 'bad', tab: 'crawlability' })
    if (entityList.length === 0) quickIssues.push({ label: 'No entities detected', tone: 'warn', tab: 'entities' })
    if (totalCitations === 0) quickIssues.push({ label: 'No AI citations found', tone: 'warn', tab: 'citations' })
    if (uncitedPages.length > 0 && uncitedPages.length === html.length) quickIssues.push({ label: 'No pages are cited by AI', tone: 'bad', tab: 'citations' })

    // --- history (for sparklines) ---
    const sessions = (pages as any)?.sessions || []
    const scoreHistory = sessions.map((s: any) => s.aiScore ?? score)
    const citationHistory = sessions.map((s: any) => s.citationCount ?? totalCitations)
    const entityHistory = sessions.map((s: any) => s.entityCount ?? entityList.length)
    const schemaHistory = sessions.map((s: any) => s.schemaScore ?? schemaScore)

    return {
      score,
      scorePrev: prevScore,
      hasTrend,
      total: html.length,
      totalPrev: prevHtml.length,
      bots: {
        allowed: botsAllowed,
        partial: botsPartial,
        blocked: botsBlocked,
        unknown: botsUnknown,
        total: botsTotal,
        list: botList,
        allowedPct: safePct(botsAllowed, botsTotal),
      },
      crawlability: {
        score: crawlabilityScore,
        scorePrev: prevCrawlabilityScore,
        blockedPages,
        partialPages,
        uncitedPages,
        allowedPages,
        byTemplate,
        blockedCount: blockedPages.length,
        partialCount: partialPages.length,
      },
      llmsTxt: hasLlmsTxt,
      llmsTxtDetails: {
        status: hasLlmsTxt ? 'Present' : 'Missing',
        entries: countLlmsTxtEntries(rawRules),
        sitemaps: sitemaps.length,
      },
      robotsTxt: {
        hasRules: rawRules.length > 0,
        ruleCount: countRules(rawRules),
        hasAiRules: Object.keys(aiBotRules).length > 0,
      },
      citations: {
        total: totalCitations,
        totalPrev: prevTotalCitations,
        uniquePages: citedPages.length,
        uncitedCount: uncitedPages.length,
        byEngine,
        byIntent: intentMap,
        topPages: topCitedPages,
        topQueries: topQueriesList,
        topEngine: getTopEngine(byEngine),
        rate: citationRate,
        engineCount: Object.values(byEngine).filter(v => v > 0).length,
      },
      entities: {
        list: entityList,
        types: entityTypes,
        sameAsCoverage,
        totalEntities: entityList.length,
        totalPrev: prevEntityCount,
        density: entityDensity,
        pagesByEntities,
        typeCount: Object.values(entityTypes).filter(v => v > 0).length,
      },
      schema: {
        score: schemaScore,
        scorePrev: prevSchemaScore,
        coverage: schemaCoverage,
        types: schemaTypes,
        fields: schemaFields,
        fieldCount: Object.keys(schemaFields).length,
        fieldsPresent: Object.values(schemaFields).filter(v => Number(v) > 0).length,
        missingPages: missingSchemaPages,
        errorPages: schemaErrorPages,
        pagesWithSchema: pagesWithSchema.length,
        totalPages: html.length,
      },
      quickIssues: quickIssues.slice(0, 4),
      history: {
        score: scoreHistory,
        citations: citationHistory,
        entities: entityHistory,
        schema: schemaHistory,
      },
    }
  }, [pages, robotsTxt])
}

// --- helpers ---

function guessTemplate(url: string): string {
  try {
    const path = new URL(url).pathname
    if (path === '/') return 'home'
    const seg = path.split('/').filter(Boolean)[0]
    return seg || 'other'
  } catch {
    return 'other'
  }
}

function parseBotFromRobotsTxt(raw: string, botName: string): string {
  if (!raw) return 'Unknown'
  const lines = raw.split('\n')
  let inAgent = false
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    if (trimmed.startsWith('user-agent:')) {
      const agent = trimmed.replace('user-agent:', '').trim()
      inAgent = agent === '*' || agent.toLowerCase() === botName.toLowerCase()
    } else if (inAgent && trimmed.startsWith('disallow:')) {
      const path = trimmed.replace('disallow:', '').trim()
      if (path && path !== '/') return 'Blocked'
    } else if (inAgent && trimmed.startsWith('allow:')) {
      return 'Allowed'
    }
  }
  return 'Unknown'
}

function countBots(pages: any[], type: 'allowed' | 'partial' | 'blocked'): number {
  return pages.filter((p: any) => {
    const access = (p.aiBotAccessSummary || '').toLowerCase()
    return type === 'allowed' ? !access.includes('blocked') && !access.includes('partial')
      : type === 'blocked' ? access.includes('blocked')
      : access.includes('partial')
  }).length
}

function computeCrawlabilityScore(
  allowed: number, partial: number, blocked: number, total: number, blockedPages: number
): number {
  if (total === 0) return 0
  const botScore = total > 0 ? ((allowed * 100 + partial * 50) / ((allowed + partial + blocked) * 100 || 1)) * 100 : 50
  const pagePenalty = Math.min(blockedPages / total * 100, 30)
  return Math.round(Math.max(0, Math.min(100, botScore - pagePenalty)))
}

function computeSchemaScore(
  withSchema: number, total: number, fields: { about: number; sameAs: number; author: number; datePublished: number }
): number {
  if (total === 0) return 0
  const coverage = (withSchema / total) * 40
  const fieldAvg = (fields.about + fields.sameAs + fields.author + fields.datePublished) / 4
  return Math.round(Math.max(0, Math.min(100, coverage + fieldAvg * 0.6)))
}

function computeOverallScore(
  crawlability: number, citations: number, entities: number, schema: number
): number {
  return Math.round(crawlability * 0.3 + schema * 0.25 + Math.min(citations / 10, 100) * 0.25 + Math.min(entities * 5, 100) * 0.2)
}

function getTopEngine(byEngine: Record<string, number>): string {
  return Object.entries(byEngine).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

function countRules(raw: string): number {
  if (!raw) return 0
  return raw.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length
}

function countLlmsTxtEntries(raw: string): number {
  if (!raw) return 0
  return raw.split('\n').filter(l => l.trim() && l.includes('/')).length
}
