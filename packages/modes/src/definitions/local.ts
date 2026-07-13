import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const localLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'locations', kind: 'list', label: 'Locations tree', selectionMode: 'multi', selectionKey: 'local.location', defaultOpen: true, bullet: 'diamond', pinned: true,
		items: [],
		resolveItems: ({ pages }) => {
			const counts: Record<string, number> = {};
			for (const p of pages) {
				const loc = (p as any).country || (p as any).location || '';
				if (loc) counts[loc] = (counts[loc] || 0) + 1;
			}
			const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({
				id, label: id, meta: String(n),
			}));
			return [...rows, { id: 'add', label: 'Add location', icon: 'Plus', action: 'add' }];
		},
	},
	{ id: 'serviceAreas', kind: 'list', label: 'Service areas', bullet: 'arrow',
		items: [
			{ id: 'nyc',    label: 'NYC metro' },
			{ id: 'bay',    label: 'Bay Area' },
			{ id: 'london', label: 'London core' },
		],
	},
	{ id: 'gbpStatus', kind: 'facet', label: 'GBP status', countKey: 'local.gbpStatus', bullet: 'dot',
		buckets: [
			{ value: 'verified',  label: 'Verified',  tone: 'good' },
			{ value: 'pending',   label: 'Pending',   tone: 'warn' },
			{ value: 'suspended', label: 'Suspended', tone: 'bad'  },
			{ value: 'unclaimed', label: 'No GBP claim' },
		],
	},
	{ id: 'category', kind: 'facet', label: 'Primary category', countKey: 'local.category', bullet: 'arrow',
		buckets: [
			{ value: 'cafe',       label: 'Cafe' },
			{ value: 'restaurant', label: 'Restaurant' },
			{ value: 'retail',     label: 'Retail' },
			{ value: 'office',     label: 'Office' },
		],
	},
	{ id: 'reviewSources', kind: 'list', label: 'Review sources', selectionMode: 'multi', selectionKey: 'local.source', bullet: 'check',
		items: [
			{ id: 'google',      label: 'Google',      meta: '●', tone: 'good' },
			{ id: 'yelp',        label: 'Yelp',        meta: '●', tone: 'good' },
			{ id: 'trustpilot',  label: 'Trustpilot',  meta: '●', tone: 'good' },
			{ id: 'facebook',    label: 'Facebook' },
			{ id: 'tripadvisor', label: 'TripAdvisor' },
			{ id: 'opentable',   label: 'OpenTable' },
			{ id: 'connect',     label: 'Connect source', icon: 'Plus', action: 'add' },
		],
	},
	{ id: 'reviewBuckets', kind: 'facet', label: 'Review buckets', countKey: 'local.reviewBucket', bullet: 'bucket',
		buckets: [
			{ value: '4.5+',   label: '4.5+',   bullet: '★' },
			{ value: '4.0',    label: '4.0-4.4', bullet: '★' },
			{ value: '3.5',    label: '3.5-3.9', bullet: '★' },
			{ value: '<3.5',   label: '<3.5',   bullet: '★' },
			{ value: 'unans',  label: 'Unanswered (<48h)', bullet: '◆' },
		],
	},
	{ id: 'napStatus', kind: 'facet', label: 'NAP / Citations', countKey: 'local.napStatus', bullet: 'bucket',
		buckets: [
			{ value: 'match',    label: 'Consistent',       bullet: '✓', tone: 'good' },
			{ value: 'mismatch', label: 'Mismatched',       bullet: '⚠', tone: 'warn' },
			{ value: 'missing',  label: 'Missing from dir', bullet: '✗', tone: 'bad'  },
		],
	},
	{ id: 'localPack', kind: 'facet', label: 'Local pack', countKey: 'local.pack', bullet: 'dot',
		buckets: [
			{ value: 'top3',     label: 'Top-3', tone: 'good' },
			{ value: '4-10',     label: '4-10' },
			{ value: 'none',     label: 'Not ranking' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Unverified GBPs',   mode: 'local', selections: { 'local.gbpStatus': ['pending', 'suspended', 'unclaimed'] } },
			{ name: 'Low ratings',       mode: 'local', selections: { 'local.reviewBucket': ['3.5', '<3.5'] } },
			{ name: 'NAP inconsistencies', mode: 'local', selections: { 'local.napStatus': ['mismatch', 'missing'] } },
		],
	},
];

export function registerLocalMode() {
	defineMode({
		id: 'local',
		description: 'NAP consistency and local entity mapping.',
		defaultViewId: 'locations',
		views: [
			{ id: 'locations',   kind: 'table',     label: 'Locations',     shortcut: '1' },
			{ id: 'map',         kind: 'map',       label: 'Map',           shortcut: '2' },
			{ id: 'serviceAreas', kind: 'map',   label: 'Service Areas', shortcut: '3' },
			{ id: 'reviews',     kind: 'table',     label: 'Reviews',       shortcut: '4' },
		],
				lsSections: localLsSections,
		rsTabs: [
			{ id: 'local_overview', label: 'Overview' },
			{ id: 'local_gbp',      label: 'GBP' },
			{ id: 'local_nap',      label: 'NAP' },
			{ id: 'local_reviews',  label: 'Reviews' },
			{ id: 'local_pack',     label: 'Pack' },
		],
		inspectorTabs: [
			{ id: 'summary', label: 'Summary', icon: 'LayoutDashboard' },
			{ id: 'nap',     label: 'NAP',     icon: 'MapPin' },
			{ id: 'gbp',     label: 'GBP',     icon: 'Building' },
			{ id: 'reviews', label: 'Reviews', icon: 'Star' },
			{ id: 'pack',    label: 'Pack',    icon: 'LayoutList' },
			{ id: 'history', label: 'History', icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.local,
		visible: [
			'p.identity.url',
			'p.local.isLocationPage',
			'p.local.napOnPage',
			'p.local.localBusinessSchema',
			'p.local.embeddedMap',
			'e.local.reviewsAvgGoogle',
			'e.local.rankGeogrid',
			'p.indexing.statusCode',
			'p.action.topAction',
		],
	});
}
