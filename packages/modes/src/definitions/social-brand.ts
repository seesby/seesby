import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const socialBrandLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'profiles', kind: 'list', label: 'PROFILES', bullet: 'square-check', pinned: true, items: [],
		resolveItems: ({ pages }) => {
			const counts: Record<string, number> = {};
			for (const p of pages) {
				const ch = (p as any).socialChannel || (p as any).channel || '';
				if (ch) counts[ch] = (counts[ch] || 0) + 1;
			}
			return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({
				id, label: id, meta: n > 0 ? '●' : '', tone: 'good' as const, metaStyle: 'badge' as const, indicator: 'dot' as const,
			}));
		},
	},
	{ id: 'contentType', kind: 'list', label: 'CONTENT TYPE', bullet: 'arrow',
		items: [
			{ id: 'text',     label: 'Text / thread' },
			{ id: 'image',    label: 'Image' },
			{ id: 'video-l',  label: 'Video (long)' },
			{ id: 'video-s',  label: 'Video (short/reel)' },
			{ id: 'carousel', label: 'Carousel' },
			{ id: 'live',     label: 'Live' },
			{ id: 'story',    label: 'Story/ephemeral' },
			{ id: 'ugc',      label: 'UGC repost' },
		],
	},
	{ id: 'postStatus', kind: 'list', label: 'POST STATUS', bullet: 'dot',
		items: [
			{ id: 'published', label: 'Published', tone: 'good' },
			{ id: 'scheduled', label: 'Scheduled', tone: 'info' },
			{ id: 'draft',     label: 'Draft' },
			{ id: 'failed',    label: 'Failed',    tone: 'bad'  },
		],
	},
	{ id: 'campaign', kind: 'list', label: 'CAMPAIGN / CALENDAR', bullet: 'arrow',
		items: [
			{ id: 'launches',   label: 'Product launches' },
			{ id: 'leadership', label: 'Thought leadership' },
			{ id: 'community',  label: 'Community' },
			{ id: 'recruiting', label: 'Recruiting' },
			{ id: 'pr',         label: 'PR' },
		],
	},
	{ id: 'mentions', kind: 'list', label: 'MENTIONS FILTER', bullet: 'diamond',
		items: [
			{ id: 'positive',  label: 'Positive',            tone: 'good' },
			{ id: 'neutral',   label: 'Neutral' },
			{ id: 'negative',  label: 'Negative',            tone: 'bad'  },
			{ id: 'questions', label: 'Questions',           tone: 'info' },
			{ id: 'compared',  label: 'Competitor compared', tone: 'warn' },
			{ id: 'crisis',    label: 'Crisis signal',       tone: 'bad'  },
		],
	},
	{ id: 'influencer', kind: 'list', label: 'INFLUENCER TIER', bullet: 'dot-filled',
		items: [
			{ id: 'mega',  label: 'Mega (>1M)' },
			{ id: 'macro', label: 'Macro (100k-1M)' },
			{ id: 'mid',   label: 'Mid (10k-100k)' },
			{ id: 'micro', label: 'Micro (1k-10k)' },
			{ id: 'nano',  label: 'Nano (<1k)' },
		],
	},
	{ id: 'hashtags', kind: 'list', label: 'HASHTAGS / TOPICS', bullet: 'bucket',
		items: [],
		resolveItems: ({ pages }) => {
			const counts: Record<string, number> = {};
			for (const p of pages) {
				const tags = (p as any).hashtags || (p as any).topics || [];
				if (Array.isArray(tags)) tags.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1 });
			}
			return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({
				id, label: id, meta: String(n), bullet: '#',
			}));
		},
	},
	{ id: 'utm', kind: 'list', label: 'UTM / TRAFFIC SOURCES', bullet: 'arrow',
		items: [
			{ id: 'organic',  label: 'social-organic' },
			{ id: 'paid',     label: 'social-paid' },
			{ id: 'referral', label: 'referral-social' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'Negative mentions',   mode: 'socialBrand', selections: { mentions: ['negative'] } },
			{ name: 'Scheduled this wk',   mode: 'socialBrand', selections: { postStatus: ['scheduled'] } },
			{ name: 'OG issues + traffic',  mode: 'socialBrand', selections: { utm: ['organic', 'paid'] } },
		],
	},
];

export function registerSocialBrandMode() {
	defineMode({
		id: 'socialBrand',
		description: 'Social signals and brand mentions.',
		defaultViewId: 'overview',
		views: [
			{ id: 'overview',   kind: 'dashboard', label: 'Overview',   shortcut: '0' },
			{ id: 'profiles',   kind: 'dashboard', label: 'Profiles',   shortcut: '1' },
			{ id: 'posts',      kind: 'table',     label: 'Posts',      shortcut: '2' },
			{ id: 'mentions',   kind: 'dashboard', label: 'Mentions',   shortcut: '3' },
			{ id: 'engagement', kind: 'dashboard', label: 'Engagement', shortcut: '4' },
			{ id: 'traffic',    kind: 'dashboard', label: 'Traffic',    shortcut: '5' },
			{ id: 'metaAudit',  kind: 'table',     label: 'Meta Audit', shortcut: '6' },
		],
				lsSections: socialBrandLsSections,
		rsTabs: [
			{ id: 'social_overview', label: 'Overview' },
			{ id: 'social_mentions', label: 'Mentions' },
			{ id: 'social_engagement', label: 'Engagement' },
			{ id: 'social_traffic', label: 'Traffic' },
			{ id: 'social_actions', label: 'Actions' },
		],
		inspectorTabs: [
			{ id: 'summary',    label: 'Summary',    icon: 'LayoutDashboard' },
			{ id: 'profiles',   label: 'Profiles',   icon: 'Users' },
			{ id: 'mentions',   label: 'Mentions',   icon: 'MessageSquare' },
			{ id: 'engagement', label: 'Engagement', icon: 'Heart' },
			{ id: 'traffic',    label: 'Traffic',    icon: 'BarChart3' },
			{ id: 'history',    label: 'History',    icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.socialBrand,
		visible: [
			'p.identity.url',
			'p.social.shares.total',
			's.social.profiles',
			's.social.mentions.volume',
			's.social.mentions.sentiment',
			's.social.engagementRate.twitter',
			'p.content.eeatScore',
			'p.search.gsc.clicks',
			'p.action.topAction',
		],
	});
}
