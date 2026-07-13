import { PaidOverview }     from './PaidOverview'
import { PaidSpend }        from './PaidSpend'
import { PaidQuality }      from './PaidQuality'
import { PaidCompetition }  from './PaidCompetition'
import { PaidLandingPages } from './PaidLandingPages'
import { PaidActions }      from './PaidActions'
import type { RsTabDescriptor } from '../registry'

function countPaidLps(pages: any[], filter: (p: any) => boolean) {
  return (pages || []).filter((p: any) => p.isPaidLandingPage && filter(p)).length || undefined
}

function isLpIssue(p: any) {
  const status = Number(p.status || 200)
  const lcp = Number(p.lcp || p.performanceLcp || 0)
  const cls = Number(p.cls || 0)
  return status >= 400 || lcp > 2500 || cls > 0.25
}

export const paidTabs: RsTabDescriptor[] = [
  {
    id: 'overview',
    label: 'Overview',
    Component: PaidOverview,
    badge: ({ pages }) => countPaidLps(pages, isLpIssue),
  },
  {
    id: 'spend',
    label: 'Spend',
    Component: PaidSpend,
    badge: ({ pages }) => countPaidLps(pages, p => Number(p.status || 200) >= 400),
  },
  {
    id: 'quality',
    label: 'Quality',
    Component: PaidQuality,
    badge: ({ pages }) => countPaidLps(pages, p => {
      const lcp = Number(p.lcp || p.performanceLcp || 0)
      const cls = Number(p.cls || 0)
      return lcp > 2500 || cls > 0.25
    }),
  },
  {
    id: 'competition',
    label: 'Competition',
    Component: PaidCompetition,
  },
  {
    id: 'landing_pages',
    label: 'LPs',
    Component: PaidLandingPages,
    badge: ({ pages }) => countPaidLps(pages, isLpIssue),
  },
  {
    id: 'actions',
    label: 'Actions',
    Component: PaidActions,
    badge: ({ pages }) => countPaidLps(pages, p => isLpIssue(p) || p.isMobileFriendly === false),
  },
]
