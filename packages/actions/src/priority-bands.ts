export type PriorityBand = 'BLOCKING' | 'REVENUE_LOSS' | 'HIGH_LEVERAGE' | 'STRATEGIC' | 'HYGIENE';

export const BAND_ORDER: PriorityBand[] = [
  'BLOCKING',
  'REVENUE_LOSS',
  'HIGH_LEVERAGE',
  'STRATEGIC',
  'HYGIENE',
];

export const BAND_LABEL: Record<PriorityBand, string> = {
  BLOCKING: 'Blocking',
  REVENUE_LOSS: 'Revenue Loss',
  HIGH_LEVERAGE: 'High Leverage',
  STRATEGIC: 'Strategic',
  HYGIENE: 'Hygiene',
};

export const BAND_COLOR: Record<PriorityBand, string> = {
  BLOCKING: '#ef4444',
  REVENUE_LOSS: '#f97316',
  HIGH_LEVERAGE: '#eab308',
  STRATEGIC: '#3b82f6',
  HYGIENE: '#6b7280',
};

export function classifyBand(actionCode: string): PriorityBand {
  const code = actionCode.toUpperCase();

  if (['T01', 'T02', 'T03', 'T11', 'T16'].includes(code)) return 'BLOCKING';
  if (code === 'P06') return 'BLOCKING';
  if (code === 'LO02') return 'BLOCKING';
  if (code === 'SO02') return 'BLOCKING';

  if (code.startsWith('T')) return 'HIGH_LEVERAGE';
  if (code.startsWith('C')) return 'HIGH_LEVERAGE';
  if (code.startsWith('L')) return 'HIGH_LEVERAGE';
  if (code.startsWith('S')) return 'HIGH_LEVERAGE';
  if (code.startsWith('A')) return 'STRATEGIC';
  if (code.startsWith('P')) return 'HIGH_LEVERAGE';
  if (code.startsWith('U')) return 'HIGH_LEVERAGE';
  if (code.startsWith('SO')) return 'HYGIENE';
  if (code.startsWith('E')) return 'HIGH_LEVERAGE';
  if (code.startsWith('LO')) return 'HIGH_LEVERAGE';

  return 'HYGIENE';
}

export function bandColor(band: PriorityBand): string {
  return BAND_COLOR[band] ?? '#6b7280';
}
