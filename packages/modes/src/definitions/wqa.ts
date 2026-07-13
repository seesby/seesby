import type { SidebarSection } from '../sidebar-types';
// packages/modes/src/definitions/wqa.ts
import { defineMode } from './shared';

export const wqaLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'sessions', kind: 'list', label: 'Sessions', selectionMode: 'single', selectionKey: 'session.id', defaultOpen: true, pinned: true,
		items: [],
		resolveItems: ({ pages }) => [
			{ id: 'latest', label: 'Latest', meta: String(pages.length), icon: 'Clock' },
			{ id: 'compare', label: 'Compare sessions…', icon: 'Plus', action: 'compare' },
		],
	},
	{ id: 'categories', kind: 'facet', label: 'Categories', countKey: 'page.category', bullet: 'arrow',
		buckets: [
			{ value: 'article',  label: 'Article' },
			{ value: 'product',  label: 'Product' },
			{ value: 'category', label: 'Category' },
			{ value: 'listing',  label: 'Listing' },
			{ value: 'landing',  label: 'Landing' },
			{ value: 'legal',    label: 'Legal' },
			{ value: 'general',  label: 'General', dim: () => true },
		],
	},
	{ id: 'priority', kind: 'facet', label: 'Priority tier', countKey: 'wqa.priority', bullet: 'dot',
		buckets: [
			{ value: 'P0', label: 'Critical', tone: 'bad' },
			{ value: 'P1', label: 'High',     tone: 'warn' },
			{ value: 'P2', label: 'Medium' },
			{ value: 'P3', label: 'Low' },
			{ value: 'PS', label: 'Suppressed', dim: () => true },
		],
	},

	{ id: 'depth', kind: 'facet', label: 'Click depth', countKey: 'page.exactDepth', display: 'histogram',
		buckets: [
			{ value: '0', label: '0' },
			{ value: '1', label: '1' },
			{ value: '2', label: '2' },
			{ value: '3', label: '3' },
			{ value: '4', label: '4' },
			{ value: '5+', label: '5+' },
		],
		defaultOpen: true,
	},
	{ id: 'issueTaxonomy', kind: 'facet', label: 'Issue taxonomy', countKey: 'issue.category', bullet: 'arrow',
		buckets: [
			{ value: 'Tech',        label: 'Tech' },
			{ value: 'Content',     label: 'Content' },
			{ value: 'Links',       label: 'Links' },
			{ value: 'Schema',      label: 'Schema' },
			{ value: 'Performance', label: 'Performance' },
		],
	},
	{ id: 'searchPerf', kind: 'facet', label: 'Search perf buckets', countKey: 'wqa.searchPerf', bullet: 'dot',
		buckets: [
			{ value: 'winners',       label: 'Winners ▲', tone: 'good' },
			{ value: 'losers',        label: 'Losers ▼',  tone: 'bad'  },
			{ value: 'stagnant',      label: 'Stagnant' },
			{ value: 'noImpressions', label: 'No impressions' },
		],
	},

	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'P0+P1 catchable', mode: 'wqa', selections: { 'wqa.priority': ['P0', 'P1'], 'wqa.searchPerf': ['losers', 'stagnant'] } },
			{ name: 'Stale articles',  mode: 'wqa', selections: { 'page.category': ['article'], 'wqa.contentAge': ['stale'] } },
			{ name: 'Thin category',   mode: 'wqa', selections: { 'page.category': ['category'], 'content.quality': ['thin'] } },
		],
	},
];

export function registerWqaMode() {
	defineMode({
		id: 'wqa',
		description: 'Universal site quality with per-industry overlays.',
		defaultViewId: 'grid',
		views: [
			{ id: 'grid',    kind: 'table',     label: 'Pages',       shortcut: '1' },
			{ id: 'map',     kind: 'graph',     label: 'Structure',   shortcut: '2',
				submodes: [
					{ id: 'tree',    label: 'Tree' },
					{ id: 'cluster', label: 'Cluster' },
					{ id: 'graph',   label: 'Graph' },
				],
			},
			{ id: 'reports', kind: 'dashboard', label: 'Performance', shortcut: '3' },
		],
				lsSections: wqaLsSections,
		rsTabs: [
			{ id: 'wqa_overview', label: 'Overview' },
			{ id: 'wqa_actions',  label: 'Actions' },
			{ id: 'wqa_search',   label: 'Search' },
			{ id: 'wqa_content',  label: 'Content' },
			{ id: 'wqa_tech',     label: 'Tech' },
		],
		inspectorTabs: [
			{ id: 'summary', label: 'Summary', icon: 'LayoutDashboard' },
			{ id: 'quality', label: 'Quality', icon: 'Sparkles' },
			{ id: 'search',  label: 'Search',  icon: 'Search' },
			{ id: 'content', label: 'Content', icon: 'FileText' },
			{ id: 'tech',    label: 'Tech',    icon: 'Wrench' },
			{ id: 'links',   label: 'Links',   icon: 'Link2' },
			{ id: 'actions', label: 'Actions', icon: 'ListChecks' },
			{ id: 'history', label: 'History', icon: 'History' },
		],
		actionCodes: ['C01','C02','C03','C04','C05','C12','T01','T02','T08','L01','S01','A01'],
		industryOverlays: ['ecommerce','saas','blog','news','finance','education','healthcare','local','jobBoard','realEstate','restaurant'],
		visible: [
			'p.identity.url',
			's.score.healthGrade',
			'p.content.wordCount',
			'p.search.gsc.position',
			'p.search.gsc.clicks',
			'p.tech.cwv.bucket',
			'p.content.eeatScore',
			'p.ai.citation.rate',
			'p.ga.sessions',
			'p.links.inlinks',
			'p.action.topAction',
		],
	});
}
