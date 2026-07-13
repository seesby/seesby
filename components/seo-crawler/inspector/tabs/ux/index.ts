import type { InspectorTabEntry } from '../../InspectorRegistry';

import SummaryTab from './SummaryTab';
import HeatmapTab from './HeatmapTab';
import ScrollTab from './ScrollTab';
import FrictionTab from './FrictionTab';
import FormsTab from './FormsTab';
import CwvTab from './CwvTab';
import ReplaysTab from './ReplaysTab';
import HistoryTab from './HistoryTab';

export const TAB_CONFIG: InspectorTabEntry[] = [
  { id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'heatmap',  label: 'Heatmap',  icon: 'Flame',          Component: HeatmapTab },
  { id: 'scroll',   label: 'Scroll',   icon: 'ArrowDown',      Component: ScrollTab },
  { id: 'friction', label: 'Friction', icon: 'MousePointerClick', Component: FrictionTab },
  { id: 'forms',    label: 'Forms',    icon: 'TextCursorInput', Component: FormsTab },
  { id: 'cwv',      label: 'CWV',      icon: 'Gauge',           Component: CwvTab },
  { id: 'replays',  label: 'Tests',    icon: 'FlaskConical',    Component: ReplaysTab },
  { id: 'history',  label: 'History',  icon: 'History',         Component: HistoryTab },
];
