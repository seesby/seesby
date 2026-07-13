import { AiOverview }     from './AiOverview'
import { AiCrawlability } from './AiCrawlability'
import { AiCitations }    from './AiCitations'
import { AiEntities }     from './AiEntities'
import { AiSchema }       from './AiSchema'
import type { RsTabDescriptor } from '../registry'

export const aiTabs: RsTabDescriptor[] = [
  { id: 'overview',     label: 'Overview',      Component: AiOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.aiBotsBlocked?.length > 0).length || undefined },
  { id: 'crawlability', label: 'Crawlability',  Component: AiCrawlability,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.aiBotsBlocked?.length > 0 || !p.hasLlmsTxt).length || undefined },
  { id: 'citations',    label: 'Citations',     Component: AiCitations,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.aiCitationRate > 0).length || undefined },
  { id: 'entities',     label: 'Entities',      Component: AiEntities,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.entityCoverage < 0.5).length || undefined },
  { id: 'schema',       label: 'Schema',        Component: AiSchema,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.schemaErrors?.length > 0).length || undefined },
]
