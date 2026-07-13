import SummaryTab from './SummaryTab';
import TheirPageTab from './TheirPageTab';
import OurPageTab from './OurPageTab';
import KwOverlapTab from './KwOverlapTab';
import LinkOverlapTab from './LinkOverlapTab';
import ActionsTab from './ActionsTab';

export const TAB_CONFIG = [
  { id: 'summary',     label: 'Summary',      icon: 'LayoutDashboard', Component: SummaryTab },
  { id: 'theirPage',   label: 'Their Page',   icon: 'ExternalLink',    Component: TheirPageTab },
  { id: 'ourPage',     label: 'Our Page',     icon: 'FileText',        Component: OurPageTab },
  { id: 'kwOverlap',   label: 'Kw Overlap',   icon: 'GitCompare',      Component: KwOverlapTab },
  { id: 'linkOverlap', label: 'Link Overlap',  icon: 'Link2',           Component: LinkOverlapTab },
  { id: 'actions',     label: 'Actions',       icon: 'ListChecks',      Component: ActionsTab },
];
