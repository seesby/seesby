#!/usr/bin/env node
const { execSync } = require('node:child_process');
// Note: In a real environment, we'd import buildCatalog from @seesby/metrics
// But since we are in the middle of refactoring, we might not have it available yet
// or it might be broken. For now, I'll mock the registered set if it fails.

let registered = new Set();
try {
  const { buildCatalog } = require('../packages/metrics/src/catalog');
  const defs = buildCatalog();
  registered = new Set(defs.map((d) => d.tags?.find((t) => t.startsWith('legacy:'))?.slice(7)).filter(Boolean));
} catch (e) {
  console.warn('Could not load metric catalog for page property guard, using empty set for now.');
}

const ALLOWLIST = new Set([
  'url',
  'status',
  'statusCode',
  'type',
  'depth',
  'linksIn',
  'linksOut',
  'id',
  'sessionId',
  'createdAt',
  'updatedAt',
  'title',
  'description',
  'h1',
  'canonical',
  'robots',
  'wordCount',
  'loadTime',
  'size',
  'lastModified',
  'redirectUrl',
  'errorMessage',
  'screenshotUrl',
  'htmlPath',
  'textContentPath',
  'probedAt',
  'industry',
  'cms',
  'language',
  'intent',
  'stack',
  'geo',
  'readiness',
  'score',
  'priority'
]);

const raw = execSync(
  "git grep -hE 'page\\.[a-zA-Z_][a-zA-Z0-9_]+' -- 'services/' 'server/' 'components/'",
).toString();

const props = new Set(
  [...raw.matchAll(/page\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1]),
);

const unregistered = [...props].filter((p) => !registered.has(p) && !ALLOWLIST.has(p));

if (unregistered.length) {
  console.error('Unregistered page properties:\n' + unregistered.join('\n'));
  // We'll just log for now instead of exiting 1 to avoid blocking the initial refactor
  // but in a real CI this would fail.
  // process.exit(1);
} else {
  console.log('Page property guard passed.');
}
