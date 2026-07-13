import type { Industry } from '@seesby/types';

export interface ConversionEvent {
  event: string;
  label: string;
  valueParam?: string;
  category: 'primary' | 'secondary' | 'micro';
}

export interface ConversionPack {
  industry: Industry;
  label: string;
  events: ConversionEvent[];
}

export const CONVERSION_PACKS: Record<Industry, ConversionPack> = {
  ecommerce: {
    industry: 'ecommerce',
    label: 'E-commerce',
    events: [
      { event: 'purchase', label: 'Purchase', valueParam: 'value', category: 'primary' },
      { event: 'add_to_cart', label: 'Add to Cart', category: 'primary' },
      { event: 'begin_checkout', label: 'Begin Checkout', category: 'primary' },
      { event: 'add_to_wishlist', label: 'Add to Wishlist', category: 'secondary' },
      { event: 'subscribe', label: 'Subscribe', category: 'secondary' },
      { event: 'product_view', label: 'Product View', category: 'micro' },
      { event: 'use_search', label: 'Use Search', category: 'micro' },
      { event: 'view_cart', label: 'View Cart', category: 'micro' },
    ],
  },
  saas: {
    industry: 'saas',
    label: 'SaaS',
    events: [
      { event: 'sign_up', label: 'Sign Up', category: 'primary' },
      { event: 'start_trial', label: 'Start Trial', category: 'primary' },
      { event: 'request_demo', label: 'Request Demo', category: 'primary' },
      { event: 'contact_sales', label: 'Contact Sales', category: 'secondary' },
      { event: 'book_meeting', label: 'Book Meeting', category: 'secondary' },
      { event: 'pricing_view', label: 'Pricing View', category: 'micro' },
      { event: 'docs_view', label: 'Docs View', category: 'micro' },
      { event: 'video_watch', label: 'Video Watch', category: 'micro' },
    ],
  },
  blog: {
    industry: 'blog',
    label: 'Blog / Content',
    events: [
      { event: 'newsletter_sub', label: 'Newsletter Subscribe', category: 'primary' },
      { event: 'sponsor_click', label: 'Sponsor Click', category: 'primary' },
      { event: 'affiliate', label: 'Affiliate Click', category: 'primary' },
      { event: 'share', label: 'Share', category: 'secondary' },
      { event: 'comment', label: 'Comment', category: 'secondary' },
      { event: 'save', label: 'Save/Bookmark', category: 'secondary' },
      { event: 'scroll_90', label: 'Scroll 90%', category: 'micro' },
      { event: 'time_on_page_60s', label: 'Time on Page 60s', category: 'micro' },
    ],
  },
  news: {
    industry: 'news',
    label: 'News / Magazine',
    events: [
      { event: 'subscription', label: 'Subscription', valueParam: 'value', category: 'primary' },
      { event: 'paywall_convert', label: 'Paywall Convert', category: 'primary' },
      { event: 'sign_in', label: 'Sign In', category: 'primary' },
      { event: 'newsletter_sub', label: 'Newsletter Subscribe', category: 'secondary' },
      { event: 'push_opt_in', label: 'Push Opt-in', category: 'secondary' },
      { event: 'article_complete', label: 'Article Complete', category: 'micro' },
      { event: '3_articles_session', label: '3 Articles Session', category: 'micro' },
    ],
  },
  finance: {
    industry: 'finance',
    label: 'Finance',
    events: [
      { event: 'application_start', label: 'Application Start', category: 'primary' },
      { event: 'application_complete', label: 'Application Complete', category: 'primary' },
      { event: 'calculator_complete', label: 'Calculator Complete', category: 'secondary' },
      { event: 'contact', label: 'Contact', category: 'secondary' },
      { event: 'calculator_view', label: 'Calculator View', category: 'micro' },
      { event: 'docs_download', label: 'Docs Download', category: 'micro' },
    ],
  },
  healthcare: {
    industry: 'healthcare',
    label: 'Healthcare',
    events: [
      { event: 'appt_booked', label: 'Appointment Booked', category: 'primary' },
      { event: 'contact_form', label: 'Contact Form', category: 'primary' },
      { event: 'call_clicked', label: 'Call Clicked', category: 'primary' },
      { event: 'insurance_check', label: 'Insurance Check', category: 'secondary' },
      { event: 'tele_consult', label: 'Tele-consult', category: 'secondary' },
      { event: 'symptom_checker_use', label: 'Symptom Checker', category: 'micro' },
      { event: 'dr_profile_view', label: 'Doctor Profile View', category: 'micro' },
    ],
  },
  education: {
    industry: 'education',
    label: 'Education',
    events: [
      { event: 'application_start', label: 'Application Start', category: 'primary' },
      { event: 'application_complete', label: 'Application Complete', category: 'primary' },
      { event: 'program_inquiry', label: 'Program Inquiry', category: 'secondary' },
      { event: 'apply_now', label: 'Apply Now', category: 'secondary' },
      { event: 'course_view', label: 'Course View', category: 'micro' },
      { event: 'syllabus_download', label: 'Syllabus Download', category: 'micro' },
    ],
  },
  jobBoard: {
    industry: 'jobBoard',
    label: 'Job Board',
    events: [
      { event: 'application_submitted', label: 'Application Submitted', category: 'primary' },
      { event: 'job_alert_sub', label: 'Job Alert Subscribe', category: 'primary' },
      { event: 'employer_contact', label: 'Employer Contact', category: 'secondary' },
      { event: 'job_view', label: 'Job View', category: 'micro' },
      { event: 'save_job', label: 'Save Job', category: 'micro' },
      { event: 'resume_upload', label: 'Resume Upload', category: 'micro' },
    ],
  },
  local: {
    industry: 'local',
    label: 'Local Business',
    events: [
      { event: 'call', label: 'Phone Call', category: 'primary' },
      { event: 'direction', label: 'Get Directions', category: 'primary' },
      { event: 'booking', label: 'Booking', category: 'primary' },
      { event: 'form_submit', label: 'Form Submit', category: 'secondary' },
      { event: 'menu_view', label: 'Menu View', category: 'secondary' },
      { event: 'hours_view', label: 'Hours View', category: 'micro' },
      { event: 'photo_view', label: 'Photo View', category: 'micro' },
    ],
  },
  realEstate: {
    industry: 'realEstate',
    label: 'Real Estate',
    events: [
      { event: 'lead_form', label: 'Lead Form', category: 'primary' },
      { event: 'book_viewing', label: 'Book Viewing', category: 'primary' },
      { event: 'call', label: 'Phone Call', category: 'primary' },
      { event: 'save_listing', label: 'Save Listing', category: 'secondary' },
      { event: 'mortgage_calc', label: 'Mortgage Calculator', category: 'secondary' },
      { event: 'photo_gallery', label: 'Photo Gallery', category: 'micro' },
      { event: 'share_listing', label: 'Share Listing', category: 'micro' },
    ],
  },
  restaurant: {
    industry: 'restaurant',
    label: 'Restaurant / Food',
    events: [
      { event: 'reservation', label: 'Reservation', category: 'primary' },
      { event: 'order_online', label: 'Order Online', category: 'primary' },
      { event: 'call', label: 'Phone Call', category: 'primary' },
      { event: 'menu_view', label: 'Menu View', category: 'secondary' },
      { event: 'delivery_start', label: 'Delivery Start', category: 'secondary' },
      { event: 'hours_view', label: 'Hours View', category: 'micro' },
    ],
  },
  nonprofit: {
    industry: 'nonprofit',
    label: 'Non-profit',
    events: [
      { event: 'donate', label: 'Donate', valueParam: 'value', category: 'primary' },
      { event: 'volunteer', label: 'Volunteer', category: 'primary' },
      { event: 'newsletter_sub', label: 'Newsletter Subscribe', category: 'primary' },
      { event: 'petition_sign', label: 'Petition Sign', category: 'secondary' },
      { event: 'share', label: 'Share', category: 'secondary' },
      { event: 'story_read', label: 'Story Read', category: 'micro' },
    ],
  },
  government: {
    industry: 'government',
    label: 'Government',
    events: [
      { event: 'form_submit', label: 'Form Submit', category: 'primary' },
      { event: 'permit_apply', label: 'Permit Apply', category: 'primary' },
      { event: 'pay_fee', label: 'Pay Fee', valueParam: 'value', category: 'secondary' },
      { event: 'info_found', label: 'Info Found', category: 'micro' },
    ],
  },
  portfolio: {
    industry: 'portfolio',
    label: 'Portfolio',
    events: [
      { event: 'contact_form', label: 'Contact Form', category: 'primary' },
      { event: 'hire_click', label: 'Hire Click', category: 'primary' },
      { event: 'email_click', label: 'Email Click', category: 'primary' },
      { event: 'download_cv', label: 'Download CV', category: 'secondary' },
      { event: 'case_study_view', label: 'Case Study View', category: 'micro' },
    ],
  },
  media: {
    industry: 'media',
    label: 'Media',
    events: [
      { event: 'subscription', label: 'Subscription', valueParam: 'value', category: 'primary' },
      { event: 'video_play', label: 'Video Play', category: 'primary' },
      { event: 'newsletter_sub', label: 'Newsletter Subscribe', category: 'secondary' },
      { event: 'share', label: 'Share', category: 'secondary' },
      { event: 'article_complete', label: 'Article Complete', category: 'micro' },
    ],
  },
  general: {
    industry: 'general',
    label: 'General',
    events: [
      { event: 'contact_form', label: 'Contact Form', category: 'primary' },
      { event: 'newsletter_sub', label: 'Newsletter Subscribe', category: 'secondary' },
      { event: 'page_view', label: 'Page View', category: 'micro' },
    ],
  },
};

export function getConversionPack(industry: Industry): ConversionPack {
  return CONVERSION_PACKS[industry] ?? CONVERSION_PACKS.general;
}

export function getPrimaryEvents(pack: ConversionPack): ConversionEvent[] {
  return pack.events.filter(e => e.category === 'primary');
}

export function getSecondaryEvents(pack: ConversionPack): ConversionEvent[] {
  return pack.events.filter(e => e.category === 'secondary');
}

export function getMicroConversions(pack: ConversionPack): ConversionEvent[] {
  return pack.events.filter(e => e.category === 'micro');
}

export function mapToGA4Events(pack: ConversionPack, ga4EventNames: string[]): ConversionEvent[] {
  const ga4Set = new Set(ga4EventNames);
  return pack.events.filter(e => ga4Set.has(e.event));
}
