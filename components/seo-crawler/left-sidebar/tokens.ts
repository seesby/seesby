export const SIDEBAR_TOKENS = {
	// Surfaces
	base:        '#0A0A0B',  // --bg-main
	surface:     '#0A0A0B',  // Match main background exactly
	surfaceAlt:  '#111114',  // --card-bg / match subheader
	card:        '#111114',
	cardAlt:     '#141417',

	// Borders
	border:      '#222222',  // Match subheader border
	borderAlt:   '#222222',

	// Text
	text:        '#FFFFFF',
	textDim:     '#A0A0A5',  // --text-secondary
	textMuted:   '#66666E',
	textSubtle:  '#44444A',

	// Accents
	accent:      '#F59E0B',  // --brand-amber
	good:        '#22c55e',
	warn:        '#f59e0b',
	bad:         '#ef4444',
	info:        '#3b82f6',
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
	good:    { dot: 'bg-[#22c55e]', text: 'text-[#22c55e]' },
	warn:    { dot: 'bg-[#f59e0b]', text: 'text-[#f59e0b]' },
	bad:     { dot: 'bg-[#ef4444]', text: 'text-[#ef4444]' },
	info:    { dot: 'bg-[#3b82f6]', text: 'text-[#3b82f6]' },
	neutral: { dot: 'bg-[#444]',    text: 'text-[#bdbdbd]' },
} as const;

export const MODE_DOT_CLASS: Record<string, string> = {
	'#94a3b8': 'bg-slate-400',   // fullAudit
	'#a78bfa': 'bg-violet-400',  // wqa
	'#3b82f6': 'bg-blue-400',    // technical
	'#f59e0b': 'bg-amber-400',   // content
	'#14b8a6': 'bg-teal-400',    // linksAuthority
	'#f43f5e': 'bg-rose-400',    // uxConversion
	'#06b6d4': 'bg-cyan-400',    // paid
	'#10b981': 'bg-green-400',   // commerce
	'#6366f1': 'bg-indigo-400',  // socialBrand
	'#d946ef': 'bg-fuchsia-400', // ai
	'#ef4444': 'bg-red-400',     // competitors
	'#f97316': 'bg-orange-400',  // local
};
