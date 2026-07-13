import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const uxConversionLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'analytics', kind: 'list', label: 'ANALYTICS SOURCES', bullet: 'square-check',
		items: [
			{ id: 'ga4',      label: 'GA4',      meta: '●', tone: 'good' },
			{ id: 'posthog',  label: 'PostHog',  meta: '●', tone: 'good' },
			{ id: 'mixpanel', label: 'Mixpanel', meta: '●', tone: 'good' },
			{ id: 'amplitude',label: 'Amplitude', meta: 'add' },
		],
	},
	{ id: 'behavior', kind: 'list', label: 'BEHAVIOR SOURCES', bullet: 'square-check',
		items: [
			{ id: 'clarity',   label: 'Microsoft Clarity', meta: '●', tone: 'good' },
			{ id: 'hotjar',    label: 'Hotjar',            meta: '●', tone: 'good' },
			{ id: 'fullstory', label: 'FullStory',         meta: 'add' },
			{ id: 'logrocket', label: 'LogRocket',         meta: 'add' },
		],
	},
	{ id: 'experimentPlatform', kind: 'list', label: 'EXPERIMENT PLATFORM', bullet: 'square-check',
		items: [
			{ id: 'optimizely', label: 'Optimizely', meta: '●', tone: 'good' },
			{ id: 'vwo',         label: 'VWO',        meta: 'add' },
			{ id: 'growthbook',  label: 'GrowthBook', meta: 'add' },
			{ id: 'statsig',     label: 'Statsig',    meta: 'add' },
		],
	},
	{ id: 'pageRole', kind: 'list', label: 'PAGE ROLE', bullet: 'arrow',
		items: [],
		resolveItems: ({ pages }) => {
			const p = pages as any[];
			const count = (role: string) => p.filter(pg => pg.pageRole === role || pg.template === role).length;
			return [
				{ id: 'entry',      label: 'Entry',      meta: String(count('entry') || count('landing')) },
				{ id: 'mid-funnel', label: 'Mid-funnel', meta: String(count('mid-funnel') || count('category')) },
				{ id: 'conversion', label: 'Conversion', meta: String(count('conversion') || count('checkout')) },
				{ id: 'form',       label: 'Form',       meta: String(count('form')) },
				{ id: 'confirm',    label: 'Confirm',    meta: String(count('confirm') || count('thank-you')) },
				{ id: 'utility',    label: 'Utility',    meta: String(count('utility') || count('other')) },
			].filter(r => r.meta !== '0');
		},
	},
	{ id: 'intent', kind: 'list', label: 'INTENT BUCKETS', bullet: 'dot-filled',
		items: [],
		resolveItems: ({ pages }) => {
			const p = pages as any[];
			const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0; };
			const converters = p.filter(pg => num(pg.ux?.formCompletes) > 0 || num(pg.ux?.ctaClicks) > 0).length;
			const bouncers   = p.filter(pg => num(pg.ux?.bounceRate) > 0.7).length;
			const returning  = p.filter(pg => num(pg.ux?.returningVisitors) > 0).length;
			const researchers = Math.max(0, p.filter(pg => pg.isHtmlPage !== false).length - converters - bouncers);
			return [
				{ id: 'converters',  label: 'Converters',  meta: String(converters),  tone: 'good' as const },
				{ id: 'researchers', label: 'Researchers', meta: String(researchers) },
				{ id: 'bouncers',    label: 'Bouncers',    meta: String(bouncers),    tone: 'bad' as const },
				{ id: 'returning',   label: 'Returning',   meta: String(returning) },
			].filter(r => r.meta !== '0');
		},
	},
	{ id: 'device', kind: 'list', label: 'DEVICE', bullet: 'arrow',
		items: [],
		resolveItems: ({ pages }) => {
			const p = pages as any[];
			const total = p.length || 1;
			const mobile  = p.filter(pg => pg.device === 'mobile'  || pg.isMobile === true).length;
			const tablet  = p.filter(pg => pg.device === 'tablet').length;
			const desktop = p.filter(pg => pg.device === 'desktop' || (!pg.isMobile && pg.device !== 'tablet')).length;
			const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
			return [
				{ id: 'mobile',  label: 'Mobile',  meta: pct(mobile) },
				{ id: 'desktop', label: 'Desktop', meta: pct(desktop) },
				{ id: 'tablet',  label: 'Tablet',  meta: pct(tablet) },
			].filter(r => r.meta !== '0%');
		},
	},
	{ id: 'friction', kind: 'list', label: 'FRICTION SIGNALS', bullet: 'dot',
		items: [],
		resolveItems: ({ pages }) => {
			const p = pages as any[];
			const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0; };
			const sum = (key: string) => p.reduce((s, pg) => s + num(pg.ux?.[key]), 0);
			const rage   = sum('rageClicks');
			const dead   = sum('deadClicks');
			const error  = sum('errorClicks');
			const scroll = p.filter(pg => num(pg.ux?.scrollDepth) < 50 && num(pg.ux?.scrollDepth) > 0).length;
			const formErr = p.reduce((s, pg) => s + Math.max(0, num(pg.ux?.formStarts) - num(pg.ux?.formCompletes)), 0);
			return [
				{ id: 'rage',   label: 'Rage clicks',  meta: String(rage),   tone: 'bad'  as const },
				{ id: 'dead',   label: 'Dead clicks',  meta: String(dead),   tone: 'warn' as const },
				{ id: 'error',  label: 'Error clicks', meta: String(error),  tone: 'bad'  as const },
				{ id: 'scroll', label: 'Scroll dead',  meta: String(scroll) },
				{ id: 'form',   label: 'Form errors',  meta: String(formErr) },
			].filter(r => r.meta !== '0');
		},
	},
	{ id: 'cwv', kind: 'list', label: 'CWV ON CONVERTERS', bullet: 'dot',
		items: [],
		resolveItems: ({ pages }) => {
			const p = pages as any[];
			const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0; };
			const lcpVals = p.map(pg => num(pg.cwv?.lcp) || num(pg.lcpMs)).filter(Boolean);
			const inpVals = p.map(pg => num(pg.cwv?.inp) || num(pg.inpMs)).filter(Boolean);
			const clsVals = p.map(pg => num(pg.cwv?.cls) || num(pg.cls)).filter(Boolean);
			const lcpGood = lcpVals.filter(v => v <= 2500).length;
			const lcpPoor = lcpVals.filter(v => v > 4000).length;
			const inpPoor = inpVals.filter(v => v > 200).length;
			const clsPoor = clsVals.filter(v => v > 0.25).length;
			return [
				{ id: 'lcp-good', label: 'LCP good', meta: String(lcpGood), tone: 'good' as const },
				{ id: 'lcp-poor', label: 'LCP poor', meta: String(lcpPoor), tone: 'bad'  as const },
				{ id: 'inp-poor', label: 'INP poor', meta: String(inpPoor), tone: 'bad'  as const },
				{ id: 'cls-poor', label: 'CLS poor', meta: String(clsPoor), tone: 'bad'  as const },
			].filter(r => r.meta !== '0');
		},
	},
	{ id: 'experimentStatus', kind: 'list', label: 'EXPERIMENTS', bullet: 'dot',
		items: [],
		resolveItems: ({ pages }) => {
			const experiments = (pages as any).__experiments as any[] | undefined;
			if (!experiments?.length) return [];
			const count = (status: string) => experiments.filter(e => e.status === status).length;
			return [
				{ id: 'running',      label: 'Running',      meta: String(count('active') || count('running')),           tone: 'info' as const },
				{ id: 'winning',      label: 'Winning',      meta: String(count('won')    || count('winning')),           tone: 'good' as const },
				{ id: 'losing',       label: 'Losing',       meta: String(count('lost')   || count('losing')),            tone: 'bad'  as const },
				{ id: 'inconclusive', label: 'Inconclusive', meta: String(count('inconclusive')) },
			].filter(r => r.meta !== '0');
		},
	},
	{ id: 'funnels', kind: 'list', label: 'FUNNELS', bullet: 'arrow',
		items: [{ id: 'new', label: 'New funnel', action: 'add', icon: 'Plus' }],
		resolveItems: ({ pages }) => {
			const funnelsList = (pages as any).__funnels as any[] | undefined;
			const dynamic: Array<{ id: string; label: string; meta: string }> = (funnelsList || []).map((f: any) => ({
				id: f.id || f.name,
				label: f.name,
				meta: `${f.steps?.length || 0} steps`,
			}));
			return [...dynamic, { id: 'new', label: 'New funnel', action: 'add' as const, icon: 'Plus' }];
		},
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Rage + converter',    mode: 'uxConversion', selections: { friction: ['rage'], intent: ['converters'] } },
			{ name: 'Form abandon > 50%',   mode: 'uxConversion', selections: { friction: ['form'] } },
			{ name: 'Mobile bounce hot',   mode: 'uxConversion', selections: { device: ['mobile'], intent: ['bouncers'] } },
		],
	},
];

export function registerUxConversionMode() {
	defineMode({
		id: 'uxConversion',
		description: 'User experience and conversion rate optimization.',
		defaultViewId: 'overview',
		views: [
			{ id: 'overview',    kind: 'dashboard', label: 'Overview',    shortcut: '0' },
			{ id: 'pages',       kind: 'table',     label: 'Pages',       shortcut: '1' },
			{ id: 'funnels',     kind: 'dashboard', label: 'Funnels',     shortcut: '2' },
			{ id: 'heatmaps',    kind: 'dashboard', label: 'Heatmaps',    shortcut: '3' },
			{ id: 'replays',     kind: 'dashboard', label: 'Replays',     shortcut: '4' },
			{ id: 'experiments', kind: 'dashboard', label: 'Experiments', shortcut: '5' },
			{ id: 'forms',       kind: 'table',     label: 'Forms',       shortcut: '6' },
		],
				lsSections: uxConversionLsSections,
		rsTabs: [
			{ id: 'ux_overview',      label: 'Overview' },
			{ id: 'ux_performance',   label: 'Performance' },
			{ id: 'ux_accessibility', label: 'A11y' },
			{ id: 'ux_conversions',   label: 'Conversions' },
			{ id: 'ux_actions',       label: 'Actions' },
		],
		inspectorTabs: [
			{ id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard' },
			{ id: 'heatmap',  label: 'Heatmap',  icon: 'Flame' },
			{ id: 'scroll',   label: 'Scroll',   icon: 'ArrowDown' },
			{ id: 'friction', label: 'Friction', icon: 'MousePointerClick' },
			{ id: 'forms',    label: 'Forms',    icon: 'TextCursorInput' },
			{ id: 'cwv',      label: 'CWV',      icon: 'Gauge' },
			{ id: 'replays',  label: 'Tests',    icon: 'FlaskConical' },
			{ id: 'history',  label: 'History',  icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.uxConversion,
		visible: [
			'p.identity.url',
			'p.ux.roleClassified',
			'p.ga.conversionRate',
			'p.ga.sessions',
			'p.ga.engagementRate',
			'p.ux.rageClicks',
			'p.ux.scrollDepth',
			'p.conv.experiments.active',
			'p.tech.cwv.bucket',
			'p.ga.bounce',
			'p.action.topAction',
		],
	});
}
