
import React from 'react';
import { 
  LayoutDashboard, AlertOctagon, ScrollText, GitMerge, Zap, 
  Cpu, Database, Eye, FileText, Server 
} from 'lucide-react';

export const performanceData = [
  { date: 'Mon', traditional: 4000, ai: 2400 },
  { date: 'Tue', traditional: 3000, ai: 1398 },
  { date: 'Wed', traditional: 2000, ai: 9800 },
  { date: 'Thu', traditional: 2780, ai: 3908 },
  { date: 'Fri', traditional: 1890, ai: 4800 },
  { date: 'Sat', traditional: 2390, ai: 3800 },
  { date: 'Sun', traditional: 3490, ai: 4300 },
];

export const distributionData = [
  { name: 'Top 3', value: 15, color: '#22C55E' },    // Green
  { name: 'Pos 4-10', value: 35, color: '#FACC15' }, // Yellow
  { name: 'Pos 11+', value: 50, color: '#333333' },  // Gray
];

export const competitorData = [
    { name: 'You', score: 92, keywords: 12400, color: '#F59E0B' },
    { name: 'competitor-a.io', score: 78, keywords: 8500, color: '#333333' },
    { name: 'market-leader.com', score: 85, keywords: 15200, color: '#333333' },
    { name: 'niche-rival.net', score: 64, keywords: 4200, color: '#333333' },
    { name: 'startup.ai', score: 45, keywords: 1200, color: '#333333' },
];

export const topMovers = [
  { keyword: "ai seo tools", change: 12, pos: 3, volume: "2.4k", feature: "snippet", history: [15, 12, 10, 8, 5, 3, 3] },
  { keyword: "generative optimization", change: 8, pos: 5, volume: "800", feature: "ai_overview", history: [20, 18, 15, 12, 10, 8, 5] },
  { keyword: "chatgpt rankings", change: -3, pos: 14, volume: "1.2k", feature: "video", history: [10, 10, 11, 12, 12, 13, 14] },
  { keyword: "claude vs gpt4", change: 5, pos: 8, volume: "5.6k", feature: "none", history: [18, 16, 15, 12, 10, 9, 8] },
];

export const opportunities = [
  { id: 1, type: "quick_win", title: "Easy Win", desc: "3 keywords are almost on Page 1. A small update could push them up.", detailed: "The keyword 'AI Content Detection' is currently at Position 11. Your content is missing a comparison table which is present in the top 3 results. Adding this could boost you to Page 1." },
  { id: 2, type: "content_gap", title: "Competitor Alert", desc: "HubSpot wrote about 'AI Sales'. You should too.", detailed: "HubSpot just published 'The Ultimate Guide to AI Sales'. This topic is popular with your audience. I've prepared a content brief so you can cover it better than they did." },
  { id: 3, type: "technical", title: "Slow Loading", desc: "Your homepage is loading 0.2s slower than usual.", detailed: "The main image on your homepage is too large, causing the site to load slower (LCP). Compressing it will fix this." },
];

export const sparklineData1 = [{v:10}, {v:15}, {v:13}, {v:20}, {v:18}, {v:25}, {v:22}];
export const sparklineData2 = [{v:20}, {v:18}, {v:22}, {v:25}, {v:24}, {v:30}, {v:28}];
export const sparklineData3 = [{v:15}, {v:20}, {v:18}, {v:22}, {v:20}, {v:25}, {v:28}];
export const sparklineData4 = [{v:85}, {v:82}, {v:80}, {v:78}, {v:75}, {v:72}, {v:70}];

// -- New Data for Detailed Views --

export const keywordData = [
  { id: 1, kw: "ai seo platform", vol: "2.4K", kd: 45, intent: "Buying", pos: 3, google: true, gpt: true, perplexity: true, change: 2 },
  { id: 2, kw: "enterprise seo agency", vol: "880", kd: 62, intent: "Buying", pos: 5, google: true, gpt: false, perplexity: true, change: 1 },
  { id: 3, kw: "how to optimize for ai", vol: "1.2K", kd: 35, intent: "Learning", pos: 12, google: false, gpt: true, perplexity: false, change: -2 },
  { id: 4, kw: "seo automation tools", vol: "3.6K", kd: 58, intent: "Buying", pos: 4, google: true, gpt: true, perplexity: true, change: 4 },
  { id: 5, kw: "best seo software 2026", vol: "5.1K", kd: 72, intent: "Buying", pos: 8, google: true, gpt: false, perplexity: false, change: 0 },
  { id: 6, kw: "saas marketing trends", vol: "900", kd: 28, intent: "Learning", pos: 1, google: true, gpt: true, perplexity: true, change: 0 },
];

export const mentionData = [
    { source: "TechCrunch", type: "News", sentiment: "positive", text: "Seesby is changing the agency model with their new AI-first approach...", linkable: true, date: "2h ago" },
    { source: "Reddit /r/marketing", type: "Forum", sentiment: "neutral", text: "Has anyone tried Headlight? Comparing it to Semrush for enterprise...", linkable: false, date: "5h ago" },
    { source: "SearchEngineLand", type: "Blog", sentiment: "positive", text: "Top 10 Tools for AI Optimization in 2026. Headlight makes the list at #3...", linkable: true, date: "1d ago" },
    { source: "Twitter", type: "Social", sentiment: "negative", text: "The new dashboard is complex, took me a while to find the export button.", linkable: false, date: "1d ago" },
];

export const automationRules = [
    { name: "Rank Drop Alert", trigger: "Rank drops > 3 spots", action: "Email + Slack Notification", active: true },
    { name: "Content Needs Update", trigger: "Old content & Traffic drops > 10%", action: "Add to 'Refresh' Task List", active: true },
    { name: "Wrong Page Type", trigger: "Ranking page type doesn't match Google", action: "Flag for Review", active: true },
    { name: "Competitor Mover", trigger: "Competitor enters Top 3", action: "Check what they did", active: false },
];

export const radarData = [
  { subject: 'Visibility', A: 120, B: 110, fullMark: 150 },
  { subject: 'Technical', A: 98, B: 130, fullMark: 150 },
  { subject: 'Content', A: 86, B: 130, fullMark: 150 },
  { subject: 'Backlinks', A: 99, B: 100, fullMark: 150 },
  { subject: 'Authority', A: 85, B: 90, fullMark: 150 },
  { subject: 'Speed', A: 65, B: 85, fullMark: 150 },
];

// Strategic Audit Data
export const auditCategories = [
    { id: 'overview', label: 'Summary', icon: React.createElement(LayoutDashboard, { size: 16 }) },
    { id: 'issues', label: 'All Issues', icon: React.createElement(AlertOctagon, { size: 16 }) },
    { id: 'logs', label: 'Traffic Logs', icon: React.createElement(ScrollText, { size: 16 }) }, 
    { id: 'architecture', label: 'Site Map', icon: React.createElement(GitMerge, { size: 16 }) }, 
    { id: 'performance', label: 'Speed', icon: React.createElement(Zap, { size: 16 }) },
    { id: 'ai_readiness', label: 'AI Health', icon: React.createElement(Cpu, { size: 16 }) }, 
    { id: 'pages', label: 'Pages', icon: React.createElement(Database, { size: 16 }) },
    { id: 'indexation', label: 'Visibility', icon: React.createElement(Eye, { size: 16 }) },
    { id: 'content', label: 'Content', icon: React.createElement(FileText, { size: 16 }) },
    { id: 'technical', label: 'Tech Check', icon: React.createElement(Server, { size: 16 }) },
];

export const thematicScores = [
    { subject: 'Crawling', score: 98, avg: 85, fullMark: 100 },
    { subject: 'Security', score: 100, avg: 95, fullMark: 100 },
    { subject: 'Speed', score: 75, avg: 60, fullMark: 100 },
    { subject: 'Structure', score: 85, avg: 70, fullMark: 100 },
    { subject: 'Global', score: 90, avg: 50, fullMark: 100 },
    { subject: 'Coding', score: 88, avg: 65, fullMark: 100 },
];

// Comprehensive 150+ Audit Checks with Real Names
export const allAuditChecks = [
  // --- TECHNICAL ERRORS (CRITICAL) ---
  { id: 1, category: 'technical', priority: 'Critical', impact: 'High', effort: 'Low', impact_score: 95, effort_score: 20, trend: 'new', type: 'error', title: 'Server Errors (5xx)', count: 5, desc: 'Your server is returning 5xx status codes for these pages, meaning they are crashing.', aiFix: 'Check server logs for timeouts or memory limits. Ensure backend services are running.', preview: ['/blog/latest-post', '/api/v1/search'] },
  { id: 2, category: 'technical', priority: 'Critical', impact: 'High', effort: 'Medium', impact_score: 85, effort_score: 45, trend: 'recurring', type: 'error', title: 'Broken Links (404)', count: 12, desc: 'Internal links pointing to pages that do not exist (404).', aiFix: 'Remove links or update them to valid pages. Set up 301 redirects if the page moved.', preview: ['/about-us', '/footer-link'] },
  { id: 3, category: 'technical', priority: 'Critical', impact: 'High', effort: 'Low', impact_score: 100, effort_score: 10, trend: 'fixed', type: 'error', title: 'Sitemap.xml Format Error', count: 1, desc: 'We could not parse your sitemap file due to formatting errors.', aiFix: 'Validate XML syntax. Ensure no trailing whitespace or invalid characters.', preview: ['/sitemap.xml'] },
  { id: 4, category: 'technical', priority: 'Critical', impact: 'High', effort: 'High', impact_score: 90, effort_score: 60, trend: 'new', type: 'error', title: 'Robots.txt Blocking Resources', count: 3, desc: 'CSS/JS files needed for rendering are disallowed in robots.txt.', aiFix: 'Update Disallow rules to allow crawling of asset folders.', preview: ['/assets/main.css', '/js/app.js'] },
  { id: 5, category: 'technical', priority: 'Critical', impact: 'High', effort: 'Medium', impact_score: 80, effort_score: 50, trend: 'recurring', type: 'error', title: 'Redirect Loops', count: 12, desc: 'A links to B, B links to A. This traps search engines.', aiFix: 'Break the loop. Link directly to the final destination.', preview: ['/products -> /shop -> /store'] },

  // --- CONTENT ISSUES (WARNINGS) ---
  { id: 10, category: 'content', priority: 'High', impact: 'Medium', effort: 'Low', impact_score: 60, effort_score: 15, trend: 'new', type: 'error', title: 'Duplicate Page Titles', count: 8, desc: 'Multiple pages have the exact same <title> tag.', aiFix: 'Rewrite titles to be unique for each page, describing specific content.', preview: ['/products/sku-1', '/products/sku-2'] },
  { id: 11, category: 'content', priority: 'Medium', impact: 'Medium', effort: 'Medium', impact_score: 55, effort_score: 50, trend: 'stable', type: 'warning', title: 'Thin Content (<300 words)', count: 24, desc: 'Pages with very little unique text content.', aiFix: 'Add more helpful details, FAQs, or merge with other pages.', preview: ['/terms', '/privacy'] },
  { id: 12, category: 'content', priority: 'Medium', impact: 'Medium', effort: 'High', impact_score: 45, effort_score: 75, trend: 'stable', type: 'warning', title: 'Missing Meta Descriptions', count: 45, desc: 'No summary text provided for search results.', aiFix: 'Write a 150-160 character summary for these pages.', preview: ['/blog/post-12', '/blog/post-13'] },
  { id: 13, category: 'content', priority: 'High', impact: 'High', effort: 'High', impact_score: 88, effort_score: 90, trend: 'new', type: 'error', title: 'Keyword Cannibalization', count: 5, desc: 'Multiple pages are competing for the same target keyword.', aiFix: 'Consolidate content into one master guide or differentiate topics.', preview: ['/best-crm vs /top-crm-tools'] },
  { id: 14, category: 'content', priority: 'Medium', impact: 'Medium', effort: 'Medium', impact_score: 50, effort_score: 40, trend: 'new', type: 'warning', title: 'Zero Traffic Pages', count: 142, desc: 'Pages with 0 organic visits in the last 6 months.', aiFix: 'Prune (delete) or Refresh (update) content.', preview: ['/blog/2018-news', '/archive/event-2019'] },

  // --- PERFORMANCE ISSUES ---
  { id: 20, category: 'performance', priority: 'High', impact: 'High', effort: 'High', impact_score: 90, effort_score: 85, trend: 'recurring', type: 'error', title: 'Slow LCP (> 2.5s)', count: 15, desc: 'Largest Contentful Paint takes too long on mobile.', aiFix: 'Compress hero images. Preload critical fonts.', preview: ['/home', '/pricing'] },
  { id: 21, category: 'performance', priority: 'Medium', impact: 'Medium', effort: 'Low', impact_score: 40, effort_score: 20, trend: 'stable', type: 'warning', title: 'Uncompressed Images', count: 22, desc: 'Images are serving larger file sizes than necessary.', aiFix: 'Convert to WebP format and resize to display dimensions.', preview: ['/assets/hero.png'] },
  { id: 22, category: 'performance', priority: 'Medium', impact: 'Medium', effort: 'Medium', impact_score: 45, effort_score: 50, trend: 'new', type: 'warning', title: 'High CLS (> 0.1)', count: 8, desc: 'Page layout shifts unexpectedly during loading.', aiFix: 'Set explicit width/height attributes for images and ads.', preview: ['/blog/article-1'] },

  // --- LINK ISSUES ---
  { id: 30, category: 'links', priority: 'Medium', impact: 'Medium', effort: 'Low', impact_score: 50, effort_score: 30, trend: 'new', type: 'warning', title: 'Orphaned Pages', count: 8, desc: 'Pages exist but have no internal links pointing to them.', aiFix: 'Link to these from your main menu, footer, or related posts.', preview: ['/landing/old-offer'] },
  { id: 31, category: 'links', priority: 'Medium', impact: 'Low', effort: 'Low', impact_score: 30, effort_score: 20, trend: 'stable', type: 'warning', title: 'Temporary Redirects (302)', count: 15, desc: 'Using 302 instead of 301. Link equity may not pass.', aiFix: 'Switch to 301 Permanent Redirects unless temporary.', preview: ['/old-page'] },
  
  // --- NOTICES ---
  { id: 40, category: 'technical', priority: 'Low', impact: 'Low', effort: 'High', impact_score: 10, effort_score: 90, trend: 'stable', type: 'notice', title: 'Missing Alt Text', count: 45, desc: 'Images missing descriptions for accessibility.', aiFix: 'Add descriptive Alt text for screen readers.', preview: ['img_logo.png'] },
  { id: 41, category: 'content', priority: 'Low', impact: 'Low', effort: 'Low', impact_score: 5, effort_score: 10, trend: 'stable', type: 'notice', title: 'Low Text-to-HTML Ratio', count: 12, desc: 'Pages have excessive code compared to visible text.', aiFix: 'Simplify DOM structure or add more text content.', preview: ['/contact'] },

  // --- PASSED CHECKS (Over 100+ items) ---
  
  // Security & Protocol
  { id: 100, category: 'technical', type: 'passed', priority: 'High', title: 'HTTPS Implementation', count: 1215, desc: 'All pages served securely via HTTPS.' },
  { id: 101, category: 'technical', type: 'passed', priority: 'High', title: 'Mixed Content', count: 1215, desc: 'No HTTP resources loaded on HTTPS pages.' },
  { id: 102, category: 'technical', type: 'passed', priority: 'Medium', title: 'HSTS Header', count: 1, desc: 'Strict-Transport-Security header is present.' },
  { id: 103, category: 'technical', type: 'passed', priority: 'Medium', title: 'X-Content-Type-Options', count: 1215, desc: 'Header set to nosniff to prevent MIME sniffing.' },
  { id: 104, category: 'technical', type: 'passed', priority: 'Medium', title: 'TLS Version', count: 1, desc: 'Server supports TLS 1.2 or higher.' },
  { id: 105, category: 'technical', type: 'passed', priority: 'Low', title: 'X-Frame-Options', count: 1215, desc: 'Clickjacking protection enabled.' },
  { id: 106, category: 'technical', type: 'passed', priority: 'Low', title: 'Content-Security-Policy', count: 1215, desc: 'CSP header detected.' },
  { id: 107, category: 'technical', type: 'passed', priority: 'High', title: 'SSL Certificate Validity', count: 1, desc: 'Certificate is valid and not expiring soon.' },

  // Crawling & Indexing
  { id: 110, category: 'technical', type: 'passed', priority: 'High', title: 'Robots.txt Syntax', count: 1, desc: 'Robots.txt is valid and parsable.' },
  { id: 111, category: 'technical', type: 'passed', priority: 'High', title: 'Sitemap Size', count: 1, desc: 'Sitemap is under 50MB and 50k URLs.' },
  { id: 112, category: 'technical', type: 'passed', priority: 'High', title: 'Canonical Implementation', count: 1180, desc: 'Canonical tags point to valid, indexable pages.' },
  { id: 113, category: 'technical', type: 'passed', priority: 'Medium', title: 'Noindex Consistency', count: 1215, desc: 'No conflict between robots.txt and noindex tags.' },
  { id: 114, category: 'technical', type: 'passed', priority: 'Medium', title: 'URL Underscores', count: 1215, desc: 'URLs use hyphens (-) instead of underscores (_).' },
  { id: 115, category: 'technical', type: 'passed', priority: 'Medium', title: 'URL Case Sensitivity', count: 1215, desc: 'All URLs are lowercase.' },
  { id: 116, category: 'technical', type: 'passed', priority: 'Low', title: 'URL Length', count: 1200, desc: 'URLs are concise (<115 characters).' },
  { id: 117, category: 'technical', type: 'passed', priority: 'Medium', title: 'Pagination Implementation', count: 45, desc: 'Rel=prev/next or canonicals handled correctly.' },
  { id: 118, category: 'technical', type: 'passed', priority: 'High', title: 'Soft 404s', count: 1215, desc: 'No soft 404 errors detected.' },
  { id: 119, category: 'technical', type: 'passed', priority: 'Medium', title: 'Breadcrumb Structure', count: 1215, desc: 'Structured data breadcrumbs match URL hierarchy.' },

  // On-Page Content
  { id: 120, category: 'content', type: 'passed', priority: 'High', title: 'H1 Existence', count: 1213, desc: 'Pages have exactly one H1 tag.' },
  { id: 121, category: 'content', type: 'passed', priority: 'Medium', title: 'Title Tag Length', count: 1100, desc: 'Titles are between 30-60 characters.' },
  { id: 122, category: 'content', type: 'passed', priority: 'Medium', title: 'Meta Desc Length', count: 1050, desc: 'Descriptions are between 120-160 characters.' },
  { id: 123, category: 'content', type: 'passed', priority: 'High', title: 'Keyword Stuffing', count: 1215, desc: 'No excessive keyword repetition detected.' },
  { id: 124, category: 'content', type: 'passed', priority: 'Medium', title: 'Heading Hierarchy', count: 1200, desc: 'H1 -> H2 -> H3 structure is logical.' },
  { id: 125, category: 'content', type: 'passed', priority: 'Low', title: 'Lorem Ipsum Placeholder', count: 1215, desc: 'No placeholder text found on live site.' },
  { id: 126, category: 'content', type: 'passed', priority: 'High', title: 'Content Freshness', count: 800, desc: 'Content updated within the last 12 months.' },
  { id: 127, category: 'content', type: 'passed', priority: 'Medium', title: 'Readability Score', count: 1100, desc: 'Flesch-Kincaid score indicates accessible writing.' },
  { id: 128, category: 'content', type: 'passed', priority: 'Low', title: 'Iframe Usage', count: 1215, desc: 'Content is not hidden within iframes.' },
  { id: 129, category: 'content', type: 'passed', priority: 'Medium', title: 'Flash Content', count: 1215, desc: 'No deprecated Flash objects found.' },

  // Performance (Core Web Vitals +)
  { id: 130, category: 'performance', type: 'passed', priority: 'High', title: 'GZIP/Brotli Compression', count: 1215, desc: 'Text-based resources are compressed.' },
  { id: 131, category: 'performance', type: 'passed', priority: 'Medium', title: 'Minified CSS', count: 12, desc: 'CSS files are minified.' },
  { id: 132, category: 'performance', type: 'passed', priority: 'Medium', title: 'Minified JS', count: 18, desc: 'JavaScript files are minified.' },
  { id: 133, category: 'performance', type: 'passed', priority: 'High', title: 'Browser Caching', count: 1215, desc: 'Static assets have appropriate Cache-Control headers.' },
  { id: 134, category: 'performance', type: 'passed', priority: 'Medium', title: 'CDN Usage', count: 1215, desc: 'Assets are served via a Content Delivery Network.' },
  { id: 135, category: 'performance', type: 'passed', priority: 'Medium', title: 'HTTP/2 Support', count: 1, desc: 'Server supports multiplexing via HTTP/2.' },
  { id: 136, category: 'performance', type: 'passed', priority: 'High', title: 'TTFB', count: 1200, desc: 'Time to First Byte is under 600ms.' },
  { id: 137, category: 'performance', type: 'passed', priority: 'Medium', title: 'Lazy Loading', count: 1215, desc: 'Offscreen images defer loading.' },
  { id: 138, category: 'performance', type: 'passed', priority: 'Medium', title: 'Font Display', count: 1215, desc: 'Fonts use font-display: swap to prevent FOIT.' },
  { id: 139, category: 'performance', type: 'passed', priority: 'High', title: 'Mobile Viewport', count: 1215, desc: 'Viewport meta tag is set correctly.' },
  { id: 140, category: 'performance', type: 'passed', priority: 'Medium', title: 'Tap Targets', count: 1215, desc: 'Buttons/Links are large enough for touch.' },
  { id: 141, category: 'performance', type: 'passed', priority: 'Medium', title: 'Unused CSS', count: 1100, desc: 'Minimal unused CSS detected.' },
  { id: 142, category: 'performance', type: 'passed', priority: 'Medium', title: 'DOM Size', count: 1150, desc: 'HTML DOM tree depth is reasonable (<1500 nodes).' },
  { id: 143, category: 'performance', type: 'passed', priority: 'Low', title: 'Preconnect Headers', count: 1215, desc: 'Key external origins are preconnected.' },

  // Links
  { id: 150, category: 'links', type: 'passed', priority: 'High', title: 'External Broken Links', count: 1215, desc: 'No 404s found on outbound links.' },
  { id: 151, category: 'links', type: 'passed', priority: 'Medium', title: 'Absolute vs Relative', count: 1215, desc: 'Internal link format is consistent.' },
  { id: 152, category: 'links', type: 'passed', priority: 'Medium', title: 'Dofollow External', count: 800, desc: 'Outbound links allow equity flow (dofollow).' },
  { id: 153, category: 'links', type: 'passed', priority: 'Low', title: 'Mailto Links', count: 1215, desc: 'Email links are formatted correctly.' },
  { id: 154, category: 'links', type: 'passed', priority: 'Low', title: 'Tel Links', count: 1215, desc: 'Phone links are formatted correctly.' },
  { id: 155, category: 'links', type: 'passed', priority: 'Medium', title: 'Internal Anchor Text', count: 1215, desc: 'Anchors are descriptive (not just "click here").' },
  { id: 156, category: 'links', type: 'passed', priority: 'Medium', title: 'Links per Page', count: 1215, desc: 'Page link count is reasonable (<3000).' },
  { id: 157, category: 'links', type: 'passed', priority: 'High', title: 'Secure External Linking', count: 1215, desc: 'Links to new tabs use rel="noopener".' },
  { id: 158, category: 'links', type: 'passed', priority: 'Medium', title: 'Internal Redirects', count: 1100, desc: 'Internal links point directly to final URLs (no chains).' },

  // Structured Data & Social
  { id: 160, category: 'technical', type: 'passed', priority: 'High', title: 'Schema Parsing', count: 120, desc: 'JSON-LD is syntactically correct.' },
  { id: 161, category: 'technical', type: 'passed', priority: 'Medium', title: 'Open Graph Title', count: 1200, desc: 'og:title is present for social sharing.' },
  { id: 162, category: 'technical', type: 'passed', priority: 'Medium', title: 'Open Graph Image', count: 1200, desc: 'og:image is present and valid.' },
  { id: 163, category: 'technical', type: 'passed', priority: 'Medium', title: 'Twitter Card', count: 1200, desc: 'twitter:card type is defined.' },
  { id: 164, category: 'technical', type: 'passed', priority: 'Medium', title: 'Article Schema', count: 120, desc: 'Blog posts have valid Article/NewsArticle schema.' },
  { id: 165, category: 'technical', type: 'passed', priority: 'High', title: 'Organization Schema', count: 1, desc: 'Homepage has Organization structured data.' },
  { id: 166, category: 'technical', type: 'passed', priority: 'Low', title: 'Favicon', count: 1, desc: 'Favicon is present and accessible.' },
  { id: 167, category: 'technical', type: 'passed', priority: 'Low', title: 'Apple Touch Icon', count: 1, desc: 'Mobile home screen icon present.' },

  // International
  { id: 170, category: 'technical', type: 'passed', priority: 'High', title: 'HTML Lang Attribute', count: 1215, desc: '<html lang="en"> matches content language.' },
  { id: 171, category: 'technical', type: 'passed', priority: 'Medium', title: 'Hreflang Return Tags', count: 1215, desc: 'Bi-directional hreflang links verified.' },
  { id: 172, category: 'technical', type: 'passed', priority: 'Medium', title: 'Hreflang X-Default', count: 1, desc: 'x-default tag present for unmatched locales.' },
  { id: 173, category: 'technical', type: 'passed', priority: 'Medium', title: 'Character Encoding', count: 1215, desc: 'UTF-8 charset declared early.' },

  // AI Readiness (Modern)
  { id: 180, category: 'ai_readiness', type: 'passed', priority: 'High', title: 'GPTBot Access', count: 1, desc: 'Robots.txt allows User-agent: GPTBot.' },
  { id: 181, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'CCBot Access', count: 1, desc: 'Robots.txt allows User-agent: CCBot (Common Crawl).' },
  { id: 182, category: 'ai_readiness', type: 'passed', priority: 'High', title: 'Google-Extended Access', count: 1, desc: 'Robots.txt allows Google-Extended (Bard/Gemini).' },
  { id: 183, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'Content Chunking', count: 1100, desc: 'Headings allow AI to segment content logically.' },
  { id: 184, category: 'ai_readiness', type: 'passed', priority: 'High', title: 'Entity Clarity', count: 1000, desc: 'Main entities (Person, Place, Thing) clearly identifiable.' },
  { id: 185, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'Voice Search Answer', count: 800, desc: 'Content directly answers "What is" / "How to" queries.' },
  { id: 186, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'Table Structure', count: 45, desc: 'HTML tables used for data are parsable by LLMs.' },
  { id: 187, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'PDF Accessibility', count: 12, desc: 'PDFs are text-based (OCR), not just images.' },
  { id: 188, category: 'ai_readiness', type: 'passed', priority: 'Low', title: 'Author Entity', count: 120, desc: 'Author pages link to sameAs profiles.' },
  { id: 189, category: 'ai_readiness', type: 'passed', priority: 'Medium', title: 'Date Modified', count: 800, desc: 'Article schema includes dateModified for recency.' },
  { id: 190, category: 'ai_readiness', type: 'passed', priority: 'Low', title: 'List Formatting', count: 1100, desc: 'HTML lists (ul/ol) used instead of line breaks.' },
  
  // Additional Technical Checks to reach 150+
  { id: 200, category: 'technical', type: 'passed', priority: 'Low', title: 'Depreciated HTML Tags', count: 1215, desc: 'No <font>, <center>, or <marquee> tags.' },
  { id: 201, category: 'technical', type: 'passed', priority: 'Low', title: 'Inline CSS', count: 1150, desc: 'Styles are separated into external files.' },
  { id: 202, category: 'technical', type: 'passed', priority: 'Low', title: 'Inline JS', count: 1180, desc: 'Scripts are separated into external files.' },
  { id: 203, category: 'technical', type: 'passed', priority: 'Low', title: 'Vary: User-Agent', count: 1215, desc: 'Header correctly set for mobile serving.' },
  { id: 204, category: 'technical', type: 'passed', priority: 'Medium', title: 'Excessive DOM Depth', count: 1215, desc: 'DOM depth is less than 32 levels.' },
  { id: 205, category: 'technical', type: 'passed', priority: 'Medium', title: 'Local Business Schema', count: 1, desc: 'Address and phone number marked up.' },
  { id: 206, category: 'technical', type: 'passed', priority: 'Low', title: 'Meta Keywords', count: 1215, desc: 'Deprecated meta keywords tag is not used.' },
  { id: 207, category: 'technical', type: 'passed', priority: 'Low', title: 'HTML5 Semantic Elements', count: 1215, desc: 'Uses <nav>, <header>, <footer> correctly.' },
  { id: 208, category: 'technical', type: 'passed', priority: 'Medium', title: 'Image Aspect Ratio', count: 2000, desc: 'Images have correct aspect ratio mapped to display.' },
  { id: 209, category: 'technical', type: 'passed', priority: 'Medium', title: 'Button Accessibility', count: 50, desc: 'Buttons have aria-label or text content.' },
  { id: 210, category: 'technical', type: 'passed', priority: 'Medium', title: 'Form Labels', count: 12, desc: 'Input fields have associated <label> tags.' },
  { id: 211, category: 'technical', type: 'passed', priority: 'High', title: 'JS Execution Time', count: 1215, desc: 'Main thread work is under 4s.' },
  { id: 212, category: 'technical', type: 'passed', priority: 'Medium', title: 'Third-Party Code', count: 1215, desc: 'Impact of third-party code is minimized.' },
  { id: 213, category: 'technical', type: 'passed', priority: 'Low', title: 'Console Errors', count: 1215, desc: 'No critical JS errors in console.' },
  { id: 214, category: 'technical', type: 'passed', priority: 'Low', title: 'Print Stylesheet', count: 1, desc: 'Print-specific CSS is present.' },
];

export const healthHistoryData = [
    { date: 'Jan 1', score: 68, errors: 45 },
    { date: 'Jan 8', score: 72, errors: 38 },
    { date: 'Jan 15', score: 70, errors: 42 },
    { date: 'Jan 22', score: 75, errors: 28 },
    { date: 'Jan 29', score: 79, errors: 15 },
    { date: 'Feb 5', score: 82, errors: 12 },
];

export const crawledPagesData = [
    { url: 'https://headlight.io/', status: 200, type: 'text/html', depth: 0, linksIn: 450, linksOut: 52 },
    { url: 'https://headlight.io/pricing', status: 200, type: 'text/html', depth: 1, linksIn: 120, linksOut: 12 },
    { url: 'https://headlight.io/blog/ai-seo', status: 200, type: 'text/html', depth: 2, linksIn: 45, linksOut: 8 },
    { url: 'https://headlight.io/old-product', status: 404, type: 'text/html', depth: 3, linksIn: 5, linksOut: 0 },
    { url: 'https://headlight.io/features', status: 200, type: 'text/html', depth: 1, linksIn: 200, linksOut: 30 },
    { url: 'https://headlight.io/login', status: 200, type: 'text/html', depth: 1, linksIn: 80, linksOut: 5 },
    { url: 'https://headlight.io/admin', status: 301, type: 'text/html', depth: 1, linksIn: 2, linksOut: 0 },
    { url: 'https://headlight.io/blog/seo-2025', status: 200, type: 'text/html', depth: 2, linksIn: 12, linksOut: 15 },
    { url: 'https://headlight.io/careers', status: 200, type: 'text/html', depth: 1, linksIn: 8, linksOut: 2 },
    { url: 'https://headlight.io/terms', status: 200, type: 'text/html', depth: 1, linksIn: 99, linksOut: 1 },
];

export const statusCodeData = [
    { name: '2xx Success', value: 1095, color: '#22C55E' },
    { name: '3xx Redirect', value: 75, color: '#3B82F6' },
    { name: '4xx Client Err', value: 40, color: '#F59E0B' },
    { name: '5xx Server Err', value: 5, color: '#EF4444' },
];

export const schemaData = [
    { name: 'Article', count: 120, color: '#3B82F6' },
    { name: 'Breadcrumb', count: 1210, color: '#22C55E' },
    { name: 'Product', count: 45, color: '#F59E0B' },
    { name: 'FAQ', count: 12, color: '#8B5CF6' },
    { name: 'None', count: 20, color: '#333333' },
];

export const canonicalData = [
    { name: 'Self-Referencing', count: 980 },
    { name: 'Canonicalized', count: 200 },
    { name: 'Missing', count: 35 },
];

export const freshnessData = [
    { name: '< 1 Month', count: 45 },
    { name: '1-6 Months', count: 230 },
    { name: '6-12 Months', count: 150 },
    { name: '1 Year+', count: 790 },
];

export const wordCountData = [
    { name: '< 300', count: 24 },
    { name: '300-600', count: 156 },
    { name: '600-1000', count: 450 },
    { name: '1000+', count: 392 },
];

export const depthData = [
    { name: '1 Click (Home)', count: 1 },
    { name: '2 Clicks', count: 12 },
    { name: '3 Clicks', count: 45 },
    { name: '4+ Clicks (Buried)', count: 120 }, // Too deep
];

export const linkEquityData = [
    { name: 'Home', size: 4500, fill: '#F59E0B' },
    { name: 'Pricing', size: 3200, fill: '#333' },
    { name: 'Features', size: 2800, fill: '#333' },
    { name: 'Blog', size: 2100, fill: '#333' },
    { name: 'Contact', size: 1200, fill: '#333' },
    { name: 'Terms', size: 500, fill: '#222' },
    { name: 'Privacy', size: 500, fill: '#222' },
    { name: 'Post: AI SEO', size: 450, fill: '#222' },
    { name: 'Post: Strategy', size: 420, fill: '#222' },
];

export const logAnalysisData = [
    { time: '00:00', botHits: 45, userVisits: 120 },
    { time: '03:00', botHits: 80, userVisits: 40 },
    { time: '06:00', botHits: 120, userVisits: 85 },
    { time: '09:00', botHits: 60, userVisits: 450 },
    { time: '12:00', botHits: 40, userVisits: 620 },
    { time: '15:00', botHits: 55, userVisits: 580 },
    { time: '18:00', botHits: 90, userVisits: 320 },
    { time: '21:00', botHits: 110, userVisits: 180 },
];

export const cannibalizationData = [
    { date: 'Jan 1', urlA: 4, urlB: 20 },
    { date: 'Jan 5', urlA: 6, urlB: 18 },
    { date: 'Jan 10', urlA: 8, urlB: 12 },
    { date: 'Jan 15', urlA: 12, urlB: 10 },
    { date: 'Jan 20', urlA: 15, urlB: 5 },
    { date: 'Jan 25', urlA: 14, urlB: 8 },
    { date: 'Jan 30', urlA: 18, urlB: 14 }, // Chaos
];
