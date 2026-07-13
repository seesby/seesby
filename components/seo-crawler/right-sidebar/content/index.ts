import { ContentOverview } from './ContentOverview'
import { ContentTopics } from './ContentTopics'
import { ContentQuality } from './ContentQuality'
import { ContentFreshness } from './ContentFreshness'
import { ContentDuplication } from './ContentDuplication'
import type { RsTabDescriptor } from '../registry'

export const contentTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: ContentOverview },
  {
    id: 'topics',
    label: 'Topics',
    Component: ContentTopics,
    badge: ({ pages }) => {
      const html = pages.filter((p: any) => p.isHtmlPage !== false)
      const orphans = html.filter((p: any) =>
        !p.topicCluster &&
        (Number(p.gscClicks) > 10 || Number(p.keywords?.length) > 0)
      ).length
      return orphans || undefined
    },
  },
  {
    id: 'quality',
    label: 'Quality',
    Component: ContentQuality,
    badge: ({ pages }) => {
      const html = pages.filter((p: any) => p.isHtmlPage !== false)
      const thin = html.filter((p: any) => Number(p.wordCount || 0) < 300).length
      return thin || undefined
    },
  },
  {
    id: 'freshness',
    label: 'Freshness',
    Component: ContentFreshness,
    badge: ({ pages }) => {
      const html = pages.filter((p: any) => p.isHtmlPage !== false)
      const stale = html.filter((p: any) => Number(p.freshnessDays || 999) >= 180).length
      return stale || undefined
    },
  },
  {
    id: 'duplication',
    label: 'Duplication',
    Component: ContentDuplication,
    badge: ({ pages }) => {
      const html = pages.filter((p: any) => p.isHtmlPage !== false)
      const dupes = html.filter((p: any) => p.exactDuplicate || p.nearDuplicateGroup).length
      return dupes || undefined
    },
  },
]
