import { CompetitorsOverview }  from './CompetitorsOverview'
import { CompetitorsGaps }      from './CompetitorsGaps'
import { CompetitorsWins }      from './CompetitorsWins'
import { CompetitorsLosses }    from './CompetitorsLosses'
import { CompetitorsBacklinks } from './CompetitorsBacklinks'
import type { RsTabDescriptor } from '../registry'

export const competitorsTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',        Component: CompetitorsOverview },
  { id: 'gaps',      label: 'Shared Gaps',     Component: CompetitorsGaps,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.competitorGapCount > 0).length || undefined },
  { id: 'wins',      label: 'Wins',            Component: CompetitorsWins },
  { id: 'losses',    label: 'Losses',          Component: CompetitorsLosses,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.competitorLossCount > 0).length || undefined },
  { id: 'backlinks', label: 'Backlink Overlap', Component: CompetitorsBacklinks },
]
