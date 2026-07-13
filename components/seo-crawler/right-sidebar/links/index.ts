import { LinksOverview }  from './LinksOverview'
import { LinksInternal }  from './LinksInternal'
import { LinksExternal }  from './LinksExternal'
import { LinksAnchors }   from './LinksAnchors'
import { LinksToxic }     from './LinksToxic'
import type { RsTabDescriptor } from '../registry'

export const linksTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: LinksOverview },
  {
    id: 'internal',
    label: 'Internal',
    Component: LinksInternal,
    badge: ({ pages }) => {
      const orphans = (pages || []).filter((p: any) => Number(p.inLinks) === 0).length
      return orphans || undefined
    },
  },
  {
    id: 'external',
    label: 'External',
    Component: LinksExternal,
    badge: ({ pages }) => {
      const gained = (pages || []).reduce((s: number, p: any) => s + Number(p.gained30d || 0), 0)
      return gained || undefined
    },
  },
  {
    id: 'anchors',
    label: 'Anchors',
    Component: LinksAnchors,
    badge: ({ pages }) => {
      const overOptimized = (pages || []).filter((p: any) => {
        const anchors = p.anchorTexts || p.anchors || []
        return Array.isArray(anchors) && anchors.length > 5 &&
          anchors.filter((a: any) => a && a.type === 'exact').length > 3
      }).length
      return overOptimized || undefined
    },
  },
  {
    id: 'toxic',
    label: 'Toxic',
    Component: LinksToxic,
    badge: ({ pages }) => {
      const toxic = (pages || []).filter((p: any) => Number(p.toxicityScore) > 60).length
      return toxic || undefined
    },
  },
]
