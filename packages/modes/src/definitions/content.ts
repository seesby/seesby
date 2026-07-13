import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const contentLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'sessions', kind: 'list', label: 'Sessions', selectionMode: 'single', selectionKey: 'session.id', defaultOpen: true, pinned: true, items: [],
		resolveItems: ({ pages }) => [
			{ id: 'latest', label: 'Latest', meta: String(pages.length), icon: 'Clock' },
			{ id: 'compare', label: 'Compare sessions…', icon: 'Plus', action: 'compare' },
		],
	},
	{ id: 'clusters', kind: 'facet', label: 'Topic clusters', countKey: 'content.cluster', bullet: 'arrow', maxVisible: 10 },
	{ id: 'type', kind: 'facet', label: 'Content type', countKey: 'content.type', bullet: 'arrow',
		buckets: [
			{ value: 'article',     label: 'Article' },
			{ value: 'blog_post',   label: 'Blog post' },
			{ value: 'guide',       label: 'Guide' },
			{ value: 'docs',        label: 'Docs' },
			{ value: 'landing',     label: 'Landing' },
			{ value: 'product',     label: 'Product' },
			{ value: 'category',    label: 'Category' },
			{ value: 'page',        label: 'Page' },
		],
	},
	{ id: 'authors', kind: 'facet', label: 'Authors', countKey: 'content.author', bullet: 'dot-outline', maxVisible: 8 },
	{ id: 'freshness', kind: 'facet', label: 'Freshness', countKey: 'content.freshness', bullet: 'dot',
		buckets: [
			{ value: 'fresh',  label: 'Fresh (≤6mo)',  tone: 'good' },
			{ value: 'aging',  label: 'Aging (6–18mo)' },
			{ value: 'stale',  label: 'Stale (>18mo)', tone: 'warn' },
			{ value: 'nodate', label: 'No date',       dim: () => true },
		],
	},
	{ id: 'quality', kind: 'facet', label: 'Quality buckets', countKey: 'content.quality', bullet: 'dot',
		buckets: [
			{ value: 'high',     label: 'High',      tone: 'good' },
			{ value: 'standard', label: 'Standard' },
			{ value: 'thin',     label: 'Thin (<300w)', tone: 'warn' },
			{ value: 'duplicate', label: 'Duplicate',  tone: 'bad'  },
		],
	},
	{ id: 'duplication', kind: 'facet', label: 'Duplication', countKey: 'content.duplication', bullet: 'diamond',
		buckets: [
			{ value: 'unique',   label: 'Unique',   tone: 'good' },
			{ value: 'cluster:*', label: 'In cluster', dim: () => false },  // dynamic prefix; counts merged in extractor
		],
		hideWhenEmpty: false,
	},
	{ id: 'language', kind: 'facet', label: 'Language', countKey: 'page.lang', bullet: 'arrow' },
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Stale articles',  mode: 'content', selections: { 'content.type': ['article', 'blog_post'], 'content.freshness': ['stale'] } },
			{ name: 'Thin product copy', mode: 'content', selections: { 'content.type': ['product'], 'content.quality': ['thin'] } },
			{ name: 'Duplicate clusters', mode: 'content', selections: { 'content.quality': ['duplicate'] } },
		],
	},
];

export function registerContentMode() {
	defineMode({
		id: 'content',
		description: 'Content quality, age, and semantic richness.',
		defaultViewId: 'pages',
		views: [
			{ id: 'pages',      kind: 'table',    label: 'Pages',              shortcut: '1' },
			{ id: 'clusters',   kind: 'graph',    label: 'Clusters',           shortcut: '2' },
			{ id: 'duplicates', kind: 'table',    label: 'Duplicates',         shortcut: '3' },
			{ id: 'calendar',   kind: 'timeline', label: 'Editorial Calendar', shortcut: '4' },
		],
		lsSections: contentLsSections,
		rsTabs: [
			{ id: 'overview',     label: 'Overview' },
			{ id: 'topics',       label: 'Topics' },
			{ id: 'quality',      label: 'Quality' },
			{ id: 'freshness',    label: 'Freshness' },
			{ id: 'duplication',  label: 'Duplication' },
		],
		inspectorTabs: [
			{ id: 'summary',     label: 'Summary',     icon: 'LayoutDashboard' },
			{ id: 'quality',     label: 'Quality',     icon: 'Sparkles' },
			{ id: 'freshness',   label: 'Freshness',   icon: 'Clock' },
			{ id: 'duplication', label: 'Duplication', icon: 'Copy' },
			{ id: 'entities',    label: 'Entities',    icon: 'Network' },
			{ id: 'history',     label: 'History',     icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.content,
		visible: [
			'p.identity.url',
			'p.content.title',
			'p.content.wordCount',
			'p.content.readabilityFlesch',
			'p.content.freshness.days',
			'p.content.eeatScore',
			'p.content.topicCluster',
			'p.search.gsc.clicks',
			'p.search.gsc.position',
			'p.content.duplicateExact',
			'p.action.topAction',
		],
	});
}
