export const SIDEBAR_TOKENS = {
	// Surfaces (raw CSS values for inline style use)
	base:        'var(--brand-surface-0)',
	surface:     'var(--brand-surface-0)',
	surfaceAlt:  'var(--brand-surface-2)',
	card:        'var(--brand-surface-2)',
	cardAlt:     'var(--brand-surface-3)',

	// Borders
	border:      'var(--brand-border-2)',
	borderAlt:   'var(--brand-border-2)',

	// Text
	text:        'var(--brand-text-strong)',
	textDim:     'var(--brand-text-mid)',
	textMuted:   'var(--brand-text-faint)',
	textSubtle:  'var(--brand-border-2)',

	// Accents (honey-led, warm)
	accent:      '#F59E0B',
	good:        '#34D27B',
	warn:        '#F59E0B',
	bad:         '#F4655E',
	info:        '#B45309',  // warm amber-brown (no cold blue)
} as const;

export const SIDEBAR_LAYOUT = {
	widthDefault:   240,
	widthMin:       200,
	widthMax:       380,
	railWidth:      48,
	headerHeight:   36,
	searchHeight:   32,
	footerHeight:   36,
	rowHeight:      26,
	sectionGap:     4,
	groupHeader:    11,    // px font
	rowLabel:       12,    // px font
	rowCount:       11,    // px font
} as const;

export const TONE_CLASSES = {
	good:    { dot: 'bg-[#34D27B]', text: 'text-[#34D27B]' },
	warn:    { dot: 'bg-[#f59e0b]', text: 'text-[#f59e0b]' },
	bad:     { dot: 'bg-[#F4655E]', text: 'text-[#F4655E]' },
	info:    { dot: 'bg-[#B45309]', text: 'text-[#B45309]' },
	neutral: { dot: 'bg-[var(--brand-border-2)]', text: 'text-[var(--brand-text-faint)]' },
} as const;

export const MODE_DOT_CLASS: Record<string, string> = {
	'text-[var(--brand-text-mid)]': 'bg-slate-400',   // fullAudit
	'#a78bfa': 'bg-violet-400',  // wqa
	'#3b82f6': 'bg-blue-400',    // technical
	'#f59e0b': 'bg-amber-400',   // content
	'#14b8a6': 'bg-teal-400',    // linksAuthority
	'#f43f5e': 'bg-rose-400',    // uxConversion
	'#06b6d4': 'bg-cyan-400',    // paid
	'#10b981': 'bg-green-400',   // commerce
	'#F59E0B': 'bg-amber-400',  // socialBrand
	'#d946ef': 'bg-fuchsia-400', // ai
	'#ef4444': 'bg-red-400',     // competitors
	'#f97316': 'bg-orange-400',  // local
};
