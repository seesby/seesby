import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const linksAuthorityLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'sources', kind: 'list', label: 'SOURCES', bullet: 'square-check', pinned: true,
		items: [
			{ id: 'ahrefs',   label: 'Ahrefs',   indicator: 'dot', tone: 'good' },
			{ id: 'majestic', label: 'Majestic', indicator: 'dot', tone: 'good' },
			{ id: 'csv',      label: 'Upload CSV', indicator: 'dot', tone: 'good' },
			{ id: 'gsc',      label: 'GSC link report' },
			{ id: 'add',      label: 'Add provider', action: 'add', icon: 'Plus' },
		],
	},
	{ id: 'linkType', kind: 'list', label: 'LINK TYPE', bullet: 'arrow',
		items: [
			{ id: 'internal', label: 'Internal' },
			{ id: 'ext-out',  label: 'External out' },
			{ id: 'backlink', label: 'Backlinks (in)' },
			{ id: 'redirect', label: 'Redirected' },
			{ id: 'broken',   label: 'Broken (404)' },
		],
	},
	{ id: 'refDomains', kind: 'list', label: 'REF DOMAINS', bullet: 'check',
		items: [
			{ id: 'dr90',   label: 'DR 90+' },
			{ id: 'dr70-89', label: 'DR 70-89' },
			{ id: 'dr40-69', label: 'DR 40-69' },
			{ id: 'dr-lt40', label: 'DR <40' },
			{ id: 'unique',  label: 'Unique' },
		],
	},
	{ id: 'anchorClasses', kind: 'list', label: 'ANCHOR CLASSES', bullet: 'dot',
		items: [
			{ id: 'brand',   label: 'Brand' },
			{ id: 'exact',   label: 'Exact match' },
			{ id: 'partial', label: 'Partial' },
			{ id: 'generic', label: 'Generic' },
			{ id: 'url',     label: 'URL' },
			{ id: 'image',   label: 'Image / no-text' },
		],
	},
	{ id: 'attributes', kind: 'facet', label: 'ATTRIBUTES', countKey: 'links.attribute', bullet: 'check',
		buckets: [
			{ value: 'dofollow',  label: 'dofollow' },
			{ value: 'nofollow',  label: 'nofollow' },
			{ value: 'ugc',       label: 'UGC' },
			{ value: 'sponsored', label: 'Sponsored' },
		],
	},
	{ id: 'toxicity', kind: 'list', label: 'TOXICITY', bullet: 'dot',
		items: [
			{ id: 'toxic',      label: 'Toxic',      meta: '62',  tone: 'bad' },
			{ id: 'suspicious', label: 'Suspicious', meta: '148', tone: 'warn' },
			{ id: 'low-quality', label: 'Low-quality', meta: '412' },
			{ id: 'clean',      label: 'Clean',      meta: '14,198', tone: 'good' },
		],
	},
	{ id: 'orphansDepth', kind: 'list', label: 'ORPHANS & DEPTH', bullet: 'check',
		items: [
			{ id: 'orphan', label: 'Orphan pages', meta: '26' },
			{ id: 'deep',   label: 'Depth >5',     meta: '42' },
			{ id: 'hub',    label: 'Hub pages',     meta: '18' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Lost in 30d',         mode: 'linksAuthority', selections: { linkType: ['broken'] } },
			{ name: 'Toxic w/ exact kw',   mode: 'linksAuthority', selections: { toxicity: ['toxic'], anchorClasses: ['exact'] } },
			{ name: 'DR90+ unclaimed',     mode: 'linksAuthority', selections: { refDomains: ['dr90'] } },
		],
	},
];

export function registerLinksAuthorityMode() {
	defineMode({
		id: 'linksAuthority',
		description: 'Backlink profile and internal link structure.',
		defaultViewId: 'graph',
		views: [
			{ id: 'graph',        kind: 'graph',     label: 'Link Graph',     shortcut: '1' },
			{ id: 'backlinks',    kind: 'table',     label: 'Backlinks',      shortcut: '2' },
			{ id: 'anchors',      kind: 'dashboard', label: 'Anchors',        shortcut: '3' },
			{ id: 'orphansDepth', kind: 'table',     label: 'Orphans & Depth', shortcut: '4' },
		],
		lsSections: linksAuthorityLsSections,
		rsTabs: [
			{ id: 'links_overview',  label: 'Overview' },
			{ id: 'links_internal',  label: 'Internal' },
			{ id: 'links_external',  label: 'External' },
			{ id: 'links_authority', label: 'Authority' },
			{ id: 'links_actions',   label: 'Actions' },
		],
		inspectorTabs: [
			{ id: 'summary', label: 'Summary',  icon: 'LayoutDashboard' },
			{ id: 'source',  label: 'Source',   icon: 'ArrowDownToLine' },
			{ id: 'target',  label: 'Target',   icon: 'ArrowUpFromLine' },
			{ id: 'anchor',  label: 'Anchor',   icon: 'Anchor' },
			{ id: 'context', label: 'Context',  icon: 'LayoutList' },
			{ id: 'history', label: 'History',  icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.linksAuthority,
		visible: [
			'p.identity.url',
			'p.links.inlinks',
			'p.links.referringDomains',
			'p.links.outlinks',
			'p.links.internalPagerank',
			'p.links.anchorTextDiversity',
			'p.links.toxicBacklinkShare',
			'p.links.orphan',
			'p.action.topAction',
		],
	});
}
