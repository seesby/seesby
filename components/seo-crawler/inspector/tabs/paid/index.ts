import type { InspectorTabDef } from '../../InspectorRegistry';

export const TAB_CONFIG: InspectorTabDef[] = [
  { id: 'summary',   label: 'Summary',   icon: 'LayoutDashboard' },
  { id: 'delivery',  label: 'Delivery',  icon: 'Truck' },
  { id: 'keywords',  label: 'Keywords',  icon: 'Key' },
  { id: 'creatives', label: 'Creatives', icon: 'Paintbrush' },
  { id: 'lps',       label: 'LPs',       icon: 'ExternalLink' },
  { id: 'auction',   label: 'Auction',   icon: 'Gavel' },
  { id: 'history',   label: 'History',   icon: 'History' },
];
