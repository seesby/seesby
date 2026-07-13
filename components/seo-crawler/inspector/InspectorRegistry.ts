import React from 'react';
import type { Mode } from '@seesby/types';

export type InspectorTabDef = {
  id: string;
  label: string;
  icon: string;
  count?: (page: any) => number | undefined;
};

export type InspectorTabEntry = InspectorTabDef & {
  Component: React.FC<any>;
};

// Sync registry for shell rendering
export const INSPECTOR_TAB_DEFS: Record<Mode, Array<{ id: string; label: string; icon: string; count?: (page: any) => number | undefined }>> = {
  fullAudit: [
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
  wqa: [
    { id: 'summary', label: 'Summary', icon: 'LayoutDashboard' },
    { id: 'quality', label: 'Quality', icon: 'Sparkles' },
    { id: 'search',  label: 'Search',  icon: 'Search' },
    { id: 'content', label: 'Content', icon: 'FileText' },
    { id: 'tech',    label: 'Tech',    icon: 'Wrench' },
    { id: 'links',   label: 'Links',   icon: 'Link2' },
    { id: 'actions', label: 'Actions', icon: 'ListChecks' },
    { id: 'history', label: 'History', icon: 'History' },
  ],
  technical: [
    { id: 'summary',   label: 'Summary',        icon: 'LayoutDashboard' },
    { id: 'reqres',    label: 'Req/Resp',       icon: 'ArrowUpDown' },
    { id: 'dom',       label: 'Rendered DOM',   icon: 'Code' },
    { id: 'robots',    label: 'Robots/Sitemap',  icon: 'Bug' },
    { id: 'security',  label: 'Security',        icon: 'Shield' },
    { id: 'a11y',      label: 'A11y',            icon: 'Eye' },
    { id: 'schema',    label: 'Schema',          icon: 'Braces' },
    { id: 'history',   label: 'History',         icon: 'History' },
  ],
  content: [
    { id: 'summary',     label: 'Summary',     icon: 'LayoutDashboard' },
    { id: 'copy',        label: 'Copy',        icon: 'PenTool' },
    { id: 'readability', label: 'Readability',  icon: 'BookOpen' },
    { id: 'entities',    label: 'Entities',    icon: 'Network' },
    { id: 'duplication', label: 'Duplication', icon: 'Copy' },
    { id: 'schema',      label: 'Schema',      icon: 'Braces' },
    { id: 'search',      label: 'Search',      icon: 'Search' },
    { id: 'history',     label: 'History',     icon: 'History' },
  ],
  linksAuthority: [
    { id: 'summary', label: 'Summary',  icon: 'LayoutDashboard' },
    { id: 'source',  label: 'Source',   icon: 'ArrowDownToLine' },
    { id: 'target',  label: 'Target',   icon: 'ArrowUpFromLine' },
    { id: 'anchor',  label: 'Anchor',   icon: 'Anchor' },
    { id: 'context', label: 'Context',  icon: 'LayoutList' },
    { id: 'history', label: 'History',  icon: 'History' },
  ],
  ai: [
    { id: 'summary',    label: 'Summary',    icon: 'LayoutDashboard' },
    { id: 'bots',       label: 'Bot access',  icon: 'Bot' },
    { id: 'extractable', label: 'Extractable', icon: 'FileSearch' },
    { id: 'schema',     label: 'Schema',     icon: 'Braces' },
    { id: 'citations',  label: 'Citations',  icon: 'Quote' },
    { id: 'prompts',    label: 'Prompts',    icon: 'MessageSquare' },
    { id: 'history',    label: 'History',    icon: 'History' },
  ],
  competitors: [
    { id: 'summary',     label: 'Summary',      icon: 'LayoutDashboard' },
    { id: 'theirPage',   label: 'Their Page',   icon: 'ExternalLink' },
    { id: 'ourPage',     label: 'Our Page',     icon: 'FileText' },
    { id: 'kwOverlap',   label: 'Kw Overlap',   icon: 'GitCompare' },
    { id: 'linkOverlap', label: 'Link Overlap',  icon: 'Link2' },
    { id: 'actions',     label: 'Actions',       icon: 'ListChecks' },
  ],
  local: [
    { id: 'summary', label: 'Summary', icon: 'LayoutDashboard' },
    { id: 'nap',     label: 'NAP',     icon: 'MapPin' },
    { id: 'gbp',     label: 'GBP Profile', icon: 'Building2' },
    { id: 'reviews', label: 'Reviews', icon: 'Star' },
    { id: 'citations', label: 'Citations', icon: 'Quote' },
    { id: 'schema',  label: 'Local Schema', icon: 'Braces' },
    { id: 'rankings', label: 'Rankings', icon: 'TrendingUp' },
    { id: 'history', label: 'History', icon: 'History' },
  ],
  commerce: [
    { id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard' },
    { id: 'product',  label: 'Product',  icon: 'Package' },
    { id: 'variants', label: 'Variants', icon: 'Layers' },
    { id: 'schema',   label: 'Schema',   icon: 'Braces' },
    { id: 'feed',     label: 'Feed',     icon: 'Rss' },
    { id: 'search',   label: 'Search',   icon: 'Search' },
    { id: 'issues',   label: 'Issues',   icon: 'AlertTriangle' },
    { id: 'history',  label: 'History',  icon: 'History' },
  ],
  uxConversion: [
    { id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard' },
    { id: 'heatmap',  label: 'Heatmap',  icon: 'Flame' },
    { id: 'scroll',   label: 'Scroll',   icon: 'ArrowDown' },
    { id: 'friction', label: 'Friction', icon: 'MousePointerClick' },
    { id: 'forms',    label: 'Forms',    icon: 'TextCursorInput' },
    { id: 'cwv',      label: 'CWV',      icon: 'Gauge' },
    { id: 'replays',  label: 'Tests',    icon: 'FlaskConical' },
    { id: 'history',  label: 'History',  icon: 'History' },
  ],
  paid: [
    { id: 'summary',  label: 'Summary',  icon: 'LayoutDashboard' },
    { id: 'delivery', label: 'Delivery', icon: 'Truck' },
    { id: 'keywords', label: 'Keywords', icon: 'Key' },
    { id: 'creatives', label: 'Creatives', icon: 'Paintbrush' },
    { id: 'lps',      label: 'LPs',      icon: 'ExternalLink' },
    { id: 'auction',  label: 'Auction',  icon: 'Gavel' },
    { id: 'history',  label: 'History',  icon: 'History' },
  ],
  socialBrand: [
    { id: 'summary',    label: 'Summary',    icon: 'LayoutDashboard' },
    { id: 'content',    label: 'Content',    icon: 'FileText' },
    { id: 'performance', label: 'Performance', icon: 'TrendingUp' },
    { id: 'replies',    label: 'Replies',    icon: 'MessageCircle' },
    { id: 'traffic',    label: 'Traffic',    icon: 'BarChart3' },
    { id: 'ugc',        label: 'UGC',        icon: 'Users' },
    { id: 'history',    label: 'History',    icon: 'History' },
  ],
};

// Lazy-loaded tab component map — keyed by "mode:tabId"
const tabComponentCache = new Map<string, React.LazyExoticComponent<React.FC<{ page: any; hasTrend?: boolean }>>>();

function lazyTab(mode: string, tabId: string, factory: () => Promise<{ default: React.FC<{ page: any; hasTrend?: boolean }> }>) {
  const key = `${mode}:${tabId}`;
  if (!tabComponentCache.has(key)) {
    tabComponentCache.set(key, React.lazy(factory));
  }
  return tabComponentCache.get(key)!;
}

export function getTabComponent(mode: string, tabId: string): React.LazyExoticComponent<React.FC<{ page: any; hasTrend?: boolean }>> | null {
  const key = `${mode}:${tabId}`;
  if (tabComponentCache.has(key)) return tabComponentCache.get(key)!;

  // Register lazy components on first access
  const loaders: Record<string, () => Promise<{ default: React.FC<{ page: any; hasTrend?: boolean }> }>> = {
    // Full Audit
    // WQA
    'wqa:summary': () => import('../wqa/inspector/tabs/SummaryTab'),
    'wqa:quality': () => import('../wqa/inspector/tabs/QualityTab'),
    'wqa:search':  () => import('../wqa/inspector/tabs/SearchTab'),
    'wqa:content': () => import('../wqa/inspector/tabs/ContentTab'),
    'wqa:tech':    () => import('../wqa/inspector/tabs/TechTab'),
    'wqa:links':   () => import('../wqa/inspector/tabs/LinksTab'),
    'wqa:actions': () => import('../wqa/inspector/tabs/ActionsTab'),
    'wqa:history': () => import('../wqa/inspector/tabs/HistoryTab'),
    // Full Audit
    'fullAudit:summary':     () => import('./tabs/full-audit/SummaryTab'),
    'fullAudit:html':        () => import('./tabs/full-audit/HtmlTab'),
    'fullAudit:headers':     () => import('./tabs/full-audit/HeadersTab'),
    'fullAudit:links':       () => import('./tabs/full-audit/LinksTab'),
    'fullAudit:schema':      () => import('./tabs/full-audit/SchemaTab'),
    'fullAudit:content':     () => import('./tabs/full-audit/ContentTab'),
    'fullAudit:performance': () => import('./tabs/full-audit/PerformanceTab'),
    'fullAudit:issues':      () => import('./tabs/full-audit/IssuesTab'),
    'fullAudit:history':     () => import('./tabs/full-audit/HistoryTab'),
    // Technical
    'technical:summary':  () => import('./tabs/technical/SummaryTab'),
    'technical:reqres':   () => import('./tabs/technical/ReqRespTab'),
    'technical:dom':      () => import('./tabs/technical/DomTab'),
    'technical:robots':   () => import('./tabs/technical/RobotsTab'),
    'technical:security': () => import('./tabs/technical/SecurityTab'),
    'technical:a11y':     () => import('./tabs/technical/A11yTab'),
    'technical:schema':   () => import('./tabs/technical/SchemaTab'),
    'technical:history':  () => import('./tabs/technical/HistoryTab'),
    // Content
    'content:summary':     () => import('./tabs/content/SummaryTab'),
    'content:copy':        () => import('./tabs/content/CopyTab'),
    'content:readability': () => import('./tabs/content/ReadabilityTab'),
    'content:entities':    () => import('./tabs/content/EntitiesTab'),
    'content:duplication': () => import('./tabs/content/DuplicationTab'),
    'content:schema':      () => import('./tabs/content/SchemaTab'),
    'content:search':      () => import('./tabs/content/SearchTab'),
    'content:history':     () => import('./tabs/content/HistoryTab'),
    // Links
    'linksAuthority:summary': () => import('./tabs/links/SummaryTab'),
    'linksAuthority:source':  () => import('./tabs/links/SourceTab'),
    'linksAuthority:target':  () => import('./tabs/links/TargetTab'),
    'linksAuthority:anchor':  () => import('./tabs/links/AnchorTab'),
    'linksAuthority:context': () => import('./tabs/links/ContextTab'),
    'linksAuthority:history': () => import('./tabs/links/HistoryTab'),
    // AI & Answer Engines
    'ai:summary':    () => import('./tabs/ai/SummaryTab'),
    'ai:bots':       () => import('./tabs/ai/BotsTab'),
    'ai:extractable': () => import('./tabs/ai/ExtractableTab'),
    'ai:schema':     () => import('./tabs/ai/SchemaTab'),
    'ai:citations':  () => import('./tabs/ai/CitationsTab'),
    'ai:prompts':    () => import('./tabs/ai/PromptsTab'),
    'ai:history':    () => import('./tabs/ai/HistoryTab'),
    // Competitors
    'competitors:summary':     () => import('./tabs/competitors/SummaryTab'),
    'competitors:theirPage':   () => import('./tabs/competitors/TheirPageTab'),
    'competitors:ourPage':     () => import('./tabs/competitors/OurPageTab'),
    'competitors:kwOverlap':   () => import('./tabs/competitors/KwOverlapTab'),
    'competitors:linkOverlap': () => import('./tabs/competitors/LinkOverlapTab'),
    'competitors:actions':     () => import('./tabs/competitors/ActionsTab'),
    // Local
    'local:summary':   () => import('./tabs/local/SummaryTab'),
    'local:nap':       () => import('./tabs/local/NapTab'),
    'local:gbp':       () => import('./tabs/local/GbpTab'),
    'local:reviews':   () => import('./tabs/local/ReviewsTab'),
    'local:citations': () => import('./tabs/local/CitationsTab'),
    'local:schema':    () => import('./tabs/local/SchemaTab'),
    'local:rankings':  () => import('./tabs/local/RankingsTab'),
    'local:history':   () => import('./tabs/local/HistoryTab'),
    // Commerce
    'commerce:summary':  () => import('./tabs/commerce/SummaryTab'),
    'commerce:product':  () => import('./tabs/commerce/ProductTab'),
    'commerce:variants': () => import('./tabs/commerce/VariantsTab'),
    'commerce:schema':   () => import('./tabs/commerce/SchemaTab'),
    'commerce:feed':     () => import('./tabs/commerce/FeedStatusTab'),
    'commerce:search':   () => import('./tabs/commerce/SearchTab'),
    'commerce:issues':   () => import('./tabs/commerce/IssuesTab'),
    'commerce:history':  () => import('./tabs/commerce/HistoryTab'),
    // UX
    'uxConversion:summary':  () => import('./tabs/ux/SummaryTab'),
    'uxConversion:heatmap':  () => import('./tabs/ux/HeatmapTab'),
    'uxConversion:scroll':   () => import('./tabs/ux/ScrollTab'),
    'uxConversion:friction': () => import('./tabs/ux/FrictionTab'),
    'uxConversion:forms':    () => import('./tabs/ux/FormsTab'),
    'uxConversion:cwv':      () => import('./tabs/ux/CwvTab'),
    'uxConversion:replays':  () => import('./tabs/ux/ReplaysTab'),
    'uxConversion:history':  () => import('./tabs/ux/HistoryTab'),
    // Paid
    'paid:summary':   () => import('./tabs/paid/SummaryTab'),
    'paid:delivery':  () => import('./tabs/paid/DeliveryTab'),
    'paid:keywords':  () => import('./tabs/paid/KeywordsTab'),
    'paid:creatives': () => import('./tabs/paid/CreativesTab'),
    'paid:lps':       () => import('./tabs/paid/LpsTab'),
    'paid:auction':   () => import('./tabs/paid/AuctionTab'),
    'paid:history':   () => import('./tabs/paid/HistoryTab'),
    // Social & Brand
    'socialBrand:summary':     () => import('./tabs/social/SummaryTab'),
    'socialBrand:content':     () => import('./tabs/social/ContentTab'),
    'socialBrand:performance': () => import('./tabs/social/PerformanceTab'),
    'socialBrand:replies':     () => import('./tabs/social/RepliesTab'),
    'socialBrand:traffic':     () => import('./tabs/social/TrafficTab'),
    'socialBrand:ugc':         () => import('./tabs/social/UgcsTab'),
    'socialBrand:history':     () => import('./tabs/social/HistoryTab'),
  };

  const loader = loaders[key];
  if (!loader) return null;
  return lazyTab(mode, tabId, loader);
}

export function getInspectorTabsFor(mode: string): Array<{ id: string; label: string; icon: string }> {
  return INSPECTOR_TAB_DEFS[mode as Mode] || [];
}
