// packages/modes/src/definitions/_mode-action-map.ts
import type { ActionCode, Mode } from '@seesby/types';

export const MODE_ACTIONS: Record<Mode, ReadonlyArray<ActionCode>> = {
	fullAudit:      ['*'], // wildcard: all action codes apply
	wqa:            ['C01','C02','C03','C04','C05','C12','T01','T02','T08','L01','S01','A01'],
	technical:      ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12','T13','T14','T15','T16','S01','S02','S03','S04','S05','S06','P01','P02','P03','P04','P05','P06','P07','P08'],
	content:        ['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10','C11','C12','C13','C14','C15','C16','C17','A03'],
	linksAuthority: ['L01','L02','L03','L04','L05','L06','L07'],
	uxConversion:   ['U01','U02','U03','U04','U05','C13','C14'],
	paid:           ['P01','P02','P03','P04','P05','P06','P07','P08','U01','U02'],
	commerce:       ['E01','E02','E03','E04','S01','S05','C13','C14','U03','U04'],
	socialBrand:    ['SO01','SO02','SO03','SO04'],
	ai:             ['A01','A02','A03','A04','A05','C01','C02','S01','S04'],
	competitors:    ['C01','C02','C12','L01','L02','S01','A01'],
	local:          ['LO01','LO02','LO03','LO04','S05','S06'],
};

/** Check if an action code is allowed for a given mode (handles '*' wildcard). */
export function isActionCodeAllowed(mode: Mode, code: ActionCode): boolean {
	const codes = MODE_ACTIONS[mode];
	return codes.includes('*') || codes.includes(code);
}
