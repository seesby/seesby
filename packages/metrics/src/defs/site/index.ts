import type { MetricDef } from '@seesby/types';

export const siteMetrics: MetricDef[] = [
  { key: 's.crawl.totalPages', namespace: 's.crawl', level: 'S', roles: ['G', 'I'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.crawl.totalPages' },
  { key: 's.crawl.coverage', namespace: 's.crawl', level: 'S', roles: ['G', 'I', 'H'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.crawl.coverage' },
  { key: 's.health.score', namespace: 's.health', level: 'S', roles: ['G', 'I', 'R', 'V'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.health.score', scoreComponent: 'health', defaultVisible: true },
  { key: 's.commerce.productSchemaCoverage', namespace: 's.commerce', level: 'S', roles: ['H', 'I'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.commerce.productSchemaCoverage', gate: { industries: ['ecommerce'] }, tags: ['legacy:productSchemaCoverage'] },
  { key: 's.commerce.reviewSchemaCoverage', namespace: 's.commerce', level: 'S', roles: ['H', 'I'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.commerce.reviewSchemaCoverage', gate: { industries: ['ecommerce'] }, tags: ['legacy:reviewSchemaCoverage'] },
  { key: 's.commerce.outOfStockIndexed', namespace: 's.commerce', level: 'S', roles: ['H', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.commerce.outOfStockIndexed', gate: { industries: ['ecommerce'] }, tags: ['legacy:outOfStockIndexed'] },
  { key: 's.news.articleSchemaCoverage', namespace: 's.news', level: 'S', roles: ['H', 'I'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.news.articleSchemaCoverage', gate: { industries: ['news', 'blog'] }, tags: ['legacy:articleSchemaCoverage'] },
  { key: 's.news.newsSitemapCoverage', namespace: 's.news', level: 'S', roles: ['H'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.news.newsSitemapCoverage', gate: { industries: ['news'] }, tags: ['legacy:newsSitemapCoverage'] },
  { key: 's.news.hasRssFeed', namespace: 's.news', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.news.hasRssFeed', gate: { industries: ['news', 'blog'] }, tags: ['legacy:hasRssFeed'] },
  { key: 's.local.napConsistent', namespace: 's.local', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.local.napConsistent', gate: { industries: ['local', 'restaurant'] }, tags: ['legacy:napConsistent'] },
  { key: 's.local.hasLocalSchema', namespace: 's.local', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.local.hasLocalSchema', gate: { industries: ['local', 'restaurant'] }, tags: ['legacy:hasLocalSchema'] },
  { key: 's.local.hasGmbLink', namespace: 's.local', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.local.hasGmbLink', gate: { industries: ['local', 'restaurant'] }, tags: ['legacy:hasGmbLink'] },
  { key: 's.local.serviceAreaPageCount', namespace: 's.local', level: 'S', roles: ['I'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.local.serviceAreaPageCount', gate: { industries: ['local'] }, tags: ['legacy:serviceAreaPageCount'] },
  { key: 's.local.hasMenuSchema', namespace: 's.local', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.local.hasMenuSchema', gate: { industries: ['restaurant'] }, tags: ['legacy:hasMenuSchema'] },
  { key: 's.local.hasReservationLink', namespace: 's.local', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.local.hasReservationLink', gate: { industries: ['restaurant'] }, tags: ['legacy:hasReservationLink'] },
  { key: 's.saas.hasPricingPage', namespace: 's.saas', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.saas.hasPricingPage', gate: { industries: ['saas'] }, tags: ['legacy:hasPricingPage'] },
  { key: 's.saas.hasDocsSection', namespace: 's.saas', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.saas.hasDocsSection', gate: { industries: ['saas'] }, tags: ['legacy:hasDocsSection'] },
  { key: 's.saas.hasChangelog', namespace: 's.saas', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.saas.hasChangelog', gate: { industries: ['saas'] }, tags: ['legacy:hasChangelog'] },
  { key: 's.saas.hasStatusPage', namespace: 's.saas', level: 'S', roles: ['H'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.saas.hasStatusPage', gate: { industries: ['saas'] }, tags: ['legacy:hasStatusPage'] },

  // ─── Site-level scores ──────────────────────────────────────────────
  { key: 's.score.qOverall', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T', 'E'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.qOverall', description: 'Overall quality score', scoreComponent: 'quality' },
  { key: 's.score.content', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.content', description: 'Content score', scoreComponent: 'content' },
  { key: 's.score.search', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.search', description: 'Search score' },
  { key: 's.score.tech', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.tech', description: 'Technical score', scoreComponent: 'tech' },
  { key: 's.score.links', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.links', description: 'Links score', scoreComponent: 'links' },
  { key: 's.score.ai', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.ai', description: 'AI discoverability score', scoreComponent: 'ai' },
  { key: 's.score.eeat', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.eeat', description: 'E-E-A-T score' },
  { key: 's.score.social', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.social', description: 'Social score', scoreComponent: 'social' },
  { key: 's.score.paid', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.paid', description: 'Paid score', scoreComponent: 'paid' },
  { key: 's.score.commerce', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.commerce', description: 'Commerce score', scoreComponent: 'commerce' },
  { key: 's.score.local', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.local', description: 'Local score', scoreComponent: 'local' },
  { key: 's.score.ux', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.ux', description: 'UX score', scoreComponent: 'ux' },
  { key: 's.score.email', namespace: 's.score', level: 'S', roles: ['H', 'R', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.email', description: 'Email score' },
  { key: 's.score.compliance', namespace: 's.score', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.compliance', description: 'Compliance score' },
  { key: 's.score.opportunity', namespace: 's.score', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.opportunity', description: 'Opportunity score' },
  { key: 's.score.business', namespace: 's.score', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.business', description: 'Business value score' },
  { key: 's.score.strategicPriority', namespace: 's.score', level: 'S', roles: ['R', 'K', 'A'], sources: ['T6'], format: 'enum', i18nLabelKey: 'metric.s.score.strategicPriority', description: 'Strategic priority bucket' },

  // ─── Site-level social ──────────────────────────────────────────────
  { key: 's.social.profiles', namespace: 's.social', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.social.profiles', description: 'Social media profiles' },
  { key: 's.social.followersTotal', namespace: 's.social', level: 'S', roles: ['R', 'V', 'T', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.social.followersTotal', description: 'Total social followers' },
  { key: 's.social.followersGrowth', namespace: 's.social', level: 'S', roles: ['R', 'V', 'T'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.social.followersGrowth', description: 'Social follower growth rate' },
  { key: 's.social.postingCadence', namespace: 's.social', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.social.postingCadence', description: 'Posts per week' },
  { key: 's.social.engagementRate', namespace: 's.social', level: 'S', roles: ['R', 'V', 'S'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.social.engagementRate', description: 'Average engagement rate' },
  { key: 's.social.mentionsVolume', namespace: 's.social', level: 'S', roles: ['R', 'V', 'T', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.social.mentionsVolume', description: 'Brand mention volume' },
  { key: 's.social.mentionsSentiment', namespace: 's.social', level: 'S', roles: ['R', 'V', 'T', 'K', 'E'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.social.mentionsSentiment', description: 'Mention sentiment score' },
  { key: 's.social.mentionsSoV', namespace: 's.social', level: 'S', roles: ['R', 'V', 'T', 'K'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.social.mentionsSoV', description: 'Share of voice' },
  { key: 's.social.mentionsUnlinked', namespace: 's.social', level: 'S', roles: ['R', 'V', 'A'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.social.mentionsUnlinked', description: 'Unlinked brand mentions' },
  { key: 's.social.crisisSignal', namespace: 's.social', level: 'S', roles: ['R', 'E'], sources: ['T6'], format: 'boolean', i18nLabelKey: 'metric.s.social.crisisSignal', description: 'Active crisis signal' },

  // ─── Site-level paid ────────────────────────────────────────────────
  { key: 's.paid.spend30d', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'K', 'T'], sources: ['T6'], format: 'money', i18nLabelKey: 'metric.s.paid.spend30d', description: '30-day ad spend', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.conv30d', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'K', 'T'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.paid.conv30d', description: '30-day ad conversions', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.roas', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'K', 'T'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.paid.roas', description: 'Return on ad spend', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.qsAvg', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'S'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.paid.qsAvg', description: 'Average Quality Score', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.imprShare', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'T', 'A'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.paid.imprShare', description: 'Impression share', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.campaignCount', namespace: 's.paid', level: 'S', roles: ['R'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.paid.campaignCount', description: 'Active campaign count', gate: { requireConnected: ['ads'] } },
  { key: 's.paid.estAdBudget', namespace: 's.paid', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'money', i18nLabelKey: 'metric.s.paid.estAdBudget', description: 'Estimated ad budget' },
  { key: 's.paid.adPlatformsDetected', namespace: 's.paid', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.paid.adPlatformsDetected', description: 'Detected ad platforms' },
  { key: 's.paid.imprShareLost', namespace: 's.paid', level: 'S', roles: ['R', 'V', 'A', 'E'], sources: ['T0'], format: 'percent', gate: { requireConnected: ['ads'] }, i18nLabelKey: 'metric.s.paid.imprShareLost', description: 'Impression share lost due to budget or rank.' },
  { key: 's.paid.kwCount', namespace: 's.paid', level: 'S', roles: ['R'], sources: ['T0'], format: 'number', gate: { requireConnected: ['ads'] }, i18nLabelKey: 'metric.s.paid.kwCount', description: 'Total number of keywords in ad accounts.' },
  { key: 's.paid.adCount', namespace: 's.paid', level: 'S', roles: ['R'], sources: ['T0'], format: 'number', gate: { requireConnected: ['ads'] }, i18nLabelKey: 'metric.s.paid.adCount', description: 'Total number of ads across all campaigns.' },
  { key: 's.paid.estPpcClicks', namespace: 's.paid', level: 'S', roles: ['R', 'V'], sources: ['T3'], format: 'number', i18nLabelKey: 'metric.s.paid.estPpcClicks', description: 'Estimated monthly PPC clicks from third-party data.' },
  { key: 's.paid.estPpcKeywords', namespace: 's.paid', level: 'S', roles: ['R', 'V'], sources: ['T3'], format: 'number', i18nLabelKey: 'metric.s.paid.estPpcKeywords', description: 'Estimated number of PPC keywords from third-party data.' },
  { key: 's.paid.platformsDetected', namespace: 's.paid', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'list', i18nLabelKey: 'metric.s.paid.platformsDetected', description: 'Advertising platforms detected on the site.' },
  { key: 's.paid.conversionTracking', namespace: 's.paid', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'boolean', gate: { requireConnected: ['ads'] }, i18nLabelKey: 'metric.s.paid.conversionTracking', description: 'Whether conversion tracking is properly configured.' },

  // ─── Site-level email ───────────────────────────────────────────────
  { key: 's.email.provider', namespace: 's.email', level: 'S', roles: ['R'], sources: ['T6'], format: 'text', i18nLabelKey: 'metric.s.email.provider', description: 'Email service provider' },
  { key: 's.email.listSize', namespace: 's.email', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.email.listSize', description: 'Email list size' },
  { key: 's.email.growth30d', namespace: 's.email', level: 'S', roles: ['R', 'V', 'T'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.growth30d', description: '30-day list growth' },
  { key: 's.email.openRate', namespace: 's.email', level: 'S', roles: ['R', 'V', 'K', 'S'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.openRate', description: 'Average open rate' },
  { key: 's.email.ctr', namespace: 's.email', level: 'S', roles: ['R', 'V', 'K', 'S'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.ctr', description: 'Average click-through rate' },
  { key: 's.email.bounceRate', namespace: 's.email', level: 'S', roles: ['R', 'V', 'A', 'E'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.bounceRate', description: 'Bounce rate' },
  { key: 's.email.unsubRate', namespace: 's.email', level: 'S', roles: ['R', 'V', 'A'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.unsubRate', description: 'Unsubscribe rate' },
  { key: 's.email.domainAuthSpf', namespace: 's.email', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'boolean', i18nLabelKey: 'metric.s.email.domainAuthSpf', description: 'SPF record present' },
  { key: 's.email.domainAuthDkim', namespace: 's.email', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'boolean', i18nLabelKey: 'metric.s.email.domainAuthDkim', description: 'DKIM record present' },
  { key: 's.email.domainAuthDmarc', namespace: 's.email', level: 'S', roles: ['R', 'A', 'E'], sources: ['T6'], format: 'boolean', i18nLabelKey: 'metric.s.email.domainAuthDmarc', description: 'DMARC record present' },

  // ─── Site-level UX ──────────────────────────────────────────────────
  { key: 's.ux.cvrSite', namespace: 's.ux', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.ux.cvrSite', description: 'Site-wide conversion rate' },
  { key: 's.ux.engagementAvg', namespace: 's.ux', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.ux.engagementAvg', description: 'Average engagement score' },
  { key: 's.ux.ragePerK', namespace: 's.ux', level: 'S', roles: ['R', 'K', 'E'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.ux.ragePerK', description: 'Rage clicks per 1k sessions' },
  { key: 's.ux.testsRunning', namespace: 's.ux', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.ux.testsRunning', description: 'Active A/B tests' },
  { key: 's.ux.testWins90d', namespace: 's.ux', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.ux.testWins90d', description: 'Test wins in last 90 days' },
  { key: 's.ux.cumulativeLift90d', namespace: 's.ux', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.ux.cumulativeLift90d', description: 'Cumulative conversion lift' },

  // ─── Email detail ──────────────────────────────────────────────────
  { key: 's.email.spamRate', namespace: 's.email', level: 'S', roles: ['R', 'V', 'A', 'E'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.spamRate', description: 'Spam complaint rate' },
  { key: 's.email.doubleOptIn', namespace: 's.email', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'boolean', i18nLabelKey: 'metric.s.email.doubleOptIn', description: 'Double opt-in enabled' },
  { key: 's.email.lifecycleCoverage', namespace: 's.email', level: 'S', roles: ['R', 'V', 'A'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.email.lifecycleCoverage', description: 'Lifecycle email workflow coverage' },

  // ─── Commerce site-level ───────────────────────────────────────────
  { key: 's.commerce.catalogSize', namespace: 's.commerce', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.commerce.catalogSize', description: 'Total products in catalog' },
  { key: 's.commerce.oosPct', namespace: 's.commerce', level: 'S', roles: ['R', 'V', 'A', 'E'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.commerce.oosPct', description: 'Percentage of products out of stock' },
  { key: 's.commerce.reviewsVol', namespace: 's.commerce', level: 'S', roles: ['R', 'V', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.commerce.reviewsVol', description: 'Total product reviews across catalog' },

  // ─── Local site-level ──────────────────────────────────────────────
  { key: 's.local.locationsCount', namespace: 's.local', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.local.locationsCount', description: 'Number of business locations' },
  { key: 's.local.locationsList', namespace: 's.local', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'list', i18nLabelKey: 'metric.s.local.locationsList', description: 'List of business locations' },

  // ─── Social site-level ─────────────────────────────────────────────
  { key: 's.social.bestTime', namespace: 's.social', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'text', i18nLabelKey: 'metric.s.social.bestTime', description: 'Best posting time across platforms' },
  { key: 's.social.bestType', namespace: 's.social', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'text', i18nLabelKey: 'metric.s.social.bestType', description: 'Best content type for engagement' },

  // ─── EX-M: Site-level Aggregates Expansion — Pages ──────────────
  { key: 's.pages.total', namespace: 's.pages', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.total', description: 'Total pages crawled in this session' },
  { key: 's.pages.indexable', namespace: 's.pages', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.indexable', description: 'Total indexable pages' },
  { key: 's.pages.nonIndexable', namespace: 's.pages', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.nonIndexable', description: 'Non-indexable pages count' },
  { key: 's.pages.orphan', namespace: 's.pages', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.orphan', description: 'Orphan page count' },
  { key: 's.pages.nearOrphan', namespace: 's.pages', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.nearOrphan', description: 'Near-orphan page count (≤2 inlinks)' },
  { key: 's.pages.soft404', namespace: 's.pages', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.soft404', description: 'Soft 404 page count' },
  { key: 's.pages.duplicate.exact', namespace: 's.pages.duplicate', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.duplicate.exact', description: 'Pages with exact duplicates' },
  { key: 's.pages.duplicate.near', namespace: 's.pages.duplicate', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.duplicate.near', description: 'Pages in near-duplicate clusters' },
  { key: 's.pages.duplicate.clusterCount', namespace: 's.pages.duplicate', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.duplicate.clusterCount', description: 'Number of duplicate clusters' },
  { key: 's.pages.cannibalized', namespace: 's.pages', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.cannibalized', description: 'Pages involved in cannibalization' },
  { key: 's.pages.cannibalizationGroups', namespace: 's.pages', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.pages.cannibalizationGroups', description: 'Number of cannibalization groups' },

  // ─── EX-M: Site-level Aggregates Expansion — Status Codes ──────
  { key: 's.statusCodes.200', namespace: 's.statusCodes', level: 'S', roles: ['R', 'L'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.statusCodes.200', description: 'Pages returning 200' },
  { key: 's.statusCodes.301', namespace: 's.statusCodes', level: 'S', roles: ['R', 'L'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.statusCodes.301', description: 'Pages returning 301 redirect' },
  { key: 's.statusCodes.302', namespace: 's.statusCodes', level: 'S', roles: ['R', 'L'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.statusCodes.302', description: 'Pages returning 302 redirect' },
  { key: 's.statusCodes.404', namespace: 's.statusCodes', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.statusCodes.404', description: 'Pages returning 404' },
  { key: 's.statusCodes.500', namespace: 's.statusCodes', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.statusCodes.500', description: 'Pages returning 500+' },
  { key: 's.statusCodes.distribution', namespace: 's.statusCodes', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.statusCodes.distribution', description: 'Full status code distribution' },

  // ─── EX-M: Site-level Aggregates Expansion — Content ───────────
  { key: 's.content.wordCount.avg', namespace: 's.content.wordCount', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.content.wordCount.avg', description: 'Average word count across all pages' },
  { key: 's.content.wordCount.total', namespace: 's.content.wordCount', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.content.wordCount.total', description: 'Total word count across all pages' },
  { key: 's.content.readability.avg', namespace: 's.content.readability', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.content.readability.avg', description: 'Average readability score' },
  { key: 's.content.freshness.avgDays', namespace: 's.content.freshness', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.content.freshness.avgDays', description: 'Average days since last update', unit: 'd' },
  { key: 's.content.freshness.staleCount', namespace: 's.content.freshness', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.content.freshness.staleCount', description: 'Pages with stale content (>180d)' },
  { key: 's.content.freshness.freshCount', namespace: 's.content.freshness', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.content.freshness.freshCount', description: 'Pages with fresh content (<30d)' },

  // ─── EX-M: Site-level Aggregates Expansion — Tech CWV ──────────
  { key: 's.tech.cwv.good', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'percent', i18nLabelKey: 'metric.s.tech.cwv.good', description: 'Percentage of pages with good CWV' },
  { key: 's.tech.cwv.needsImprovement', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'percent', i18nLabelKey: 'metric.s.tech.cwv.needsImprovement', description: 'Percentage of pages needing CWV improvement' },
  { key: 's.tech.cwv.poor', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'A', 'E'], sources: ['T1'], format: 'percent', i18nLabelKey: 'metric.s.tech.cwv.poor', description: 'Percentage of pages with poor CWV' },
  { key: 's.tech.cwv.avgLcp', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'duration', i18nLabelKey: 'metric.s.tech.cwv.avgLcp', description: 'Average LCP across sampled pages', unit: 'ms' },
  { key: 's.tech.cwv.avgInp', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'duration', i18nLabelKey: 'metric.s.tech.cwv.avgInp', description: 'Average INP across sampled pages', unit: 'ms' },
  { key: 's.tech.cwv.avgCls', namespace: 's.tech.cwv', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'number', i18nLabelKey: 'metric.s.tech.cwv.avgCls', description: 'Average CLS across sampled pages' },

  // ─── EX-M: Site-level Aggregates Expansion — Tech Security ─────
  { key: 's.tech.sec.grade.distribution', namespace: 's.tech.sec.grade', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.tech.sec.grade.distribution', description: 'Security grade distribution across pages' },
  { key: 's.tech.sec.grade.avg', namespace: 's.tech.sec.grade', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.tech.sec.grade.avg', description: 'Average security score' },

  // ─── EX-M: Site-level Aggregates Expansion — Tech A11y ─────────
  { key: 's.tech.a11y.score.avg', namespace: 's.tech.a11y.score', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.tech.a11y.score.avg', description: 'Average accessibility score' },
  { key: 's.tech.a11y.violations.total', namespace: 's.tech.a11y.violations', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.tech.a11y.violations.total', description: 'Total accessibility violations across site' },

  // ─── EX-M: Site-level Aggregates Expansion — Tech Energy ───────
  { key: 's.tech.energy.totalCarbon', namespace: 's.tech.energy', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.tech.energy.totalCarbon', description: 'Estimated total site carbon footprint', unit: 'g' },
  { key: 's.tech.energy.avgCarbonPerView', namespace: 's.tech.energy', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.tech.energy.avgCarbonPerView', description: 'Average carbon per page view', unit: 'g' },
  { key: 's.tech.energy.rating', namespace: 's.tech.energy', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'enum', i18nLabelKey: 'metric.s.tech.energy.rating', description: 'Site-wide carbon efficiency grade' },

  // ─── EX-M: Site-level Aggregates Expansion — Search ────────────
  { key: 's.search.totalKeywords', namespace: 's.search', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.totalKeywords', description: 'Total keywords ranking for site' },
  { key: 's.search.keywordsTop3', namespace: 's.search', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.keywordsTop3', description: 'Keywords in top 3 positions' },
  { key: 's.search.keywordsTop10', namespace: 's.search', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.keywordsTop10', description: 'Keywords in top 10 positions' },
  { key: 's.search.totalClicks', namespace: 's.search', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.totalClicks', description: 'Total GSC clicks (28d)' },
  { key: 's.search.totalImpr', namespace: 's.search', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.totalImpr', description: 'Total GSC impressions (28d)' },
  { key: 's.search.avgCtr', namespace: 's.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.search.avgCtr', description: 'Site-wide average CTR' },
  { key: 's.search.avgPosition', namespace: 's.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.search.avgPosition', description: 'Site-wide average position' },

  // ─── EX-M: Site-level Aggregates Expansion — GA ────────────────
  { key: 's.ga.totalSessions', namespace: 's.ga', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.ga.totalSessions', description: 'Total sessions (28d)' },
  { key: 's.ga.totalRevenue', namespace: 's.ga', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'money', i18nLabelKey: 'metric.s.ga.totalRevenue', description: 'Total revenue (28d)' },
  { key: 's.ga.avgCvr', namespace: 's.ga', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.ga.avgCvr', description: 'Site-wide average conversion rate' },
  { key: 's.ga.totalConversions', namespace: 's.ga', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.ga.totalConversions', description: 'Total conversions (28d)' },

  // ─── EX-M: Site-level Aggregates Expansion — Links ─────────────
  { key: 's.links.totalInlinks', namespace: 's.links', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.totalInlinks', description: 'Total internal inlinks across site' },
  { key: 's.links.totalOutlinks', namespace: 's.links', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.totalOutlinks', description: 'Total outgoing links' },
  { key: 's.links.totalRefDomains', namespace: 's.links', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.totalRefDomains', description: 'Total unique referring domains' },
  { key: 's.links.totalBacklinks', namespace: 's.links', level: 'S', roles: ['H', 'R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.totalBacklinks', description: 'Total backlinks' },
  { key: 's.links.avgPagerank', namespace: 's.links', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.links.avgPagerank', description: 'Average internal PageRank' },
  { key: 's.links.brokenCount', namespace: 's.links', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.brokenCount', description: 'Total broken links across site' },
  { key: 's.links.redirectCount', namespace: 's.links', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.links.redirectCount', description: 'Total redirect links' },

  // ─── EX-M: Site-level Aggregates Expansion — AI ────────────────
  { key: 's.ai.avgCitationRate', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.ai.avgCitationRate', description: 'Average AI citation rate across all pages' },
  { key: 's.ai.pagesCited', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.ai.pagesCited', description: 'Number of pages cited by AI engines' },
  { key: 's.ai.llmsTxtPresent', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'boolean', i18nLabelKey: 'metric.s.ai.llmsTxtPresent', description: 'Whether llms.txt exists' },
  { key: 's.ai.botsAllowedCount', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.ai.botsAllowedCount', description: 'Number of AI bots allowed' },
  { key: 's.ai.botsBlockedCount', namespace: 's.ai', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', i18nLabelKey: 'metric.s.ai.botsBlockedCount', description: 'Number of AI bots blocked' },

  // ─── EX-Q.2: More Site-Level Breakdowns ────────────────────────────
  // ─── Content breakdowns ────────────────────────────────────────────
  { key: 's.content.contentType.distribution', namespace: 's.content.contentType', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'json', i18nLabelKey: 'metric.s.content.contentType.distribution', description: 'Content type distribution: {article: N, product: N, landing: N, ...}' },
  { key: 's.content.contentType.counts', namespace: 's.content.contentType', level: 'S', roles: ['R', 'L'], sources: ['T4'], format: 'json', i18nLabelKey: 'metric.s.content.contentType.counts', description: 'Count per content type classification' },
  { key: 's.content.topic.clusterCount', namespace: 's.content.topic', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.content.topic.clusterCount', description: 'Number of topic clusters detected' },
  { key: 's.content.topic.avgCoverage', namespace: 's.content.topic', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.content.topic.avgCoverage', description: 'Average topic coverage across clusters' },
  { key: 's.content.topic.avgDepth', namespace: 's.content.topic', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.content.topic.avgDepth', description: 'Average topic depth across clusters' },
  { key: 's.content.topic.topClusters', namespace: 's.content.topic', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.content.topic.topClusters', description: 'Top 10 clusters by traffic' },

  // ─── Schema breakdowns ─────────────────────────────────────────────
  { key: 's.content.schema.typesPresent', namespace: 's.content.schema', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'list', i18nLabelKey: 'metric.s.content.schema.typesPresent', description: 'All schema types found across site' },
  { key: 's.content.schema.coverage', namespace: 's.content.schema', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.content.schema.coverage', description: 'Percentage of pages with valid schema' },
  { key: 's.content.schema.eligibleRich', namespace: 's.content.schema', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.content.schema.eligibleRich', description: 'Percentage of pages eligible for rich results' },
  { key: 's.content.schema.errorsTotal', namespace: 's.content.schema', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.content.schema.errorsTotal', description: 'Total schema validation errors across site' },

  // ─── Image breakdowns ──────────────────────────────────────────────
  { key: 's.content.images.totalCount', namespace: 's.content.images', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.content.images.totalCount', description: 'Total images across all pages' },
  { key: 's.content.images.missingAltTotal', namespace: 's.content.images', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.content.images.missingAltTotal', description: 'Total images missing alt text' },
  { key: 's.content.images.legacyFmtTotal', namespace: 's.content.images', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.content.images.legacyFmtTotal', description: 'Total images in legacy formats' },
  { key: 's.content.images.avgPerProduct', namespace: 's.content.images', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'number', i18nLabelKey: 'metric.s.content.images.avgPerProduct', description: 'Average images per product page' },

  // ─── Tech breakdowns ───────────────────────────────────────────────
  { key: 's.tech.pages.mobileFriendly', namespace: 's.tech.pages', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.tech.pages.mobileFriendly', description: 'Percentage of mobile-friendly pages' },
  { key: 's.tech.pages.https', namespace: 's.tech.pages', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.tech.pages.https', description: 'Percentage of HTTPS pages' },
  { key: 's.tech.pages.http2', namespace: 's.tech.pages', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.tech.pages.http2', description: 'Percentage using HTTP/2+' },
  { key: 's.tech.pages.renderBlocking', namespace: 's.tech.pages', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.renderBlocking', description: 'Pages with render-blocking resources' },
  { key: 's.tech.pages.highJsDep', namespace: 's.tech.pages', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.highJsDep', description: 'Pages with >60% JS render dependency' },
  { key: 's.tech.pages.secGradeA', namespace: 's.tech.pages', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.secGradeA', description: 'Pages with security grade A/A+' },
  { key: 's.tech.pages.secGradeF', namespace: 's.tech.pages', level: 'S', roles: ['R', 'A', 'E'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.secGradeF', description: 'Pages with security grade F' },
  { key: 's.tech.pages.a11yGood', namespace: 's.tech.pages', level: 'S', roles: ['R', 'K'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.a11yGood', description: 'Pages with a11y score >90' },
  { key: 's.tech.pages.a11yPoor', namespace: 's.tech.pages', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.tech.pages.a11yPoor', description: 'Pages with a11y score <50' },

  // ─── Search distribution breakdowns ────────────────────────────────
  { key: 's.search.distribution.position1to3', namespace: 's.search.distribution', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.distribution.position1to3', description: 'Keywords in positions 1-3' },
  { key: 's.search.distribution.position4to10', namespace: 's.search.distribution', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.distribution.position4to10', description: 'Keywords in positions 4-10' },
  { key: 's.search.distribution.position11to20', namespace: 's.search.distribution', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.distribution.position11to20', description: 'Keywords in positions 11-20' },
  { key: 's.search.distribution.position21to50', namespace: 's.search.distribution', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.distribution.position21to50', description: 'Keywords in positions 21-50' },
  { key: 's.search.distribution.position51to100', namespace: 's.search.distribution', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.distribution.position51to100', description: 'Keywords in positions 51-100' },

  // ─── Search intent / SERP features ─────────────────────────────────
  { key: 's.search.intent.distribution', namespace: 's.search.intent', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.search.intent.distribution', description: 'Keyword intent distribution: {informational: N, transactional: N, ...}' },
  { key: 's.search.featuredSnippet.owned', namespace: 's.search.featuredSnippet', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.featuredSnippet.owned', description: 'Featured snippets owned' },
  { key: 's.search.featuredSnippet.possible', namespace: 's.search.featuredSnippet', level: 'S', roles: ['R', 'A'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.featuredSnippet.possible', description: 'Featured snippet opportunities (top-5 position, no snippet owned)' },
  { key: 's.search.paa.owned', namespace: 's.search.paa', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.paa.owned', description: 'People Also Ask appearances' },
  { key: 's.search.serpFeatures.total', namespace: 's.search.serpFeatures', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.search.serpFeatures.total', description: 'Total SERP feature appearances' },

  // ─── Brand / non-brand ─────────────────────────────────────────────
  { key: 's.search.brand.vsNonBrand', namespace: 's.search.brand', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.search.brand.vsNonBrand', description: 'Brand vs non-brand traffic split' },
  { key: 's.search.brand.ctr', namespace: 's.search.brand', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.search.brand.ctr', description: 'Brand keyword CTR' },
  { key: 's.search.nonBrand.ctr', namespace: 's.search.nonBrand', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'percent', i18nLabelKey: 'metric.s.search.nonBrand.ctr', description: 'Non-brand keyword CTR' },

  // ─── GA breakdowns ─────────────────────────────────────────────────
  { key: 's.ga.channel.distribution', namespace: 's.ga.channel', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.ga.channel.distribution', description: 'Traffic channel distribution: {organic: %, paid: %, social: %, ...}' },
  { key: 's.ga.device.distribution', namespace: 's.ga.device', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.ga.device.distribution', description: 'Device distribution: {mobile: %, desktop: %, tablet: %}' },
  { key: 's.ga.country.top10', namespace: 's.ga.country', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'list', i18nLabelKey: 'metric.s.ga.country.top10', description: 'Top 10 countries by sessions' },
  { key: 's.ga.newVsReturn.ratio', namespace: 's.ga.newVsReturn', level: 'S', roles: ['R', 'V'], sources: ['T0'], format: 'json', i18nLabelKey: 'metric.s.ga.newVsReturn.ratio', description: 'New vs returning user ratio' },
  { key: 's.ga.engagement.avg', namespace: 's.ga.engagement', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.ga.engagement.avg', description: 'Average engagement score' },

  // ─── Links breakdowns ──────────────────────────────────────────────
  { key: 's.links.pagerank.distribution', namespace: 's.links.pagerank', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'json', i18nLabelKey: 'metric.s.links.pagerank.distribution', description: 'Internal PageRank distribution histogram' },
  { key: 's.links.pagerank.topPages', namespace: 's.links.pagerank', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'list', i18nLabelKey: 'metric.s.links.pagerank.topPages', description: 'Top 10 pages by internal PageRank' },
  { key: 's.links.pagerank.bottomPages', namespace: 's.links.pagerank', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'list', i18nLabelKey: 'metric.s.links.pagerank.bottomPages', description: 'Bottom 10 pages by internal PageRank' },
  { key: 's.links.anchorCloud.topAnchors', namespace: 's.links.anchorCloud', level: 'S', roles: ['R', 'V'], sources: ['T4'], format: 'list', i18nLabelKey: 'metric.s.links.anchorCloud.topAnchors', description: 'Top 20 anchor text phrases site-wide' },
  { key: 's.links.toxic.total', namespace: 's.links.toxic', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.links.toxic.total', description: 'Total toxic backlinks across site' },
  { key: 's.links.toxic.share', namespace: 's.links.toxic', level: 'S', roles: ['R', 'A'], sources: ['T4'], format: 'percent', i18nLabelKey: 'metric.s.links.toxic.share', description: 'Toxic backlink share site-wide' },

  // ─── AI breakdowns ─────────────────────────────────────────────────
  { key: 's.ai.citationsPerEngine', namespace: 's.ai', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'json', i18nLabelKey: 'metric.s.ai.citationsPerEngine', description: 'Citation count per AI engine: {openai: N, anthropic: N, ...}' },
  { key: 's.ai.extractability.avg', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.ai.extractability.avg', description: 'Average AI extractability score' },
  { key: 's.ai.llmsTxt.links', namespace: 's.ai', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.ai.llmsTxt.links', description: 'Total links in llms.txt' },

  // ─── EX-Q.3: Action Outcome Tracking (site-level) ─────────────────
  { key: 's.actions.total', namespace: 's.actions', level: 'S', roles: ['H', 'R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.total', description: 'Total actions proposed' },
  { key: 's.actions.blocking', namespace: 's.actions', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.blocking', description: 'Blocking-priority actions count' },
  { key: 's.actions.revenueLoss', namespace: 's.actions', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.revenueLoss', description: 'Revenue-loss-priority actions count' },
  { key: 's.actions.highLeverage', namespace: 's.actions', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.highLeverage', description: 'High-leverage actions count' },
  { key: 's.actions.strategic', namespace: 's.actions', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.strategic', description: 'Strategic-priority actions count' },
  { key: 's.actions.hygiene', namespace: 's.actions', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.hygiene', description: 'Hygiene actions count' },
  { key: 's.actions.completed', namespace: 's.actions', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.completed', description: 'Actions completed (if tracked)' },
  { key: 's.actions.pending', namespace: 's.actions', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.pending', description: 'Actions pending implementation' },
  { key: 's.actions.estimatedDelta.clicks', namespace: 's.actions.estimatedDelta', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.estimatedDelta.clicks', description: 'Estimated total click gain from all pending actions' },
  { key: 's.actions.estimatedDelta.revenue', namespace: 's.actions.estimatedDelta', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'money', unit: 'usd', i18nLabelKey: 'metric.s.actions.estimatedDelta.revenue', description: 'Estimated total revenue gain from all pending actions' },
  { key: 's.actions.estimatedDelta.rank', namespace: 's.actions.estimatedDelta', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.actions.estimatedDelta.rank', description: 'Estimated average rank improvement from actions' },
  { key: 's.actions.estimatedDelta.cvr', namespace: 's.actions.estimatedDelta', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.actions.estimatedDelta.cvr', description: 'Estimated CVR improvement from actions' },
  { key: 's.actions.byNamespace.content', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.content', description: 'Content actions count' },
  { key: 's.actions.byNamespace.tech', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.tech', description: 'Technical actions count' },
  { key: 's.actions.byNamespace.links', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.links', description: 'Link actions count' },
  { key: 's.actions.byNamespace.search', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.search', description: 'Search actions count' },
  { key: 's.actions.byNamespace.ai', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.ai', description: 'AI actions count' },
  { key: 's.actions.byNamespace.paid', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.paid', description: 'Paid actions count' },
  { key: 's.actions.byNamespace.ux', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.ux', description: 'UX actions count' },
  { key: 's.actions.byNamespace.social', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.social', description: 'Social actions count' },
  { key: 's.actions.byNamespace.commerce', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.commerce', description: 'Commerce actions count' },
  { key: 's.actions.byNamespace.local', namespace: 's.actions.byNamespace', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.byNamespace.local', description: 'Local actions count' },
  { key: 's.actions.top5.byScore', namespace: 's.actions.top5', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.actions.top5.byScore', description: 'Top 5 actions by action score' },
  { key: 's.actions.top5.byImpact', namespace: 's.actions.top5', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.actions.top5.byImpact', description: 'Top 5 actions by estimated impact' },
  { key: 's.actions.top5.byEffort', namespace: 's.actions.top5', level: 'S', roles: ['R', 'V'], sources: ['T6'], format: 'list', i18nLabelKey: 'metric.s.actions.top5.byEffort', description: 'Top 5 easiest actions (lowest effort)' },
  { key: 's.actions.outcomes.improved', namespace: 's.actions.outcomes', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.outcomes.improved', description: 'Actions with confirmed positive outcome' },
  { key: 's.actions.outcomes.neutral', namespace: 's.actions.outcomes', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.outcomes.neutral', description: 'Actions with no measurable change' },
  { key: 's.actions.outcomes.declined', namespace: 's.actions.outcomes', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.actions.outcomes.declined', description: 'Actions with negative outcome' },
  { key: 's.actions.outcomes.avgDelta', namespace: 's.actions.outcomes', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'number', i18nLabelKey: 'metric.s.actions.outcomes.avgDelta', description: 'Average realized delta per completed action' },
  { key: 's.actions.outcomes.forecastAccuracy', namespace: 's.actions.outcomes', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'percent', i18nLabelKey: 'metric.s.actions.outcomes.forecastAccuracy', description: 'Forecast accuracy (realized vs predicted delta)' },
  { key: 's.actions.roi', namespace: 's.actions', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.actions.roi', description: 'Action ROI (realized impact / effort hours)' },

  // ─── EX-Q.4: Diagnostic / Anomaly Flags (site-level) ──────────────
  { key: 's.diag.riskPages', namespace: 's.diag', level: 'S', roles: ['R', 'A'], sources: ['T6'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.diag.riskPages', description: 'Pages with high/critical risk score' },
  { key: 's.diag.anomalies', namespace: 's.diag', level: 'S', roles: ['R', 'A', 'E'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.diag.anomalies', description: 'Total anomaly flags across site' },
  { key: 's.diag.statusAnomalies', namespace: 's.diag', level: 'S', roles: ['R', 'A', 'E'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.diag.statusAnomalies', description: 'Status code anomalies detected' },
  { key: 's.diag.contentAnomalies', namespace: 's.diag', level: 'S', roles: ['R', 'A', 'E'], sources: ['T4'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.diag.contentAnomalies', description: 'Content change anomalies detected' },
  { key: 's.diag.trafficAnomalies', namespace: 's.diag', level: 'S', roles: ['R', 'A', 'E'], sources: ['T0'], format: 'number', unit: 'count', i18nLabelKey: 'metric.s.diag.trafficAnomalies', description: 'Traffic anomalies detected' },
  // ── EX-Q.6: Score Component Detail Metrics ──
  { key: 's.score.detail.content.wordCount', namespace: 's.score.detail.content', level: 'S', roles: ['R', 'K'], sources: ['T0'], unit: 'count', format: 'number', i18nLabelKey: 'metric.s.score.detail.content.wordCount', description: 'Content score component: word count' },
  { key: 's.score.detail.content.freshness', namespace: 's.score.detail.content', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.content.freshness', description: 'Content score component: freshness' },
  { key: 's.score.detail.content.depth', namespace: 's.score.detail.content', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.content.depth', description: 'Content score component: depth' },
  { key: 's.score.detail.content.entities', namespace: 's.score.detail.content', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.content.entities', description: 'Content score component: entity coverage' },
  { key: 's.score.detail.content.schema', namespace: 's.score.detail.content', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.content.schema', description: 'Content score component: schema quality' },
  { key: 's.score.detail.tech.performance', namespace: 's.score.detail.tech', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'score', i18nLabelKey: 'metric.s.score.detail.tech.performance', description: 'Tech score component: page performance' },
  { key: 's.score.detail.tech.crawlability', namespace: 's.score.detail.tech', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.tech.crawlability', description: 'Tech score component: crawlability' },
  { key: 's.score.detail.tech.security', namespace: 's.score.detail.tech', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'score', i18nLabelKey: 'metric.s.score.detail.tech.security', description: 'Tech score component: security' },
  { key: 's.score.detail.tech.mobile', namespace: 's.score.detail.tech', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'score', i18nLabelKey: 'metric.s.score.detail.tech.mobile', description: 'Tech score component: mobile friendliness' },
  { key: 's.score.detail.tech.accessibility', namespace: 's.score.detail.tech', level: 'S', roles: ['R', 'K'], sources: ['T1'], format: 'score', i18nLabelKey: 'metric.s.score.detail.tech.accessibility', description: 'Tech score component: accessibility' },
  { key: 's.score.detail.links.totalBacklinks', namespace: 's.score.detail.links', level: 'S', roles: ['R', 'K'], sources: ['T3'], unit: 'count', format: 'number', i18nLabelKey: 'metric.s.score.detail.links.totalBacklinks', description: 'Links score component: total backlinks' },
  { key: 's.score.detail.links.refDomains', namespace: 's.score.detail.links', level: 'S', roles: ['R', 'K'], sources: ['T3'], unit: 'count', format: 'number', i18nLabelKey: 'metric.s.score.detail.links.refDomains', description: 'Links score component: referring domains' },
  { key: 's.score.detail.links.dr', namespace: 's.score.detail.links', level: 'S', roles: ['R', 'K'], sources: ['T3'], format: 'score', i18nLabelKey: 'metric.s.score.detail.links.dr', description: 'Links score component: domain rating' },
  { key: 's.score.detail.links.toxicRatio', namespace: 's.score.detail.links', level: 'S', roles: ['R', 'K'], sources: ['T3'], format: 'percent', i18nLabelKey: 'metric.s.score.detail.links.toxicRatio', description: 'Links score component: toxic link ratio' },
  { key: 's.score.detail.links.anchorDiversity', namespace: 's.score.detail.links', level: 'S', roles: ['R', 'K'], sources: ['T3'], format: 'score', i18nLabelKey: 'metric.s.score.detail.links.anchorDiversity', description: 'Links score component: anchor text diversity' },
  { key: 's.score.detail.ai.citations', namespace: 's.score.detail.ai', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ai.citations', description: 'AI score component: citation rate' },
  { key: 's.score.detail.ai.extractability', namespace: 's.score.detail.ai', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ai.extractability', description: 'AI score component: content extractability' },
  { key: 's.score.detail.ai.botAccess', namespace: 's.score.detail.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ai.botAccess', description: 'AI score component: bot access' },
  { key: 's.score.detail.ai.schema', namespace: 's.score.detail.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ai.schema', description: 'AI score component: AI-ready schema' },
  { key: 's.score.detail.ai.llmsTxt', namespace: 's.score.detail.ai', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ai.llmsTxt', description: 'AI score component: llms.txt presence' },
  // ── EX-Q.6: Score Component Detail Metrics (continued) ──
  { key: 's.score.detail.search.ctr', namespace: 's.score.detail.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.search.ctr', description: 'Search score component: CTR' },
  { key: 's.score.detail.search.position', namespace: 's.score.detail.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.search.position', description: 'Search score component: position' },
  { key: 's.score.detail.search.impressions', namespace: 's.score.detail.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.search.impressions', description: 'Search score component: impressions' },
  { key: 's.score.detail.search.branded', namespace: 's.score.detail.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.search.branded', description: 'Search score component: branded vs non-branded' },
  { key: 's.score.detail.search.featuredSnippets', namespace: 's.score.detail.search', level: 'S', roles: ['R', 'K'], sources: ['T0'], format: 'score', i18nLabelKey: 'metric.s.score.detail.search.featuredSnippets', description: 'Search score component: featured snippets' },
  { key: 's.score.detail.ux.engagement', namespace: 's.score.detail.ux', level: 'S', roles: ['R', 'K'], sources: ['T7'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ux.engagement', description: 'UX score: engagement metrics' },
  { key: 's.score.detail.ux.friction', namespace: 's.score.detail.ux', level: 'S', roles: ['R', 'K'], sources: ['T7'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ux.friction', description: 'UX score: friction signals' },
  { key: 's.score.detail.ux.conversion', namespace: 's.score.detail.ux', level: 'S', roles: ['R', 'K'], sources: ['T7'], format: 'score', i18nLabelKey: 'metric.s.score.detail.ux.conversion', description: 'UX score: conversion performance' },
  { key: 's.score.detail.eeat.author', namespace: 's.score.detail.eeat', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.eeat.author', description: 'E-E-A-T score: author signals' },
  { key: 's.score.detail.eeat.content', namespace: 's.score.detail.eeat', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.eeat.content', description: 'E-E-A-T score: content signals' },
  { key: 's.score.detail.eeat.trust', namespace: 's.score.detail.eeat', level: 'S', roles: ['R', 'K'], sources: ['T6'], format: 'score', i18nLabelKey: 'metric.s.score.detail.eeat.trust', description: 'E-E-A-T score: trust signals' },
  { key: 's.score.detail.eeat.links', namespace: 's.score.detail.eeat', level: 'S', roles: ['R', 'K'], sources: ['T3'], format: 'score', i18nLabelKey: 'metric.s.score.detail.eeat.links', description: 'E-E-A-T score: link signals' },
];
