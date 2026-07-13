import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const fullAuditLsSections: ReadonlyArray<SidebarSection> = [
	{
		id: 'sessions', kind: 'list', label: 'Sessions', selectionMode: 'single', selectionKey: 'session.id', defaultOpen: true, pinned: true,
		items: [],  // resolved at runtime
		resolveItems: ({ pages }) => /* see SessionResolver in Foundation context */ [
			{ id: 'latest', label: 'Latest', meta: String(pages.length), icon: 'Clock' },
			{ id: 'compare', label: 'Compare sessions…', icon: 'Plus', action: 'compare' },
		],
	},
	{
		id: 'scope', kind: 'facet', label: 'Scope', selectionMode: 'multi', selectionKey: 'scope.kind', countKey: 'scope.kind',
		bullet: 'check',
		buckets: [
			{ value: 'all',       label: 'All pages' },
			{ value: 'indexable', label: 'Indexable only' },
			{ value: 'sitemap',   label: 'In sitemap' },
			{ value: 'orphans',   label: 'Orphans',        tone: 'warn' },
			{ value: 'redirects', label: 'Redirects' },
			{ value: 'errors',    label: '4xx / 5xx',      tone: 'bad'  },
		],
	},
	{
		id: 'templates', kind: 'facet', label: 'Templates', countKey: 'page.category',
		bullet: 'check',
		buckets: [
			{ value: 'article',       label: 'Article' },
			{ value: 'product',       label: 'Product' },
			{ value: 'category',      label: 'Category' },
			{ value: 'landing',       label: 'Landing' },
			{ value: 'legal',         label: 'Legal' },
			{ value: 'uncategorized', label: 'Uncategorized' },
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
	{
		id: 'severity', kind: 'facet', label: 'Severity', countKey: 'wqa.priority',
		bullet: 'dot',
		buckets: [
			{ value: 'P0', label: 'Critical', tone: 'bad' },
			{ value: 'P1', label: 'High',     tone: 'warn' },
			{ value: 'P2', label: 'Medium' },
			{ value: 'P3', label: 'Low' },
		],
	},
	{
		id: 'category-mix', kind: 'facet', label: 'Category', countKey: 'issue.category',
		bullet: 'branch',
		buckets: [
			{ value: 'Tech',        label: 'Tech' },
			{ value: 'Content',     label: 'Content' },
			{ value: 'Links',       label: 'Links' },
			{ value: 'Schema',      label: 'Schema' },
			{ value: 'Performance', label: 'Performance' },
		],
	},
	{
		id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'All errors',         mode: 'fullAudit', selections: { 'page.statusClass': ['4xx', '5xx'] } },
			{ name: 'Missing metadata',   mode: 'fullAudit', selections: { 'content.quality': ['thin'] } },
			{ name: 'Deep orphan pages',  mode: 'fullAudit', selections: { 'page.exactDepth': ['5+'] } },
		],
	},
];

export function registerFullAuditMode() {
	defineMode({
		id: 'fullAudit',
		description: 'The complete SEO audit including all checks and metrics.',
		defaultViewId: 'pages',
		views: [
			{ id: 'pages',   kind: 'table',     label: 'Pages',    shortcut: '1' },
			{ id: 'charts',  kind: 'dashboard', label: 'Charts',   shortcut: '2' },
			{ id: 'sitemap', kind: 'graph',     label: 'Site Map', shortcut: '3' },
			{ id: 'issues',  kind: 'table',     label: 'Issues',   shortcut: '4' },
		],
				lsSections: fullAuditLsSections,
		rsTabs: [
			{ id: 'overview', label: 'Overview' },
			{ id: 'fixes',    label: 'Fixes' },
			{ id: 'search',   label: 'Search' },
			{ id: 'traffic',  label: 'Traffic' },
			{ id: 'tech',     label: 'Tech' },
			{ id: 'links',    label: 'Links' },
			{ id: 'ai',       label: 'AI' },
		],
		inspectorTabs: [
			{ id: 'summary',     label: 'Summary',     icon: 'LayoutDashboard' },
			{ id: 'html',        label: 'HTML',        icon: 'Code' },
			{ id: 'headers',     label: 'Headers',     icon: 'FileText' },
			{ id: 'links',       label: 'Links',       icon: 'Link2' },
			{ id: 'schema',      label: 'Schema',      icon: 'Braces' },
			{ id: 'content',     label: 'Content',     icon: 'FileType' },
			{ id: 'performance', label: 'Performance', icon: 'Gauge' },
			{ id: 'issues',      label: 'Issues',      icon: 'AlertTriangle' },
			{ id: 'history',     label: 'History',     icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.fullAudit,
		visible: [
			'p.identity.url',
			's.score.healthGrade',
			'p.content.title',
			'p.indexing.statusCode',
			'p.tech.cwv.bucket',
			'p.tech.sec.grade',
			'p.tech.a11y.score',
			'p.search.gsc.clicks',
			'p.ga.sessions',
			'p.content.wordCount',
			'p.links.inlinks',
			'p.action.topAction',
		],
	});
}
