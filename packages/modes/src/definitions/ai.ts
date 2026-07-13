import type { SidebarSection } from '../sidebar-types';
import { defineMode } from './shared';
import { MODE_ACTIONS } from './_mode-action-map';

export const aiLsSections: ReadonlyArray<SidebarSection> = [
	{ id: 'bots', kind: 'list', label: 'BOTS (AI crawlers)', bullet: 'square-check',
		items: [
			{ id: 'gptbot',        label: 'GPTBot',        indicator: 'dot', tone: 'good' },
			{ id: 'chatgpt-user',  label: 'ChatGPT-User',  indicator: 'dot', tone: 'good' },
			{ id: 'oai-searchbot', label: 'OAI-SearchBot', indicator: 'dot', tone: 'good' },
			{ id: 'perplexitybot', label: 'PerplexityBot', indicator: 'dot', tone: 'good' },
			{ id: 'perp-user',     label: 'Perplexity-User', indicator: 'dot', tone: 'good' },
			{ id: 'claudebot',     label: 'ClaudeBot',     indicator: 'dot', tone: 'good' },
			{ id: 'claude-web',    label: 'Claude-Web',    indicator: 'dot', tone: 'good' },
			{ id: 'google-ext',    label: 'Google-Extended', indicator: 'dot', tone: 'good' },
			{ id: 'google-other',  label: 'GoogleOther',   indicator: 'dot', tone: 'good' },
			{ id: 'apple-ext',     label: 'Applebot-Extended', indicator: 'dot', tone: 'bad' },
			{ id: 'ccbot',         label: 'CCBot',         indicator: 'dot', tone: 'good' },
		],
	},
	{ id: 'promptSets', kind: 'list', label: 'PROMPT SETS', bullet: 'arrow',
		items: [
			{ id: 'brand',         label: 'Brand',         meta: '42' },
			{ id: 'informational', label: 'Informational', meta: '88' },
			{ id: 'commercial',    label: 'Commercial',    meta: '64' },
			{ id: 'comparison',    label: 'Comparison',    meta: '34' },
			{ id: 'transactional', label: 'Transactional', meta: '22' },
			{ id: 'new-set',       label: 'New set…',      action: 'add', icon: 'Plus' },
		],
	},
	{ id: 'models', kind: 'list', label: 'CITATION SOURCE', bullet: 'dot',
		items: [
			{ id: 'gpt-5',         label: 'GPT-5',         meta: '8' },
			{ id: 'sonnet-4.5',    label: 'Sonnet 4.5',    meta: '6' },
			{ id: 'perplexity',    label: 'Perplexity',    meta: '4' },
			{ id: 'gemini-2.5',    label: 'Gemini 2.5',    meta: '7' },
			{ id: 'connect-more',  label: 'Connect Grok / DeepSeek', action: 'add', icon: 'Plus' },
		],
	},
	{ id: 'citationBuckets', kind: 'list', label: 'CITATION BUCKETS', bullet: 'dot-filled',
		items: [
			{ id: 'cited',         label: 'Cited (≥1 prompt)', meta: '142' },
			{ id: 'uncited-ready', label: 'Uncited, AI-ready', meta: '88' },
			{ id: 'uncited-not',   label: 'Uncited, not ready', meta: '172' },
		],
	},
	{ id: 'extractability', kind: 'list', label: 'EXTRACTABILITY', bullet: 'arrow',
		items: [
			{ id: 'high',   label: 'High (FAQ/HowTo)', meta: '48' },
			{ id: 'medium', label: 'Medium',           meta: '182' },
			{ id: 'low',    label: 'Low (CSR/thin)',   meta: '172' },
		],
	},
	{ id: 'schemaAi', kind: 'list', label: 'SCHEMA (AI-relevant)', bullet: 'diamond',
		items: [
			{ id: 'article', label: 'Article + Author', meta: '68' },
			{ id: 'faq',     label: 'FAQPage',          meta: '22' },
			{ id: 'howto',   label: 'HowTo',            meta: '14' },
			{ id: 'org',     label: 'Org + sameAs',     meta: '✓ site' },
		],
	},
	{ id: 'globalFiles', kind: 'list', label: 'GLOBAL FILES', bullet: 'bucket',
		items: [
			{ id: 'robots',    label: 'robots.txt',    bullet: '✓', tone: 'good' },
			{ id: 'llms',      label: 'llms.txt',      bullet: '✗', tone: 'bad', meta: 'add', action: 'add' },
			{ id: 'llms-full', label: 'llms-full.txt', bullet: '✗', tone: 'bad', meta: 'add', action: 'add' },
			{ id: 'ai-txt',    label: 'ai.txt',         bullet: '✗', tone: 'bad' },
		],
	},
	{ id: 'savedViews', kind: 'saved-views', label: 'Saved views',
		defaultViews: [
			{ name: 'AI-ready, uncited', mode: 'ai', selections: { citationBuckets: ['uncited-ready'] } },
			{ name: 'Blocked bots',       mode: 'ai', selections: { bots: ['apple-ext'] } },
			{ name: 'Target commercial',  mode: 'ai', selections: { promptSets: ['commercial'] } },
		],
	},
];

export function registerAiMode() {
	defineMode({
		id: 'ai',
		description: 'Visibility in AI and Answer Engines.',
		defaultViewId: 'pages',
		views: [
			{ id: 'pages',    kind: 'table',  label: 'Pages',    shortcut: '1' },
			{ id: 'prompts',  kind: 'canvas', label: 'Prompts',  shortcut: '2' },
			{ id: 'entities', kind: 'graph',  label: 'Entities', shortcut: '3' },
		],
				lsSections: aiLsSections,
		rsTabs: [
			{ id: 'ai_overview', label: 'Overview' },
			{ id: 'ai_crawlability', label: 'Crawlability' },
			{ id: 'ai_citations', label: 'Citations' },
			{ id: 'ai_entities', label: 'Entities' },
			{ id: 'ai_schema', label: 'Schema' },
		],
		inspectorTabs: [
			{ id: 'summary',    label: 'Summary',    icon: 'LayoutDashboard' },
			{ id: 'bots',       label: 'Bots',       icon: 'Bot' },
			{ id: 'schema',     label: 'Schema',     icon: 'Braces' },
			{ id: 'entities',   label: 'Entities',   icon: 'Network' },
			{ id: 'citations',  label: 'Citations',  icon: 'Quote' },
			{ id: 'history',    label: 'History',    icon: 'History' },
		],
		actionCodes: MODE_ACTIONS.ai,
		visible: [
			'p.identity.url',
			'p.ai.botsAllowed',
			'p.ai.extractability',
			'p.ai.citation.rate',
			'p.ai.llmsTxt',
			'p.ai.entityCoverage',
			'p.ai.schemaForAI',
			'p.content.eeatScore',
			'p.action.topAction',
		],
	});
}
