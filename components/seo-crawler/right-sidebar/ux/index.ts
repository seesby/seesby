import { UxOverview }  from './UxOverview'
import { UxFriction }  from './UxFriction'
import { UxFunnels }   from './UxFunnels'
import { UxTests }     from './UxTests'
import { UxActions }   from './UxActions'
import type { RsTabDescriptor } from '../registry'

export const uxTabs: RsTabDescriptor[] = [
  { id: 'overview', label: 'Overview', Component: UxOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.rageClicks > 0 || p.deadClicks > 0).length || undefined },
  { id: 'friction', label: 'Friction', Component: UxFriction,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.rageClicks > 0 || p.deadClicks > 0 || p.errorClicks > 0).length || undefined },
  { id: 'funnels',  label: 'Funnels',  Component: UxFunnels },
  { id: 'tests',    label: 'Tests',    Component: UxTests },
  { id: 'actions',  label: 'Actions',  Component: UxActions },
]
