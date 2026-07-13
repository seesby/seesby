import type { AuditMode, DetectedIndustry, IndustryFilter } from '@seesby/types';
import { INDUSTRY_FILTER_LABELS } from '@seesby/types';

// ⚠️ DEPRECATED — This file is a legacy parallel to the canonical mode system in
// packages/modes/src/definitions/*. It is still consumed by SeoCrawlerContext.tsx
// for backward compatibility. All new code should use MODE_CONFIGS from
// services/crawler/pipeline/mode-definitions.ts instead.

export interface AuditModeConfig {
    id: AuditMode;
    label: string;
    description: string;
    icon: string;
    totalChecks: string;
    viewType: 'grid' | 'competitor_matrix' | 'ai_view' | 'geo_view' | 'opportunity_view' | 'visual_heat_map';
    defaultColumns: string[];
    isCompetitiveMode?: boolean;
    isWqaMode?: boolean;
}

export interface IndustryConfig {
    id: IndustryFilter;
    label: string;
    description: string;
    icon: string;
    extraChecksLabel: string;
}

export const AUDIT_MODES: Record<AuditMode, AuditModeConfig> = {
    full: {
        id: 'fullAudit',
        label: 'Full Audit',
        description: 'All checks and all categories',
        icon: '🔍',
        totalChecks: '~250',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 's.health.score', 'p.content.title',
            'p.indexing.statusCode', 'p.tech.cwv.bucket', 'p.tech.sec.grade',
            'p.tech.a11y.score', 'p.search.gsc.clicks', 'p.ga.sessions',
            'p.content.wordCount', 'p.links.inlinks', 'p.action.topAction',
        ]
    },
    website_quality: {
        id: 'wqa',
        label: 'Website Quality',
        description: 'Overall site quality, search performance, and actions',
        icon: '🌐',
        totalChecks: '~80',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 's.health.score', 'p.content.wordCount',
            'p.search.gsc.position', 'p.search.gsc.clicks', 'p.tech.cwv.bucket',
            'p.content.eeatScore', 'p.ai.citation.rate', 'p.ga.sessions',
            'p.links.inlinks', 'p.action.topAction',
        ],
        isWqaMode: true,
    },
    technical_seo: {
        id: 'technical',
        label: 'Technical SEO Audit',
        description: 'Crawlability, indexing, speed, and protocol checks',
        icon: '⚙️',
        totalChecks: '~75',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.indexing.statusCode', 'p.indexing.indexable',
            'p.tech.cwv.bucket', 'p.tech.renderMode', 'p.tech.sec.grade',
            'p.tech.a11y.score', 'p.content.schema.types', 'p.indexing.redirectUrl',
            'p.tech.issueCount', 'p.action.topAction',
        ]
    },
    content: {
        id: 'content',
        label: 'Content Audit',
        description: 'Quality, duplication, decay, and topic coverage',
        icon: '📝',
        totalChecks: '~60',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.content.title', 'p.content.wordCount',
            'p.content.readabilityFlesch', 'p.content.freshness.days',
            'p.content.eeatScore', 'p.content.topicCluster', 'p.search.gsc.clicks',
            'p.search.gsc.position', 'p.content.duplicateExact', 'p.action.topAction',
        ]
    },
    on_page_seo: {
        id: 'wqa',
        label: 'On-Page SEO Audit',
        description: 'Titles, metadata, headings, and schema basics',
        icon: '📊',
        totalChecks: '~55',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 's.health.score', 'p.content.wordCount',
            'p.search.gsc.position', 'p.search.gsc.clicks', 'p.tech.cwv.bucket',
            'p.content.eeatScore', 'p.ai.citation.rate', 'p.ga.sessions',
            'p.links.inlinks', 'p.action.topAction',
        ]
    },
    off_page: {
        id: 'linksAuthority',
        label: 'Off-Page Audit',
        description: 'Authority, backlinks, and outbound footprint',
        icon: '🔗',
        totalChecks: '~40',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.links.inlinks', 'p.links.referringDomains',
            'p.links.outlinks', 'p.links.internalPagerank', 'p.links.anchorTextDiversity',
            'p.links.toxicBacklinkShare', 'p.links.orphan', 'p.action.topAction',
        ]
    },
    local_seo: {
        id: 'local',
        label: 'Local SEO Audit',
        description: 'Local relevance and location-first checks',
        icon: '📍',
        totalChecks: '~50',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.local.isLocationPage', 'p.local.napOnPage',
            'p.local.localBusinessSchema', 'p.local.embeddedMap',
            'e.local.reviewsAvgGoogle', 'e.local.rankGeogrid',
            'p.indexing.statusCode', 'p.action.topAction',
        ]
    },
    ecommerce: {
        id: 'commerce',
        label: 'E-commerce Audit',
        description: 'Catalog, product, and conversion-critical checks',
        icon: '🛒',
        totalChecks: '~65',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.commerce.isProduct', 'p.commerce.price',
            'p.commerce.availability', 'p.commerce.reviewsCount', 'p.commerce.reviewsAvg',
            'p.content.schema.types', 'p.commerce.feed.present', 'p.tech.cwv.bucket',
            'p.action.topAction',
        ]
    },
    news_editorial: {
        id: 'content',
        label: 'News / Editorial Audit',
        description: 'Freshness, article quality, and publishing signals',
        icon: '📰',
        totalChecks: '~50',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.content.title', 'p.content.wordCount',
            'p.content.readabilityFlesch', 'p.content.freshness.days',
            'p.content.eeatScore', 'p.content.topicCluster', 'p.search.gsc.clicks',
            'p.search.gsc.position', 'p.content.duplicateExact', 'p.action.topAction',
        ]
    },
    ai_discoverability: {
        id: 'ai',
        label: 'AI Discoverability',
        description: 'AI crawler readiness and answer-engine signals',
        icon: '🤖',
        totalChecks: '~25',
        viewType: 'ai_view',
        defaultColumns: [
            'p.identity.url', 'p.ai.botsAllowed', 'p.ai.extractability',
            'p.ai.citation.rate', 'p.ai.llmsTxt', 'p.ai.entityCoverage',
            'p.ai.schemaForAI', 'p.content.eeatScore', 'p.action.topAction',
        ]
    },
    competitor_gap: {
        id: 'competitors',
        label: 'Competitor Gap Analysis',
        description: 'Keyword and content opportunities against competitors',
        icon: '🎯',
        totalChecks: '~45',
        viewType: 'competitor_matrix',
        defaultColumns: [
            'e.competitor.domain', 'e.competitor.kwOverlap',
            'e.competitor.sovOrganic', 'e.competitor.sovPaid',
            'e.competitor.backlinkOverlap', 'e.competitor.pricing',
            'e.competitor.contentVelocity', 'e.competitor.wins', 'e.competitor.losses',
        ],
        isCompetitiveMode: true
    },
    business: {
        id: 'wqa',
        label: 'Business Audit',
        description: 'Commercial intent and conversion readiness',
        icon: '💼',
        totalChecks: '~40',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 's.health.score', 'p.content.wordCount',
            'p.search.gsc.position', 'p.search.gsc.clicks', 'p.tech.cwv.bucket',
            'p.content.eeatScore', 'p.ai.citation.rate', 'p.ga.sessions',
            'p.links.inlinks', 'p.action.topAction',
        ]
    },
    accessibility: {
        id: 'technical',
        label: 'Accessibility Audit',
        description: 'A11y and usability for all users',
        icon: '♿',
        totalChecks: '~30',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.indexing.statusCode', 'p.indexing.indexable',
            'p.tech.cwv.bucket', 'p.tech.renderMode', 'p.tech.sec.grade',
            'p.tech.a11y.score', 'p.content.schema.types', 'p.indexing.redirectUrl',
            'p.tech.issueCount', 'p.action.topAction',
        ]
  },
    security: {
        id: 'technical',
        label: 'Security Audit',
        description: 'HTTPS, headers, cookies, and exposed secrets',
        icon: '🔒',
        totalChecks: '~25',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.indexing.statusCode', 'p.indexing.indexable',
            'p.tech.cwv.bucket', 'p.tech.renderMode', 'p.tech.sec.grade',
            'p.tech.a11y.score', 'p.content.schema.types', 'p.indexing.redirectUrl',
            'p.tech.issueCount', 'p.action.topAction',
        ]
    },
    uxConversion: {
        id: 'uxConversion',
        label: 'UX & Conversion',
        description: 'User experience, friction, and conversion signals',
        icon: '✨',
        totalChecks: '~45',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.ux.roleClassified', 'p.ga.conversionRate',
            'p.ga.sessions', 'p.ga.engagementRate', 'p.ux.rageClicks',
            'p.ux.scrollDepth', 'p.conv.experiments.active', 'p.tech.cwv.bucket',
            'p.ga.bounce', 'p.action.topAction',
        ]
    },
    paid: {
        id: 'paid',
        label: 'Paid Audit',
        description: 'PPC, ads, and landing page quality',
        icon: '💰',
        totalChecks: '~30',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.paid.campaignsUsing', 'q.kw', 'p.paid.paidSessions',
            'p.paid.paidCvr', 'p.paid.qsLpComponent', 'p.paid.adIntentMatch',
            's.paid.spend30d.google', 's.paid.roas.google', 'p.paid.paidBounce',
            'p.tech.cwv.bucket', 'p.action.topAction',
        ]
    },
    socialBrand: {
        id: 'socialBrand',
        label: 'Social & Brand',
        description: 'Social signals, brand mentions, and sentiment',
        icon: '📱',
        totalChecks: '~35',
        viewType: 'grid',
        defaultColumns: [
            'p.identity.url', 'p.social.shares.total', 's.social.profiles',
            's.social.mentions.volume', 's.social.mentions.sentiment',
            's.social.engagementRate.twitter', 'p.content.eeatScore',
            'p.search.gsc.clicks', 'p.action.topAction',
        ]
    }
};

import {
  getWqaColumns as getWqaColumnsFromAdapter,
  getWqaDefaultVisibleColumns as getWqaDefaultVisibleColumnsFromAdapter,
  type WqaColumnContext,
} from './adapters/WqaColumnAdapter';

/**
 * Returns WQA columns adjusted for detected industry.
 */
export function getWqaColumns(ctxOrIndustry: WqaColumnContext | DetectedIndustry, language = 'en', cms: string | null = null): string[] {
  return getWqaColumnsFromAdapter(ctxOrIndustry, language, cms);
}

export function getWqaDefaultVisibleColumns(ctxOrIndustry: WqaColumnContext | DetectedIndustry, language = 'en', cms: string | null = null): string[] {
  return getWqaDefaultVisibleColumnsFromAdapter(ctxOrIndustry, language, cms);
}

export const AUDIT_MODES_LIST = Object.values(AUDIT_MODES);


export const INDUSTRY_FILTERS: IndustryConfig[] = [
    { id: 'all', label: INDUSTRY_FILTER_LABELS.all, description: 'Universal checks', icon: '🌐', extraChecksLabel: '' },
    { id: 'local', label: INDUSTRY_FILTER_LABELS.local, description: 'Local service and store sites', icon: '📍', extraChecksLabel: '+ NAP, map pack, GMB checks' },
    { id: 'ecommerce', label: INDUSTRY_FILTER_LABELS.ecommerce, description: 'Product and catalog websites', icon: '🛒', extraChecksLabel: '+ product, catalog, pricing checks' },
    { id: 'saas', label: INDUSTRY_FILTER_LABELS.saas, description: 'Software products and platforms', icon: '💻', extraChecksLabel: '+ docs, pricing, onboarding checks' },
    { id: 'blog', label: INDUSTRY_FILTER_LABELS.blog, description: 'Editorial and knowledge content', icon: '📝', extraChecksLabel: '+ freshness, author, topic checks' },
    { id: 'news', label: INDUSTRY_FILTER_LABELS.news, description: 'Publishing-heavy news sites', icon: '📰', extraChecksLabel: '+ article schema, recency checks' },
    { id: 'finance', label: INDUSTRY_FILTER_LABELS.finance, description: 'Financial advice and fintech sites', icon: '💰', extraChecksLabel: '+ compliance and freshness checks' },
    { id: 'education', label: INDUSTRY_FILTER_LABELS.education, description: 'Schools, LMS, and course sites', icon: '🎓', extraChecksLabel: '+ course and structure checks' },
    { id: 'healthcare', label: INDUSTRY_FILTER_LABELS.healthcare, description: 'Medical and wellness properties', icon: '🏥', extraChecksLabel: '+ author trust and medical checks' },
    { id: 'realEstate', label: INDUSTRY_FILTER_LABELS.real_estate, description: 'Listings and brokerage platforms', icon: '🏠', extraChecksLabel: '+ listing and local intent checks' },
    { id: 'restaurant', label: INDUSTRY_FILTER_LABELS.restaurant, description: 'Menu and reservation websites', icon: '🍽️', extraChecksLabel: '+ menu and local entity checks' }
];
