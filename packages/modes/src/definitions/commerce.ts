import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const commerceLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'catalogTree', kind: 'list', label: 'CATALOG TREE', bullet: 'arrow',
		items: [
			{ id: 'shoes', label: 'Shoes', meta: '320', children: [
				{ id: 'shoes-running', label: 'Running', meta: '82' },
				{ id: 'shoes-casual', label: 'Casual', meta: '124' },
				{ id: 'shoes-boots', label: 'Boots', meta: '42' },
			]},
			{ id: 'apparel', label: 'Apparel', meta: '240' },
			{ id: 'accessories', label: 'Accessories', meta: '88' },
			{ id: 'sale', label: 'Sale', meta: '110' },
			{ id: 'uncategorized', label: 'Uncategorized', meta: '22' },
		],
	},
	{ id: 'pageType', kind: 'facet', label: 'PAGE TYPE', countKey: 'commerce.pageType', bullet: 'check',
		buckets: [
			{ value: 'PDP',        label: 'Product (PDP)' },
			{ value: 'PLP',        label: 'Category (PLP)' },
			{ value: 'brand',      label: 'Brand' },
			{ value: 'collection', label: 'Collection' },
			{ value: 'search',     label: 'Search-result-like' },
		],
	},
	{ id: 'availability', kind: 'facet', label: 'AVAILABILITY', countKey: 'commerce.availability', bullet: 'dot',
		buckets: [
			{ value: 'in_stock',     label: 'In stock',     tone: 'good' },
			{ value: 'low_stock',    label: 'Low stock',    tone: 'warn' },
			{ value: 'out_of_stock', label: 'Out of stock', tone: 'bad'  },
			{ value: 'discontinued', label: 'Discontinued', tone: 'neutral' },
		],
	},
	{ id: 'priceTier', kind: 'facet', label: 'PRICE TIER', countKey: 'commerce.priceTier', bullet: 'bucket',
		buckets: [
			{ value: '0-50',    label: '0-50',    bullet: '$' },
			{ value: '50-150',  label: '50-150',  bullet: '$' },
			{ value: '150-500', label: '150-500', bullet: '$' },
			{ value: '500+',    label: '500+',    bullet: '$' },
		],
	},
	{ id: 'feedStatus', kind: 'list', label: 'FEED STATUS', bullet: 'dot',
		items: [
			{ id: 'approved',     label: 'Approved',     meta: '598', tone: 'good' },
			{ id: 'warning',      label: 'Warning',      meta: '42',  tone: 'warn' },
			{ id: 'disapproved',  label: 'Disapproved',  meta: '22',  tone: 'bad'  },
			{ id: 'not_in_feed',  label: 'Not in feed',  meta: '18',  tone: 'neutral' },
			{ id: 'config_merchant', label: 'Config Merchant', action: 'add', icon: 'Plus' },
		],
	},
	{ id: 'schemaVariants', kind: 'facet', label: 'SCHEMA / VARIANTS', countKey: 'commerce.schema', bullet: 'diamond',
		buckets: [
			{ value: 'product',         label: 'Product schema ✓' },
			{ value: 'offer',           label: 'Offer ✓' },
			{ value: 'aggregateRating', label: 'AggregateRating' },
			{ value: 'review',          label: 'Review' },
			{ value: 'variants',        label: 'Variants > 1' },
		],
	},
	{ id: 'funnelSegment', kind: 'list', label: 'FUNNEL SEGMENT', bullet: 'arrow',
		items: [
			{ id: 'high_intent', label: 'High-intent kw',     meta: '68' },
			{ id: 'mid_funnel',  label: 'Mid-funnel',          meta: '42' },
			{ id: 'top_funnel',  label: 'Top-funnel content',  meta: '88' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'OOS + traffic',      mode: 'commerce', selections: { 'commerce.availability': ['out_of_stock'], 'commerce.traffic': ['high'] } },
			{ name: 'Feed disapprovals',  mode: 'commerce', selections: { 'commerce.feed': ['disapproved'] } },
			{ name: 'PLP no-schema',      mode: 'commerce', selections: { 'commerce.pageType': ['PLP'], 'commerce.schema': [] } },
		],
	},
];

export function registerCommerceMode() {
	defineMode({
		id: 'commerce',
		description: 'Product catalog, pricing, and checkout health.',
		defaultViewId: 'products',
		views: [
			{ id: 'products',    kind: 'table',     label: 'Products',    shortcut: '1' },
			{ id: 'collections', kind: 'table',     label: 'Collections', shortcut: '2' },
			{ id: 'templates',   kind: 'table',     label: 'Templates',   shortcut: '3' },
			{ id: 'feed',        kind: 'dashboard', label: 'Feed Health', shortcut: '4' },
			{ id: 'funnel',      kind: 'canvas',    label: 'Funnel',      shortcut: '5' },
		],
		lsSections: commerceLsSections,
		rsTabs: [
			{ id: 'commerce_overview', label: 'Overview' },
			{ id: 'commerce_inventory', label: 'Inventory' },
			{ id: 'commerce_schema', label: 'Schema' },
			{ id: 'commerce_feed', label: 'Feed' },
			{ id: 'commerce_funnel', label: 'Funnel' },
		],
		inspectorTabs: [
			{ id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard' },
			{ id: 'products', label: 'Products', icon: 'Package' },
			{ id: 'feed',     label: 'Feed',     icon: 'Rss' },
			{ id: 'funnel',   label: 'Funnel',   icon: 'Filter' },
			{ id: 'schema',   label: 'Schema',   icon: 'Braces' },
			{ id: 'history',  label: 'History',  icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.commerce,
		visible: [
			'p.identity.url',
			'p.commerce.isProduct',
			'p.commerce.price',
			'p.commerce.availability',
			'p.commerce.reviewsCount',
			'p.commerce.reviewsAvg',
			'p.content.schema.types',
			'p.commerce.feed.present',
			'p.tech.cwv.bucket',
			'p.action.topAction',
		],
	});
}
