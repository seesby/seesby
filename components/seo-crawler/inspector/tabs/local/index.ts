import type { InspectorTabEntry } from '../../InspectorRegistry';

import SummaryTab from './SummaryTab';
import NapTab from './NapTab';
import GbpTab from './GbpTab';
import ReviewsTab from './ReviewsTab';
import CitationsTab from './CitationsTab';
import SchemaTab from './SchemaTab';
import RankingsTab from './RankingsTab';
import HistoryTab from './HistoryTab';

export const TAB_CONFIG: InspectorTabEntry[] = [
  { id: 'summary',   label: 'Summary',      icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'nap',       label: 'NAP',          icon: 'MapPin',          Component: NapTab },
  { id: 'gbp',       label: 'GBP Profile',  icon: 'Building2',       Component: GbpTab },
  { id: 'reviews',   label: 'Reviews',      icon: 'Star',            Component: ReviewsTab },
  { id: 'citations', label: 'Citations',    icon: 'Quote',           Component: CitationsTab },
  { id: 'schema',    label: 'Local Schema', icon: 'Braces',          Component: SchemaTab },
  { id: 'rankings',  label: 'Rankings',     icon: 'TrendingUp',      Component: RankingsTab },
  { id: 'history',   label: 'History',      icon: 'History',         Component: HistoryTab },
];
