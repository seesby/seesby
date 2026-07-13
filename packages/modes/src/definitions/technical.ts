import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const technicalLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'sessions', kind: 'list', label: 'Sessions', selectionMode: 'single', selectionKey: 'session.id', defaultOpen: true, pinned: true, items: [],
		resolveItems: ({ pages }) => [
			{ id: 'latest', label: 'Latest', meta: String(pages.length), icon: 'Clock' },
			{ id: 'compare', label: 'Compare sessions…', icon: 'Plus', action: 'compare' },
		],
	},
	{ id: 'rendering', kind: 'facet', label: 'Rendering', countKey: 'tech.rendering', bullet: 'check',
		buckets: [
			{ value: 'static',      label: 'Static' },
			{ value: 'ssr',         label: 'SSR' },
			{ value: 'csr-blocked', label: 'CSR-blocked', tone: 'bad' },
			{ value: 'hybrid',      label: 'Hybrid' },
		],
	},
	{ id: 'status', kind: 'facet', label: 'Status', countKey: 'page.statusClass', bullet: 'check',
		buckets: [
			{ value: '2xx',     label: '2xx',     tone: 'good' },
			{ value: '3xx',     label: '3xx',     tone: 'info' },
			{ value: '4xx',     label: '4xx',     tone: 'bad'  },
			{ value: '5xx',     label: '5xx',     tone: 'bad'  },
			{ value: 'timeout', label: 'Timeout', tone: 'bad'  },
		],
	},
	{ id: 'cwv', kind: 'facet', label: 'CWV (bucket)', countKey: 'tech.cwv', bullet: 'dot',
		buckets: [
			{ value: 'lcp-good',   label: 'LCP good',      tone: 'good' },
			{ value: 'lcp-warn',   label: 'LCP needs imp.', tone: 'warn' },
			{ value: 'lcp-poor',   label: 'LCP poor',      tone: 'bad'  },
			{ value: 'inp-poor',   label: 'INP poor',      tone: 'bad'  },
			{ value: 'cls-poor',   label: 'CLS poor',      tone: 'bad'  },
		],
	},
	{ id: 'security', kind: 'facet', label: 'Security', countKey: 'tech.security', bullet: 'check',
		buckets: [
			{ value: 'https',         label: 'HTTPS everywhere', tone: 'good' },
			{ value: 'hsts',          label: 'HSTS present',     tone: 'good' },
			{ value: 'csp-missing',   label: 'CSP missing',      tone: 'bad'  },
			{ value: 'mixed-content', label: 'Mixed content',    tone: 'bad'  },
			{ value: 'tls-1.2-only',  label: 'TLS 1.2 only',     tone: 'warn' },
		],
	},
	{ id: 'robots', kind: 'facet', label: 'Robots / Index', countKey: 'tech.robots', bullet: 'arrow',
		buckets: [
			{ value: 'allowed',          label: 'Allowed',          tone: 'good' },
			{ value: 'disallowed',       label: 'Disallowed',       tone: 'bad'  },
			{ value: 'noindex-meta',     label: 'Noindex meta',     tone: 'bad'  },
			{ value: 'x-robots-noindex', label: 'X-Robots noindex', tone: 'bad'  },
			{ value: 'not-in-sitemap',   label: 'Not in sitemap',   tone: 'warn' },
			{ value: 'hreflang-issues',  label: 'Hreflang issues',  tone: 'bad'  },
		],
	},
	{ id: 'a11y', kind: 'facet', label: 'Accessibility', countKey: 'tech.a11y', bullet: 'dot',
		buckets: [
			{ value: 'critical', label: 'Critical', tone: 'bad'  },
			{ value: 'serious',  label: 'Serious',  tone: 'bad'  },
			{ value: 'moderate', label: 'Moderate', tone: 'warn' },
			{ value: 'minor',    label: 'Minor',    tone: 'info' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'CWV poor',       mode: 'technical', selections: { 'tech.cwv': ['lcp-poor', 'inp-poor', 'cls-poor'] } },
			{ name: 'Broken pages',   mode: 'technical', selections: { 'page.statusClass': ['4xx', '5xx', 'timeout'] } },
			{ name: 'CSR-blocked',    mode: 'technical', selections: { 'tech.rendering': ['csr-blocked'] } },
		],
	},
];

export function registerTechnicalMode() {
	defineMode({
		id: 'technical',
		description: 'Core technical SEO, crawling, and indexing.',
		defaultViewId: 'pages',
		views: [
			{ id: 'pages',        kind: 'table',     label: 'Pages',           shortcut: '1' },
			{ id: 'crawlMap',     kind: 'graph',     label: 'Crawl Map',       shortcut: '2' },
			{ id: 'renderDiff',   kind: 'canvas',    label: 'Render Diff',     shortcut: '3' },
			{ id: 'securityA11y', kind: 'dashboard', label: 'Security & A11y', shortcut: '4' },
		],
				lsSections: technicalLsSections,
		rsTabs: [
			{ id: 'tech_overview',     label: 'Overview' },
			{ id: 'tech_crawlability', label: 'Crawlability' },
			{ id: 'tech_speed',        label: 'Speed' },
			{ id: 'tech_security',     label: 'Security' },
			{ id: 'tech_a11y',         label: 'Accessibility' },
		],
		inspectorTabs: [
			{ id: 'summary',   label: 'Summary',        icon: 'LayoutDashboard' },
			{ id: 'reqres',    label: 'Req/Resp',       icon: 'ArrowUpDown' },
			{ id: 'dom',       label: 'Rendered DOM',   icon: 'Code' },
			{ id: 'robots',    label: 'Robots/Sitemap',  icon: 'Bug' },
			{ id: 'security',  label: 'Security',        icon: 'Shield' },
			{ id: 'a11y',      label: 'A11y',            icon: 'Eye' },
			{ id: 'schema',    label: 'Schema',          icon: 'Braces' },
			{ id: 'history',   label: 'History',         icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.technical,
		visible: [
			'p.identity.url',
			'p.indexing.statusCode',
			'p.indexing.indexable',
			'p.tech.cwv.bucket',
			'p.tech.renderMode',
			'p.tech.sec.grade',
			'p.tech.a11y.score',
			'p.content.schema.types',
			'p.indexing.redirectUrl',
			'p.tech.issueCount',
			'p.action.topAction',
		],
	});
}
