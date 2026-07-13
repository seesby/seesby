/**
 * Action Triggers
 * Trigger functions for each of the 48 action types.
 * Each function returns true if the action should fire for the given page/site data.
 */
import type { ProjectFingerprint } from '@seesby/types';
import type { ActionDescriptor } from '@seesby/types';

export type TriggerFn = (
  pageData: Record<string, unknown>,
  siteData: Record<string, unknown>,
  fingerprint: ProjectFingerprint,
) => boolean;

const TRIGGER_MAP: Record<string, TriggerFn> = {
  // ─── Content ────────────────────────────────────────
  rewrite_title: (p) => !p['p.content.title'] || (typeof p['p.content.title'] === 'string' && ((p['p.content.title'] as string).length < 10 || (p['p.content.title'] as string).length > 60)),
  rewrite_meta: (p) => !p['p.content.metaDesc'] || (typeof p['p.content.metaDesc'] === 'string' && (p['p.content.metaDesc'] as string).length < 20),
  refresh_content: (p) => p['p.content.contentDecay'] === true || (typeof p['p.content.freshnessDays'] === 'number' && (p['p.content.freshnessDays'] as number) > 180),
  expand_thin_content: (p) => typeof p['p.content.wordCount'] === 'number' && (p['p.content.wordCount'] as number) < 300 && p['p.content.intentSearch'] === 'informational',
  merge_cannibal: (p) => p['p.content.cannibalization'] === true,
  split_overlap: (p) => typeof p['p.content.semanticSimilarity'] === 'number' && (p['p.content.semanticSimilarity'] as number) > 0.8,
  deprecate: (p) => (p['p.search.gsc.clicks'] === 0 || p['p.search.gsc.clicks'] === undefined) && (p['p.links.inlinks'] as number || 0) < 3,
  redirect_to_stronger: (p) => (p['p.search.gsc.clicks'] as number || 0) === 0 && (p['p.links.inlinks'] as number || 0) === 0,
  add_faq_schema: (p) => p['p.content.faqPresent'] === true && p['p.content.schemaTypes']?.toString().includes('FAQPage') === false,
  add_howto_schema: (p) => p['p.content.howtoPresent'] === true && p['p.content.schemaTypes']?.toString().includes('HowTo') === false,
  add_author_eeat: (p) => typeof p['p.content.eeatScore'] === 'number' && (p['p.content.eeatScore'] as number) < 40,
  rebuild_topic_cluster: (p) => typeof p['p.content.topicCoverage'] === 'number' && (p['p.content.topicCoverage'] as number) < 0.6,
  fix_duplicate: (p) => p['p.content.duplicateExact'] === true || p['p.content.duplicateNearMatch'] === true,
  alt_text_batch: (p) => typeof p['p.content.imagesMissingAlt'] === 'number' && (p['p.content.imagesMissingAlt'] as number) >= 5,
  fix_readability: (p) => typeof p['p.content.readabilityGradeLevel'] === 'number' && (p['p.content.readabilityGradeLevel'] as number) > 10,
  rewrite_ai_text: (p) => typeof p['p.content.aiGeneratedProb'] === 'number' && (p['p.content.aiGeneratedProb'] as number) > 0.8,
  add_internal_links_content: (p) => p['p.links.orphan'] === true || p['p.links.nearOrphan'] === true,

  // ─── Technical ──────────────────────────────────────
  fix_indexability: (p) => p['p.indexing.indexable'] === false,
  fix_5xx: (p) => typeof p['p.indexing.statusCode'] === 'number' && (p['p.indexing.statusCode'] as number) >= 500,
  fix_4xx: (p) => typeof p['p.indexing.statusCode'] === 'number' && (p['p.indexing.statusCode'] as number) >= 400 && (p['p.indexing.statusCode'] as number) < 500,
  fix_redirect_chain: (p) => typeof p['p.indexing.redirectChain'] === 'string' && (p['p.indexing.redirectChain'] as string).length > 1,
  fix_hreflang: (p) => typeof p['p.indexing.hreflangErrors'] === 'number' && (p['p.indexing.hreflangErrors'] as number) > 0,
  fix_schema_errors: (p) => typeof p['p.content.schemaErrors'] === 'number' && (p['p.content.schemaErrors'] as number) > 0,
  upgrade_schema_coverage: (p) => typeof p['p.content.schemaCoverage'] === 'number' && (p['p.content.schemaCoverage'] as number) < 0.5,
  improve_cwv: (p) => p['p.tech.cwv.bucket'] === 'poor' || p['p.tech.cwv.bucket'] === 'needs-improvement',
  reduce_js_dependency: (p) => typeof p['p.tech.jsRenderDep'] === 'number' && (p['p.tech.jsRenderDep'] as number) > 0.6,
  fix_security_headers: (p) => typeof p['p.tech.sec.grade'] === 'string' && ['D', 'E', 'F'].includes(p['p.tech.sec.grade'] as string),
  rotate_ssl: (p) => typeof p['p.tech.sec.sslDays'] === 'number' && (p['p.tech.sec.sslDays'] as number) < 30,
  fix_a11y_batch: (p) => typeof p['p.tech.a11y.violations'] === 'number' && (p['p.tech.a11y.violations'] as number) > 10,
  fix_sitemap: (p) => p['p.indexing.inSitemap'] === false && p['p.indexing.indexable'] === true,
  fix_mixedContent: (p) => p['p.tech.sec.mixedContent'] === true,
  remove_soft404: (p) => p['p.indexing.isSoft404'] === true,
  fix_canonical_loop: (p) => typeof p['p.indexing.canonicalChain'] === 'string' && (p['p.indexing.canonicalChain'] as string).includes('loop'),

  // ─── Links ──────────────────────────────────────────
  add_internal_links: (p) => p['p.links.orphan'] === true || p['p.links.nearOrphan'] === true,
  redistribute_pagerank: (p) => typeof p['p.links.internalPagerank'] === 'number' && (p['p.links.internalPagerank'] as number) < 0.3,
  remove_toxic_backlinks: (p) => typeof p['p.links.toxicBacklinkShare'] === 'number' && (p['p.links.toxicBacklinkShare'] as number) > 0.05,
  reclaim_unlinked_mention: (p) => typeof p['p.social.mentions.unlinked'] === 'number' && (p['p.social.mentions.unlinked'] as number) > 0,
  fix_broken_links: (p) => typeof p['p.links.broken'] === 'number' && (p['p.links.broken'] as number) > 0,
  shorten_redirect_chain: (p) => typeof p['p.indexing.redirectChain'] === 'string' && (p['p.indexing.redirectChain'] as string).split('→').length > 2,
  diversify_anchors: (p) => typeof p['p.links.exactMatchAnchorPct'] === 'number' && (p['p.links.exactMatchAnchorPct'] as number) > 0.3,

  // ─── Search ─────────────────────────────────────────
  target_near_miss_kw: (p) => typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) >= 4 && (p['p.search.gsc.position'] as number) <= 10,
  win_featured_snippet: (p) => typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.position'] as number) <= 5 && p['p.search.featuredSnippet.own'] !== true,
  reclaim_lost_kw: (p) => p['p.search.gsc.isLosing'] === true,
  expand_intent_coverage: (p) => typeof p['p.content.questionsList'] === 'object' && Array.isArray(p['p.content.questionsList']) && (p['p.content.questionsList'] as unknown[]).length > 0,
  dedupe_serp_cannibal: (p) => p['p.search.snippet.cannibalized'] === true,
  optimize_ctr: (p) => typeof p['p.search.gsc.ctr'] === 'number' && typeof p['p.search.gsc.position'] === 'number' && (p['p.search.gsc.ctr'] as number) < 0.02 && (p['p.search.gsc.position'] as number) <= 10,

  // ─── AI ─────────────────────────────────────────────
  unblock_ai_bots: (p) => p['p.ai.botsAllowed'] === false && typeof p['p.ai.citation.rate'] === 'number' && (p['p.ai.citation.rate'] as number) < 0.1,
  add_llms_txt: (p) => p['p.ai.llmsTxt'] !== true,
  add_answer_structure: (p) => typeof p['p.ai.answerBoxFit'] === 'number' && (p['p.ai.answerBoxFit'] as number) < 0.4,
  add_speakable: (p) => typeof p['p.ai.speakableScore'] === 'number' && (p['p.ai.speakableScore'] as number) < 0.3,
  claim_entity: (p) => p['p.search.entityInKG'] !== true,

  // ─── Paid ───────────────────────────────────────────
  pause_low_qs: (p) => typeof p['p.paid.qsLpComponent'] === 'number' && (p['p.paid.qsLpComponent'] as number) < 6,
  add_negatives: (p) => typeof p['p.paid.irrelevantSearchTerms'] === 'number' && (p['p.paid.irrelevantSearchTerms'] as number) > 0,
  refresh_fatigued_ad: (p) => typeof p['p.paid.adCtrDelta14d'] === 'number' && (p['p.paid.adCtrDelta14d'] as number) < -0.25,
  fix_lp_for_qs: (p) => typeof p['p.paid.qsLpComponent'] === 'number' && (p['p.paid.qsLpComponent'] as number) < 5,
  reallocate_budget: (p, s) => typeof p['p.paid.roas'] === 'number' && (p['p.paid.roas'] as number) < 1 && typeof s['s.paid.siblingRoaMax'] === 'number' && (s['s.paid.siblingRoaMax'] as number) > 3,
  stop_disapproved: (p) => p['p.paid.isDisapproved'] === true && p['p.paid.isActive'] === true,
  add_assets_to_rsa: (p) => typeof p['p.paid.assetCoverage'] === 'string' && (p['p.paid.assetCoverage'] as string) !== 'good',
  align_message_match: (p) => typeof p['p.paid.adIntentMatch'] === 'number' && (p['p.paid.adIntentMatch'] as number) < 0.6,

  // ─── UX ─────────────────────────────────────────────
  fix_form_field: (p) => typeof p['p.ux.formFieldDropRate'] === 'number' && (p['p.ux.formFieldDropRate'] as number) > 0.3,
  reduce_form_fields: (p) => typeof p['p.ux.formFieldCount'] === 'number' && (p['p.ux.formFieldCount'] as number) > 6 && typeof p['p.ux.formCompletionRate'] === 'number' && (p['p.ux.formCompletionRate'] as number) < 0.4,
  fix_rage_hotspot: (p) => typeof p['p.ux.rageClicks'] === 'number' && (p['p.ux.rageClicks'] as number) > 5,
  move_cta_above_fold: (p) => typeof p['p.ga.conversionRate'] === 'number' && (p['p.ga.conversionRate'] as number) < 0.02,
  run_experiment: (p) => typeof p['p.ux.frictionScore'] === 'number' && (p['p.ux.frictionScore'] as number) > 0.5 && typeof p['p.ga.sessions'] === 'number' && (p['p.ga.sessions'] as number) > 1000,

  // ─── Social ─────────────────────────────────────────
  fix_og_tags: (p) => typeof p['p.social.ogMissingTags'] === 'number' && (p['p.social.ogMissingTags'] as number) > 0,
  respond_crisis: (_p, s) => s['s.social.crisisSignal'] === true,
  shift_posting_time: (_p, s) => typeof s['s.social.postingCadence'] === 'string' && typeof s['s.social.bestTime'] === 'string' && s['s.social.postingCadence'] !== s['s.social.bestTime'],
  increase_short_video: (_p, s) => typeof s['s.social.shortVideoEngLift'] === 'number' && (s['s.social.shortVideoEngLift'] as number) > 0 && typeof s['s.social.shortVideoCadence'] === 'number' && (s['s.social.shortVideoCadence'] as number) < 3,

  // ─── Commerce ───────────────────────────────────────
  fix_feed_attrs: (p) => typeof p['p.commerce.feedErrors'] === 'number' && (p['p.commerce.feedErrors'] as number) > 0,
  restock_visibility: (p) => p['p.commerce.availability'] === 'oos' || p['p.commerce.availability'] === 'backorder',
  add_review_schema: (p) => typeof p['p.commerce.reviews.count'] === 'number' && (p['p.commerce.reviews.count'] as number) > 0 && p['p.commerce.reviews.schemaOk'] !== true,
  flatten_category_depth: (p) => typeof p['p.indexing.depthFolder'] === 'number' && (p['p.indexing.depthFolder'] as number) > 3,

  // ─── Local ──────────────────────────────────────────
  fix_nap: (p) => typeof p['p.local.napScore'] === 'number' && (p['p.local.napScore'] as number) < 0.9,
  claim_gbp: (p) => p['p.local.gbpVerified'] !== true,
  respond_reviews: (p) => typeof p['p.local.reviews.negative'] === 'number' && (p['p.local.reviews.negative'] as number) >= 3,
  add_service_area_page: (p) => typeof p['p.local.serviceArea.pages'] === 'number' && (p['p.local.serviceArea.pages'] as number) === 0,
};

export function evaluateTrigger(
  action: ActionDescriptor,
  pageData: Record<string, unknown>,
  siteData: Record<string, unknown>,
  fingerprint: ProjectFingerprint,
): boolean {
  const fn = TRIGGER_MAP[action.triggerKey];
  if (!fn) return false;
  try {
    return fn(pageData, siteData, fingerprint);
  } catch {
    return false;
  }
}

export function getTriggerKeys(): string[] {
  return Object.keys(TRIGGER_MAP);
}
