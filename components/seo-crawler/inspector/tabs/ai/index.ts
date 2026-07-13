import SummaryTab from './SummaryTab';
import BotsTab from './BotsTab';
import ExtractableTab from './ExtractableTab';
import SchemaTab from './SchemaTab';
import CitationsTab from './CitationsTab';
import PromptsTab from './PromptsTab';
import HistoryTab from './HistoryTab';

export const TAB_CONFIG = [
  { id: 'summary',     label: 'Summary',     icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'bots',        label: 'Bot access',   icon: 'Bot',             Component: BotsTab },
  { id: 'extractable', label: 'Extractable',  icon: 'FileSearch',      Component: ExtractableTab },
  { id: 'schema',      label: 'Schema',       icon: 'Braces',          Component: SchemaTab },
  { id: 'citations',   label: 'Citations',    icon: 'Quote',           Component: CitationsTab },
  { id: 'prompts',     label: 'Prompts',      icon: 'MessageSquare',   Component: PromptsTab },
  { id: 'history',     label: 'History',      icon: 'History',         Component: HistoryTab },
];
