// packages/modes/src/definitions/shared.ts
import { registerMode, type ModeDescriptor } from '../registry';
import { MODE_LABEL, MODE_ACCENT, MODE_SHORTCUT } from '@seesby/types';

export function defineMode(d: Omit<ModeDescriptor, 'label' | 'accent' | 'shortcut'>) {
	registerMode({
		...d,
		label: MODE_LABEL[d.id],
		accent: MODE_ACCENT[d.id],
		shortcut: MODE_SHORTCUT[d.id],
	});
}
