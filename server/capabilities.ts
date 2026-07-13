// server/capabilities.ts
import { CMS_DESCRIPTORS } from '@seesby/types';
import type { FingerprintResult } from '@seesby/fingerprint';

export function deriveCapabilities(fp: FingerprintResult, conn: Record<string, boolean>): string[] {
	const caps: string[] = ['cms.any'];
	caps.push(`cms.${fp.cms.value}`);
	caps.push(...CMS_DESCRIPTORS[fp.cms.value].capabilities.map((c) => `cms.cap.${c}`));
	if (conn.gsc)       caps.push('gsc');
	if (conn.ga4)       caps.push('ga4');
	if (conn.gbp)       caps.push('gbp');
	if (conn.bing)      caps.push('bing');
	if (conn.backlinks) caps.push('backlinks');
	return caps;
}
