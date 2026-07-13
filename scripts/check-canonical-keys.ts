import { execSync } from 'node:child_process';

// Only genuinely-legacy identifiers that have been removed from the codebase.
// NOTE: identifiers like detectSiteType / CMSService / WQA_COLUMN_PRESETS /
// WqaSiteMetrics are intentionally part of the current data layer and must NOT
// be flagged, otherwise every production build is blocked.
const FORBIDDEN = [
  'LegacyWqaColumn',
  'getWqaColumnsLegacy',
  'getWqaDefaultVisibleColumnsLegacy',
];

const CMD = `git grep -nE "${FORBIDDEN.join('|')}" -- ':!scripts/check-canonical-keys.ts' ':!**/__tests__/fixtures/**' ':!**/CHANGELOG.md' ':!docs/**'`;

let hits = '';
try {
  hits = execSync(CMD, { encoding: 'utf8' });
} catch {
  // git grep exits non-zero when no matches are found
}

if (hits.trim().length > 0) {
  console.error('Legacy data-layer identifiers found. Migrate them before merging:\n');
  console.error(hits);
  process.exit(1);
}

console.log('\u2713 No legacy data-layer identifiers in source.');
