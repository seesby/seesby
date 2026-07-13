import { TechnicalOverview }      from './TechnicalOverview'
import { TechnicalCrawlability }   from './TechnicalCrawlability'
import { TechnicalSpeed }          from './TechnicalSpeed'
import { TechnicalSecurity }       from './TechnicalSecurity'
import { TechnicalAccessibility }  from './TechnicalAccessibility'
import type { RsTabDescriptor } from '../registry'

export const technicalTabs: RsTabDescriptor[] = [
  { id: 'overview',      label: 'Overview',      Component: TechnicalOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => Number(p.statusCode) >= 400 || p.cwvBucket === 'poor').length || undefined },
  { id: 'crawlability',  label: 'Crawlability',  Component: TechnicalCrawlability,
    badge: ({ pages }) => (pages || []).filter((p: any) => !p.indexable || p.redirectChain?.length > 1 || p.isSoft404).length || undefined },
  { id: 'speed',         label: 'Speed',          Component: TechnicalSpeed,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.cwvBucket === 'poor' || p.cwvBucket === 'needsImprovement').length || undefined },
  { id: 'security',      label: 'Security',       Component: TechnicalSecurity,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.securityGrade && p.securityGrade !== 'A').length || undefined },
  { id: 'accessibility', label: 'Accessibility',  Component: TechnicalAccessibility,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.missingAltCount > 0 || p.a11yViolations?.length > 0).length || undefined },
]
