import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const competitorsLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'competitors', kind: 'list', label: 'Competitors', selectionMode: 'multi', selectionKey: 'comp.competitor', defaultOpen: true, bullet: 'diamond', pinned: true,
		items: [],
		resolveItems: ({ pages }) => {
			const counts: Record<string, number> = {};
			for (const p of pages) if ((p as any).competitorId) counts[(p as any).competitorId] = (counts[(p as any).competitorId] || 0) + 1;
			const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
				return { id, label: id, meta: n > 0 ? '●' : '' };
			});
			return [
				...rows,
				{ id: 'add',  label: 'Add competitor', meta: `${rows.length}/10`, icon: 'Plus', action: 'add' },
				{ id: 'auto', label: 'Auto-discover', icon: 'Plus', action: 'discover' },
			];
		},
	},
	{ id: 'clusters', kind: 'list', label: 'Topic clusters', bullet: 'arrow',
		items: [],
		resolveItems: ({ pages }) => {
			const counts: Record<string, number> = {};
			for (const p of pages) if ((p as any).cluster) counts[(p as any).cluster] = (counts[(p as any).cluster] || 0) + 1;
			const rows = Object.entries(counts).slice(0, 5).map(([id, n]) => ({ id, label: id, meta: `${n} kw` }));
			return [...rows, { id: 'new', label: 'New cluster', icon: 'Plus', action: 'new' }];
		},
	},
	{ id: 'gapType', kind: 'facet', label: 'Gap type', countKey: 'comp.gapType', bullet: 'dot',
		buckets: [
			{ value: 'catchable',    label: 'Catchable',    tone: 'warn' },
			{ value: 'aspirational', label: 'Aspirational', tone: 'info' },
			{ value: 'defensive',    label: 'Defensive',    tone: 'good' },
			{ value: 'unshared',     label: 'Unshared / ours' },
		],
	},
	{ id: 'serpFeatures', kind: 'facet', label: 'SERP features', countKey: 'comp.serpFeature', bullet: 'diamond',
		buckets: [
			{ value: 'ai-overview',      label: 'AI overview' },
			{ value: 'paa',              label: 'PAA' },
			{ value: 'featured-snippet', label: 'Featured snippet' },
			{ value: 'shopping',         label: 'Shopping' },
			{ value: 'local-pack',       label: 'Local pack' },
			{ value: 'video',            label: 'Video' },
		],
	},
	{ id: 'winLoss', kind: 'facet', label: 'Win / Loss (30d)', countKey: 'comp.winLoss', bullet: 'win-loss',
		buckets: [
			{ value: 'win',    label: 'Wins',   tone: 'good' },
			{ value: 'loss',   label: 'Losses', tone: 'bad'  },
			{ value: 'stable', label: 'Stable' },
		],
	},
	{ id: 'linkOverlap', kind: 'facet', label: 'Link overlap', countKey: 'comp.linkOverlap', bullet: 'diamond',
		buckets: [
			{ value: 'shared',       label: 'Shared refs' },
			{ value: 'their-unique', label: 'Their unique' },
			{ value: 'our-unique',   label: 'Our unique' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Catchable gaps',   mode: 'competitors', selections: { 'comp.gapType': ['catchable'] } },
			{ name: 'AI overview wins', mode: 'competitors', selections: { 'comp.serpFeature': ['ai-overview'], 'comp.winLoss': ['win'] } },
			{ name: 'Unique links',     mode: 'competitors', selections: { 'comp.linkOverlap': ['our-unique'] } },
		],
	},
];

export function registerCompetitorsMode() {
	defineMode({
		id: 'competitors',
		description: 'Topic coverage vs competitors.',
		defaultViewId: 'comparison',
		views: [
			{ id: 'comparison',   kind: 'table',  label: 'Comparison',    shortcut: '1' },
			{ id: 'gap',          kind: 'canvas', label: 'Gap',           shortcut: '2' },
			{ id: 'serpOverlap',  kind: 'canvas', label: 'SERP Overlap',  shortcut: '3' },
			{ id: 'contentDepth', kind: 'canvas', label: 'Content Depth', shortcut: '4' },
		],
				lsSections: competitorsLsSections,
		rsTabs: [
			{ id: 'comp_overview',     label: 'Overview' },
			{ id: 'comp_marketshare',  label: 'Market Share' },
			{ id: 'comp_backlinks',    label: 'Backlinks' },
			{ id: 'comp_content',      label: 'Content' },
			{ id: 'comp_actions',      label: 'Actions' },
		],
		inspectorTabs: [
			{ id: 'summary',    label: 'Summary',    icon: 'LayoutDashboard' },
			{ id: 'gaps',       label: 'Gaps',       icon: 'Target' },
			{ id: 'wins',       label: 'Wins',       icon: 'TrendingUp' },
			{ id: 'losses',     label: 'Losses',     icon: 'TrendingDown' },
			{ id: 'backlinks',  label: 'Backlinks',  icon: 'Link2' },
			{ id: 'history',    label: 'History',    icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.competitors,
		visible: [
			'e.competitor.domain',
			'e.competitor.kwOverlap',
			'e.competitor.sovOrganic',
			'e.competitor.sovPaid',
			'e.competitor.backlinkOverlap',
			'e.competitor.pricing',
			'e.competitor.contentVelocity',
			'e.competitor.wins',
			'e.competitor.losses',
		],
	});
}
