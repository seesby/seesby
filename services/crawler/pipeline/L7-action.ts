/**
 * L7 – Action Engine
 * 48-action engine with triggers, priority bands, and actionScore formula.
 */
import type { ProjectFingerprint } from '@seesby/types';
import { ACTION_CATALOG, getAction, computeActionScore, classifyBand } from '@seesby/actions';
import type { ActionDescriptor, SourceTier } from '@seesby/types';

export interface TriggeredAction {
  action: ActionDescriptor;
  score: number;
  band: string;
  expectedDelta: number;
  sourceTier: SourceTier;
  businessValue: number;
  effortHours: number;
  affectedUrls: string[];
}

export interface ActionResult {
  /** All triggered actions sorted by score descending */
  actions: TriggeredAction[];
  /** Top actions per URL (max 5 each) */
  topByPage: Map<string, TriggeredAction[]>;
  /** Actions grouped by priority band */
  byBand: Record<string, TriggeredAction[]>;
}

export interface ActionContext {
  fingerprint: ProjectFingerprint;
  pages: Map<string, Record<string, unknown>>;
  siteData: Record<string, unknown>;
}

export function runL7Action(ctx: ActionContext): ActionResult {
  const { fingerprint, pages, siteData } = ctx;
  const triggered: TriggeredAction[] = [];
  const pageActions = new Map<string, TriggeredAction[]>();

  for (const [url, pageData] of pages) {
    const pageTriggered: TriggeredAction[] = [];

    for (const action of ACTION_CATALOG) {
      if (!checkTrigger(action, pageData, siteData, fingerprint)) continue;
      const band = classifyBand(action.code);
      const expectedDelta = estimateDelta(action, pageData, fingerprint);
      const sourceTier = inferSourceTier(pageData);
      const businessValue = computeBusinessValue(pageData, siteData);
      const effortHours = action.effortMinutes / 60;
      const score = computeActionScore({
        action, expectedDelta, sourceTier, businessValue, effortHours,
      });

      const ta: TriggeredAction = {
        action, score, band, expectedDelta, sourceTier,
        businessValue, effortHours, affectedUrls: [url],
      };
      pageTriggered.push(ta);
      triggered.push(ta);
    }

    pageTriggered.sort((a, b) => b.score - a.score);
    pageActions.set(url, pageTriggered.slice(0, 5));
  }

  triggered.sort((a, b) => b.score - a.score);

  const byBand: Record<string, TriggeredAction[]> = {};
  for (const ta of triggered) {
    (byBand[ta.band] ??= []).push(ta);
  }

  return { actions: triggered, topByPage: pageActions, byBand };
}

// ---------------------------------------------------------------------------
// Trigger checks (simplified – full logic in action-triggers.ts)
// ---------------------------------------------------------------------------

function checkTrigger(
  action: ActionDescriptor,
  pageData: Record<string, unknown>,
  siteData: Record<string, unknown>,
  fp: ProjectFingerprint,
): boolean {
  const code = action.code;
  // Two-letter prefixes must be checked BEFORE single-letter prefixes
  // to avoid false matches (e.g., SO01 starts with S, LO01 starts with L).
  if (code.startsWith('SO')) return checkSocialTrigger(code, pageData);
  if (code.startsWith('LO')) return checkLocalTrigger(code, pageData, fp);
  if (code.startsWith('T')) return checkTechnicalTrigger(code, pageData, siteData);
  if (code.startsWith('C')) return checkContentTrigger(code, pageData);
  if (code.startsWith('L')) return checkLinksTrigger(code, pageData, siteData);
  if (code.startsWith('S')) return checkSearchTrigger(code, pageData);
  if (code.startsWith('A')) return checkAiTrigger(code, pageData);
  if (code.startsWith('P')) return checkPaidTrigger(code, pageData, fp);
  if (code.startsWith('U')) return checkUxTrigger(code, pageData);
  if (code.startsWith('E')) return checkCommerceTrigger(code, pageData, fp);
  return false;
}

function checkTechnicalTrigger(code: string, p: Record<string, unknown>, s: Record<string, unknown>): boolean {
  switch (code) {
    case 'T01': return p['p.indexing.indexable'] === false;
    case 'T02': return typeof p['p.indexing.statusCode'] === 'number' && (p['p.indexing.statusCode'] as number) >= 500;
    case 'T03': return typeof p['p.indexing.statusCode'] === 'number' && (p['p.indexing.statusCode'] as number) === 404;
    case 'T04': return typeof p['p.indexing.redirectChain'] === 'string' && (p['p.indexing.redirectChain'] as string).length > 0;
    case 'T05': return typeof p['p.indexing.hreflangErrors'] === 'number' && (p['p.indexing.hreflangErrors'] as number) > 0;
    case 'T06': return typeof p['p.content.schemaErrors'] === 'number' && (p['p.content.schemaErrors'] as number) > 0;
    case 'T07': return typeof p['p.content.schemaCoverage'] === 'number' && (p['p.content.schemaCoverage'] as number) < 0.5;
    case 'T08': return p['p.tech.cwv.bucket'] === 'poor' && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 100;
    case 'T09': return typeof p['p.tech.jsRenderDep'] === 'number' && (p['p.tech.jsRenderDep'] as number) > 0.6;
    case 'T10': return typeof p['p.tech.sec.grade'] === 'string' && ['D','F'].includes(p['p.tech.sec.grade'] as string);
    case 'T11': return typeof p['p.tech.sec.sslDays'] === 'number' && (p['p.tech.sec.sslDays'] as number) < 30;
    case 'T12': return typeof p['p.tech.a11y.violations'] === 'number' && (p['p.tech.a11y.violations'] as number) > 10 && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 1000;
    case 'T13': return p['p.indexing.inSitemap'] !== undefined && p['p.indexing.inSitemap'] === false && p['p.indexing.indexable'] === true;
    case 'T14': return p['p.tech.sec.mixedContent'] === true;
    case 'T15': return p['p.indexing.isSoft404'] === true;
    case 'T16': return typeof p['p.indexing.canonicalChain'] === 'string' && (p['p.indexing.canonicalChain'] as string).includes('loop');
    default: return false;
  }
}

function checkContentTrigger(code: string, p: Record<string, unknown>): boolean {
  switch (code) {
    case 'C01': return !p['p.content.title'] || typeof p['p.content.title'] === 'string' && ((p['p.content.title'] as string).length < 20 || (p['p.content.title'] as string).length > 70);
    case 'C02': return !p['p.content.metaDesc'] || typeof p['p.content.metaDesc'] === 'string' && ((p['p.content.metaDesc'] as string).length < 70 || (p['p.content.metaDesc'] as string).length > 160);
    case 'C03': return typeof p['p.content.freshnessDays'] === 'number' && (p['p.content.freshnessDays'] as number) > 180 && p['p.content.contentDecay'] === true && typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) >= 4 && (p['p.search.gsc.position'] as number) <= 20;
    case 'C04': return typeof p['p.content.wordCount'] === 'number' && (p['p.content.wordCount'] as number) < 300 && p['p.content.intentSearch'] === 'informational';
    case 'C05': return p['p.content.cannibalization'] === true;
    case 'C06': return typeof p['p.content.topicIntentCount'] === 'number' && (p['p.content.topicIntentCount'] as number) > 1;
    case 'C07': return typeof p['p.search.gsc.clicks'] === 'number' && (p['p.search.gsc.clicks'] as number) === 0 && typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) === 0 && typeof p['p.links.inlinks'] === 'number' && (p['p.links.inlinks'] as number) < 3;
    case 'C08': return p['p.indexing.isSoft404'] === true || (typeof p['p.indexing.statusCode'] === 'number' && (p['p.indexing.statusCode'] as number) !== 200);
    case 'C09': return Array.isArray(p['p.content.questionsList']) && (p['p.content.questionsList'] as unknown[]).length > 0 && Array.isArray(p['p.content.schemaTypes']) && !(p['p.content.schemaTypes'] as unknown[]).includes('FAQPage');
    case 'C10': return p['p.content.hasProcedureSteps'] === true && Array.isArray(p['p.content.schemaTypes']) && !(p['p.content.schemaTypes'] as unknown[]).includes('HowTo');
    case 'C11': return typeof p['p.content.author'] === 'undefined' && p['p.content.authorBioPresent'] !== true;
    case 'C12': return typeof p['p.content.topicCoverage'] === 'number' && (p['p.content.topicCoverage'] as number) < 0.6;
    case 'C13': return p['p.content.duplicateExact'] === true;
    case 'C14': return typeof p['p.content.imagesMissingAlt'] === 'number' && (p['p.content.imagesMissingAlt'] as number) >= 5;
    case 'C15': return typeof p['p.content.readabilityGradeLevel'] === 'number' && (p['p.content.readabilityGradeLevel'] as number) > 12;
    case 'C16': return typeof p['p.content.aiGeneratedProb'] === 'number' && (p['p.content.aiGeneratedProb'] as number) > 0.8 && typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) < 50 && typeof p['p.content.eeatScore'] === 'number' && (p['p.content.eeatScore'] as number) < 50;
    case 'C17': return p['p.links.orphan'] === true || p['p.links.nearOrphan'] === true;
    default: return false;
  }
}

function checkLinksTrigger(code: string, p: Record<string, unknown>, s: Record<string, unknown>): boolean {
  switch (code) {
    case 'L01': return p['p.links.orphan'] === true || p['p.links.nearOrphan'] === true;
    case 'L02': return typeof p['p.links.internalPagerank'] === 'number' && (p['p.links.internalPagerank'] as number) < 30 && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 50;
    case 'L03': return typeof p['p.links.toxicBacklinkShare'] === 'number' && (p['p.links.toxicBacklinkShare'] as number) > 0.05;
    case 'L04': return checkUnlinkedBrandMention(p, s);
    case 'L05': return typeof p['p.links.broken'] === 'number' && (p['p.links.broken'] as number) > 0;
    case 'L06': return typeof p['p.indexing.redirectChain'] === 'number' && (p['p.indexing.redirectChain'] as number) > 2;
    case 'L07': return typeof p['p.links.exactMatchAnchorPct'] === 'number' && (p['p.links.exactMatchAnchorPct'] as number) > 0.3;
    default: return false;
  }
}

function checkSearchTrigger(code: string, p: Record<string, unknown>): boolean {
  switch (code) {
    case 'S01': return typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) >= 4 && (p['p.search.gsc.position'] as number) <= 10 && typeof p['p.search.gsc.impr'] === 'number' && (p['p.search.gsc.impr'] as number) > 50;
    case 'S02': return typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) <= 5 && typeof p['p.content.answerBoxFit'] === 'number' && (p['p.content.answerBoxFit'] as number) > 0.7 && p['p.search.featuredSnippetOwned'] !== true;
    case 'S03': return p['p.search.gsc.isLosing'] === true;
    case 'S04': return Array.isArray(p['p.content.questionsList']) && (p['p.content.questionsList'] as unknown[]).length > 0 && typeof p['p.content.topicCoverage'] === 'number' && (p['p.content.topicCoverage'] as number) < 0.7;
    case 'S05': return p['p.search.snippetCannibalized'] === true;
    case 'S06': return typeof p['p.search.gsc.impr'] === 'number' && (p['p.search.gsc.impr'] as number) > 100 && typeof p['p.search.gsc.ctr'] === 'number' && (p['p.search.gsc.ctr'] as number) < 0.02;
    default: return false;
  }
}

function checkAiTrigger(code: string, p: Record<string, unknown>): boolean {
  switch (code) {
    case 'A01': return p['p.ai.botsBlocked'] !== undefined && typeof p['p.ai.citationRate'] === 'number' && (p['p.ai.citationRate'] as number) < 0.1;
    case 'A02': return p['p.ai.llmsTxt'] === false;
    case 'A03': return typeof p['p.ai.answerBoxFit'] === 'number' && (p['p.ai.answerBoxFit'] as number) < 0.4 && p['p.content.intentSearch'] === 'informational';
    case 'A04': return (p['p.content.intentSearch'] === 'navigational' || p['p.content.intentSearch'] === 'local') && p['p.ai.speakable'] !== true;
    case 'A05': return Array.isArray(p['p.content.schemaTypes']) && !(p['p.content.schemaTypes'] as unknown[]).includes('Organization') || p['p.search.knowledgePanel'] === false;
    default: return false;
  }
}

function checkPaidTrigger(code: string, p: Record<string, unknown>, fp: ProjectFingerprint): boolean {
  const adPlatforms = fp.stack?.adPlatforms?.value;
  if (!adPlatforms || (Array.isArray(adPlatforms) ? adPlatforms.length === 0 : !adPlatforms)) return false;
  switch (code) {
    case 'P01': return typeof p['s.paid.qsAvg'] === 'number' && (p['s.paid.qsAvg'] as number) < 6;
    case 'P02': return typeof p['s.paid.wastefulSpendPct'] === 'number' && (p['s.paid.wastefulSpendPct'] as number) > 0.15;
    case 'P03': return typeof p['p.paid.ctrTrend'] === 'string' && (p['p.paid.ctrTrend'] as string) === 'declining' && typeof p['p.paid.qsAvg'] === 'number' && (p['p.paid.qsAvg'] as number) > 5;
    case 'P04': return typeof p['p.paid.qsLpComponent'] === 'number' && (p['p.paid.qsLpComponent'] as number) < 5;
    case 'P05': return typeof p['s.paid.roas'] === 'number' && (p['s.paid.roas'] as number) < 1;
    case 'P06': return p['p.paid.adDisapproved'] === true;
    case 'P07': return typeof p['p.paid.rsaAssetCoverage'] === 'number' && (p['p.paid.rsaAssetCoverage'] as number) < 0.8;
    case 'P08': return typeof p['p.paid.adIntentMatch'] === 'number' && (p['p.paid.adIntentMatch'] as number) < 0.6;
    default: return false;
  }
}

function checkUxTrigger(code: string, p: Record<string, unknown>): boolean {
  switch (code) {
    case 'U01': return typeof p['p.conv.formFieldDropRate'] === 'number' && (p['p.conv.formFieldDropRate'] as number) > 0.3;
    case 'U02': return typeof p['p.conv.formFieldCount'] === 'number' && (p['p.conv.formFieldCount'] as number) > 6 && typeof p['p.conv.formAbandonRate'] === 'number' && (p['p.conv.formAbandonRate'] as number) > 0.6;
    case 'U03': return typeof p['p.ux.rageClicks'] === 'number' && (p['p.ux.rageClicks'] as number) > 5 && typeof p['p.ga.conversionRate'] === 'number' && (p['p.ga.conversionRate'] as number) > 0;
    case 'U04': return typeof p['p.ctaBelowFold'] === 'boolean' && p['p.ctaBelowFold'] === true && typeof p['p.ga.conversionRate'] === 'number' && (p['p.ga.conversionRate'] as number) < 0.02;
    case 'U05': return (typeof p['p.ux.rageClicks'] === 'number' && (p['p.ux.rageClicks'] as number) > 3 || typeof p['p.ux.deadClicks'] === 'number' && (p['p.ux.deadClicks'] as number) > 3) && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 1000;
    default: return false;
  }
}

function checkSocialTrigger(code: string, p: Record<string, unknown>): boolean {
  switch (code) {
    case 'SO01': return typeof p['p.social.ogMissingTags'] === 'number' && (p['p.social.ogMissingTags'] as number) > 0;
    case 'SO02': return p['s.social.crisisSignal'] === true;
    case 'SO03': return p['s.social.postingCadenceOff'] === true;
    case 'SO04': return typeof p['s.social.shortVideoShare'] === 'number' && (p['s.social.shortVideoShare'] as number) < 0.2;
    default: return false;
  }
}

function checkCommerceTrigger(code: string, p: Record<string, unknown>, fp: ProjectFingerprint): boolean {
  if (fp.industry !== 'ecommerce') return false;
  switch (code) {
    case 'E01': return typeof p['p.commerce.feedErrors'] === 'number' && (p['p.commerce.feedErrors'] as number) > 0;
    case 'E02': return p['p.commerce.availability'] === 'oos' && typeof p['p.commerce.oosDuration'] === 'number' && (p['p.commerce.oosDuration'] as number) > 7 && p['p.indexing.indexable'] !== false;
    case 'E03': return typeof p['p.commerce.reviewsCount'] === 'number' && (p['p.commerce.reviewsCount'] as number) > 0 && Array.isArray(p['p.content.schemaTypes']) && !(p['p.content.schemaTypes'] as unknown[]).includes('Review') && !(p['p.content.schemaTypes'] as unknown[]).includes('AggregateRating');
    case 'E04': return typeof p['p.depth.folder'] === 'number' && (p['p.depth.folder'] as number) > 3 && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 0;
    default: return false;
  }
}

function checkLocalTrigger(code: string, p: Record<string, unknown>, fp: ProjectFingerprint): boolean {
  if (!['local', 'restaurant', 'healthcare'].includes(fp.industry)) return false;
  switch (code) {
    case 'LO01': return typeof p['p.local.napScore'] === 'number' && (p['p.local.napScore'] as number) < 0.9;
    case 'LO02': return p['p.local.gbpVerified'] === false || p['p.local.gbpLinked'] === false;
    case 'LO03': return typeof p['p.local.reviewsNegative'] === 'number' && (p['p.local.reviewsNegative'] as number) >= 3 && typeof p['p.local.reviewsResponseRate'] === 'number' && (p['p.local.reviewsResponseRate'] as number) < 0.5;
    case 'LO04': return typeof p['p.local.serviceAreaCoverage'] === 'number' && (p['p.local.serviceAreaCoverage'] as number) > 0 && typeof p['p.local.serviceAreaPages'] === 'number' && (p['p.local.serviceAreaPages'] as number) === 0;
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check for unlinked brand mentions: if the page has brand mentions in
 * external content but no inbound link to the site. This checks for
 * `p.links.unlinkedMentions` which would be populated by the SocialMentionsJob
 * or backlink enrichment.
 */
function checkUnlinkedBrandMention(
  pageData: Record<string, unknown>,
  siteData: Record<string, unknown>,
): boolean {
  const unlinkedMentions = pageData['p.links.unlinkedMentions'];
  if (typeof unlinkedMentions === 'number' && unlinkedMentions > 0) return true;
  // Also check site-level data for unlinked brand mention count
  const siteUnlinked = siteData['s.links.unlinkedMentions'];
  return typeof siteUnlinked === 'number' && (siteUnlinked as number) > 0;
}

function estimateDelta(action: ActionDescriptor, pageData: Record<string, unknown>, fp: ProjectFingerprint): number {
  if (action.forecastUnit === 'clicks') return typeof pageData['p.search.gsc.clicks'] === 'number' ? (pageData['p.search.gsc.clicks'] as number) * 0.15 : 10;
  if (action.forecastUnit === 'conversions') return typeof pageData['p.ga.conversions'] === 'number' ? (pageData['p.ga.conversions'] as number) * 0.1 : 2;
  if (action.forecastUnit === 'revenue') return typeof pageData['p.ga.revenue'] === 'number' ? (pageData['p.ga.revenue'] as number) * 0.05 : 100;
  return 5;
}

function inferSourceTier(pageData: Record<string, unknown>): SourceTier {
  if (pageData['p.search.gsc.clicks'] !== undefined) return 'T0';
  return 'T6';
}

function computeBusinessValue(pageData: Record<string, unknown>, siteData: Record<string, unknown>): number {
  const revenue = (typeof pageData['p.ga.revenue'] === 'number' ? pageData['p.ga.revenue'] : 0) as number;
  const sessions = (typeof pageData['p.ga.sessions'] === 'number' ? pageData['p.ga.sessions'] : 0) as number;
  const totalRevenue = (typeof siteData['s.ga.totalRevenue'] === 'number' ? siteData['s.ga.totalRevenue'] : 1) as number;
  return totalRevenue > 0 ? Math.min(1, (revenue / totalRevenue) * 10 + sessions / 10000) : 0.5;
}
