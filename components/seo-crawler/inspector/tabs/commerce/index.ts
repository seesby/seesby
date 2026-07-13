import type { InspectorTabEntry } from '../../InspectorRegistry';

import SummaryTab from './SummaryTab';
import ProductTab from './ProductTab';
import VariantsTab from './VariantsTab';
import SchemaTab from './SchemaTab';
import FeedStatusTab from './FeedStatusTab';
import SearchTab from './SearchTab';
import IssuesTab from './IssuesTab';
import HistoryTab from './HistoryTab';

export const TAB_CONFIG: InspectorTabEntry[] = [
  { id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'product',  label: 'Product',  icon: 'Package',         Component: ProductTab },
  { id: 'variants', label: 'Variants', icon: 'Layers',          Component: VariantsTab },
  { id: 'schema',   label: 'Schema',   icon: 'Braces',          Component: SchemaTab },
  { id: 'feed',     label: 'Feed',     icon: 'Rss',             Component: FeedStatusTab },
  { id: 'search',   label: 'Search',   icon: 'Search',          Component: SearchTab },
  { id: 'issues',   label: 'Issues',   icon: 'AlertTriangle',   Component: IssuesTab },
  { id: 'history',  label: 'History',  icon: 'History',         Component: HistoryTab },
];
