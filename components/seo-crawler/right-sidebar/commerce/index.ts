import { CommerceOverview }  from './CommerceOverview'
import { CommerceInventory } from './CommerceInventory'
import { CommerceSchema }    from './CommerceSchema'
import { CommerceFeed }      from './CommerceFeed'
import { CommerceFunnel }    from './CommerceFunnel'
import type { RsTabDescriptor } from '../registry'

export const commerceTabs: RsTabDescriptor[] = [
  { id: 'overview',  label: 'Overview',         Component: CommerceOverview,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.availability === 'out_of_stock' || p.schemaErrors?.length > 0).length || undefined },
  { id: 'inventory', label: 'Inventory',         Component: CommerceInventory,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.availability === 'out_of_stock').length || undefined },
  { id: 'schema',    label: 'Schema',            Component: CommerceSchema,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.schemaErrors?.length > 0).length || undefined },
  { id: 'feed',      label: 'Feed',              Component: CommerceFeed,
    badge: ({ pages }) => (pages || []).filter((p: any) => p.feedErrors?.length > 0 || p.feedMissingAttrs?.length > 0).length || undefined },
  { id: 'funnel',    label: 'Funnel',            Component: CommerceFunnel },
]
