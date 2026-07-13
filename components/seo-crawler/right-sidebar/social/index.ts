import { SocialOverview } from './SocialOverview'
import { SocialMentions } from './SocialMentions'
import { SocialEngage }   from './SocialEngage'
import { SocialTraffic }  from './SocialTraffic'
import { SocialActions }  from './SocialActions'
import type { RsTabDescriptor } from '../registry'

export const socialTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview',      Component: SocialOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.ogMissingTags?.length > 0).length || undefined },
  { id: 'mentions', label: 'Mentions',      Component: SocialMentions },
  { id: 'engage',   label: 'Engagement',    Component: SocialEngage },
  { id: 'traffic',  label: 'Traffic',       Component: SocialTraffic },
  { id: 'actions',  label: 'Actions',       Component: SocialActions },
]
