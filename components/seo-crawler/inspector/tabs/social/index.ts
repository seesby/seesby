import type { InspectorTabDef } from '../../InspectorRegistry';

import SummaryTab from './SummaryTab';
import ContentTab from './ContentTab';
import PerformanceTab from './PerformanceTab';
import RepliesTab from './RepliesTab';
import TrafficTab from './TrafficTab';
import UgcsTab from './UgcsTab';
import HistoryTab from './HistoryTab';

export const TAB_CONFIG: InspectorTabDef[] = [
  { id: 'summary',     label: 'Summary',     icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'content',     label: 'Content',     icon: 'FileText',        Component: ContentTab },
  { id: 'performance', label: 'Performance', icon: 'TrendingUp',      Component: PerformanceTab },
  { id: 'replies',     label: 'Replies',     icon: 'MessageCircle',   Component: RepliesTab },
  { id: 'traffic',     label: 'Traffic',     icon: 'BarChart3',       Component: TrafficTab },
  { id: 'ugc',         label: 'UGC',         icon: 'Users',           Component: UgcsTab },
  { id: 'history',     label: 'History',     icon: 'History',         Component: HistoryTab },
];
