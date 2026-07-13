// services/crawler/pipeline/conversion-packs.ts
//
// Industry-specific conversion packs. Each pack defines primary events,
// secondary events, and micro-conversions relevant to an industry vertical.
// Packs are auto-assigned during onboarding after fingerprint detection
// and can be accepted or edited by the user.

import type { Industry } from '../../packages/types/src/industries';

// ── Event definition ───────────────────────────────────────────────────

export interface ConversionEvent {
  /** Unique event key, e.g. 'purchase', 'add_to_cart'. */
  readonly key: string;
  /** Human-readable label for the UI. */
  readonly label: string;
  /** Category bucket for grouping in the sidebar. */
  readonly category: 'primary' | 'secondary' | 'micro';
}

// ── Conversion pack ────────────────────────────────────────────────────

export interface ConversionPack {
  /** The industry this pack targets. */
  readonly industry: Industry;
  /** High-value goal events (e.g. purchase, sign_up). */
  readonly primaryEvents: ReadonlyArray<ConversionEvent>;
  /** Mid-value engagement events (e.g. share, contact_sales). */
  readonly secondaryEvents: ReadonlyArray<ConversionEvent>;
  /** Low-signal browsing signals (e.g. scroll_90, product_view). */
  readonly microConversions: ReadonlyArray<ConversionEvent>;
}

// ── Shorthand return type for packForIndustry ──────────────────────────

export interface ConversionPackSummary {
  primary: string[];
  secondary: string[];
  micro: string[];
}

// ── Convenience constructors ───────────────────────────────────────────

function ev(key: string, label: string, category: ConversionEvent['category']): ConversionEvent {
  return { key, label, category };
}

function pack(
  industry: Industry,
  primary: Array<[string, string]>,
  secondary: Array<[string, string]>,
  micro: Array<[string, string]>,
): ConversionPack {
  return {
    industry,
    primaryEvents: primary.map(([k, l]) => ev(k, l, 'primary')),
    secondaryEvents: secondary.map(([k, l]) => ev(k, l, 'secondary')),
    microConversions: micro.map(([k, l]) => ev(k, l, 'micro')),
  };
}

// ── Pack registry ──────────────────────────────────────────────────────

const PACKS: ReadonlyMap<Industry, ConversionPack> = new Map<Industry, ConversionPack>([
  [
    'ecommerce',
    pack('ecommerce',
      [['purchase', 'Purchase'], ['add_to_cart', 'Add to Cart'], ['begin_checkout', 'Begin Checkout']],
      [['add_to_wishlist', 'Add to Wishlist'], ['subscribe', 'Subscribe']],
      [['product_view', 'Product View'], ['use_search', 'Site Search'], ['view_cart', 'View Cart']],
    ),
  ],
  [
    'saas',
    pack('saas',
      [['sign_up', 'Sign Up'], ['start_trial', 'Start Trial'], ['request_demo', 'Request Demo']],
      [['contact_sales', 'Contact Sales'], ['book_meeting', 'Book Meeting']],
      [['pricing_view', 'Pricing View'], ['docs_view', 'Docs View'], ['video_watch', 'Video Watch']],
    ),
  ],
  [
    'blog',
    pack('blog',
      [['newsletter_sub', 'Newsletter Subscribe'], ['sponsor_click', 'Sponsor Click'], ['affiliate', 'Affiliate Click']],
      [['share', 'Share'], ['comment', 'Comment'], ['save', 'Save']],
      [['scroll_90', 'Scroll 90%'], ['time_on_page_60s', 'Time on Page 60s']],
    ),
  ],
  [
    'news',
    pack('news',
      [['subscription', 'Subscription'], ['paywall_convert', 'Paywall Convert'], ['sign_in', 'Sign In']],
      [['newsletter_sub', 'Newsletter Subscribe'], ['push_opt_in', 'Push Opt-in']],
      [['article_complete', 'Article Complete'], ['3_articles_session', '3 Articles Session']],
    ),
  ],
  [
    'finance',
    pack('finance',
      [['application_start', 'Application Start'], ['application_complete', 'Application Complete']],
      [['calculator_complete', 'Calculator Complete'], ['contact', 'Contact']],
      [['calculator_view', 'Calculator View'], ['docs_download', 'Docs Download']],
    ),
  ],
  [
    'education',
    pack('education',
      [['application_start', 'Application Start'], ['application_complete', 'Application Complete']],
      [['program_inquiry', 'Program Inquiry'], ['apply_now', 'Apply Now']],
      [['course_view', 'Course View'], ['syllabus_download', 'Syllabus Download']],
    ),
  ],
  [
    'healthcare',
    pack('healthcare',
      [['appt_booked', 'Appointment Booked'], ['contact_form', 'Contact Form'], ['call_clicked', 'Call Clicked']],
      [['insurance_check', 'Insurance Check'], ['tele_consult', 'Tele-consult']],
      [['symptom_checker_use', 'Symptom Checker Use'], ['dr_profile_view', 'Doctor Profile View']],
    ),
  ],
  [
    'jobBoard',
    pack('jobBoard',
      [['application_submitted', 'Application Submitted'], ['job_alert_sub', 'Job Alert Subscribe']],
      [['employer_contact', 'Employer Contact']],
      [['job_view', 'Job View'], ['save_job', 'Save Job'], ['resume_upload', 'Resume Upload']],
    ),
  ],
  [
    'local',
    pack('local',
      [['call', 'Call'], ['direction', 'Get Directions'], ['booking', 'Booking']],
      [['form_submit', 'Form Submit'], ['menu_view', 'Menu View']],
      [['hours_view', 'Hours View'], ['photo_view', 'Photo View']],
    ),
  ],
  [
    'realEstate',
    pack('realEstate',
      [['lead_form', 'Lead Form'], ['book_viewing', 'Book Viewing'], ['call', 'Call']],
      [['save_listing', 'Save Listing'], ['mortgage_calc', 'Mortgage Calculator']],
      [['photo_gallery', 'Photo Gallery'], ['share_listing', 'Share Listing']],
    ),
  ],
  [
    'restaurant',
    pack('restaurant',
      [['reservation', 'Reservation'], ['order_online', 'Order Online'], ['call', 'Call']],
      [['menu_view', 'Menu View'], ['delivery_start', 'Delivery Start']],
      [['hours_view', 'Hours View']],
    ),
  ],
  [
    'nonprofit',
    pack('nonprofit',
      [['donate', 'Donate'], ['volunteer', 'Volunteer Sign-up'], ['newsletter_sub', 'Newsletter Subscribe']],
      [['petition_sign', 'Petition Sign'], ['share', 'Share']],
      [['story_read', 'Story Read']],
    ),
  ],
  [
    'government',
    pack('government',
      [['form_submit', 'Form Submit'], ['permit_apply', 'Permit Apply']],
      [['pay_fee', 'Pay Fee']],
      [['info_found', 'Info Found']],
    ),
  ],
  [
    'portfolio',
    pack('portfolio',
      [['contact_form', 'Contact Form'], ['hire_click', 'Hire Click'], ['email_click', 'Email Click']],
      [['download_cv', 'Download CV']],
      [['case_study_view', 'Case Study View']],
    ),
  ],
]);

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Retrieve the full ConversionPack for a given industry.
 * Returns the 'general' pack (empty arrays) for unrecognised industries.
 */
export function getConversionPack(industry: string): ConversionPack {
  const key = normalizeIndustryKey(industry);
  return PACKS.get(key) ?? EMPTY_PACK;
}

/**
 * Return a lightweight summary of the pack, suitable for auto-assignment
 * during onboarding. The user can accept the defaults or edit them.
 */
export function packForIndustry(industry: string): ConversionPackSummary {
  const p = getConversionPack(industry);
  return {
    primary: p.primaryEvents.map((e) => e.key),
    secondary: p.secondaryEvents.map((e) => e.key),
    micro: p.microConversions.map((e) => e.key),
  };
}

/**
 * Returns true if the given event key is defined in any conversion pack
 * for the specified industry.
 */
export function isKnownConversionEvent(industry: string, eventKey: string): boolean {
  const p = getConversionPack(industry);
  const all = [...p.primaryEvents, ...p.secondaryEvents, ...p.microConversions];
  return all.some((e) => e.key === eventKey);
}

/**
 * Look up a single event definition across all packs.
 * Returns null if the event is not found.
 */
export function findConversionEvent(eventKey: string): ConversionEvent | null {
  for (const p of Array.from(PACKS.values())) {
    const all = [...p.primaryEvents, ...p.secondaryEvents, ...p.microConversions];
    const found = all.find((e) => e.key === eventKey);
    if (found) return found;
  }
  return null;
}

/**
 * List all registered industry keys that have a conversion pack.
 */
export function registeredIndustries(): Industry[] {
  return Array.from(PACKS.keys());
}

// ── Internal helpers ───────────────────────────────────────────────────

function normalizeIndustryKey(raw: string): Industry {
  const k = String(raw).trim();
  // Legacy snake_case safety net.
  if (k === 'real_estate') return 'realEstate';
  if (k === 'job_board') return 'jobBoard';
  return k as Industry;
}

const EMPTY_PACK: ConversionPack = {
  industry: 'general',
  primaryEvents: [],
  secondaryEvents: [],
  microConversions: [],
};
