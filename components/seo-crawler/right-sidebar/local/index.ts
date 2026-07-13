import { LocalOverview } from './LocalOverview'
import { LocalNap }      from './LocalNap'
import { LocalGbp }      from './LocalGbp'
import { LocalReviews }  from './LocalReviews'
import { LocalPack }     from './LocalPack'
import type { RsTabDescriptor } from '../registry'

export const localTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview',   Component: LocalOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.napScore < 0.9 || !p.gbpVerified).length || undefined },
  { id: 'nap',      label: 'NAP',        Component: LocalNap,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.napScore < 0.9).length || undefined },
  { id: 'gbp',      label: 'GBP',        Component: LocalGbp,
    badge: ({ pages }) => (pages || []).filter((p: any) => !p.gbpVerified || p.gbpCompleteness < 0.8).length || undefined },
  { id: 'reviews',  label: 'Reviews',    Component: LocalReviews,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.negativeReviewCount > 0).length || undefined },
  { id: 'pack',     label: 'Local Pack', Component: LocalPack },
]
