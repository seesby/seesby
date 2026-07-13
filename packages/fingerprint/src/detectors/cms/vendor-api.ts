// packages/fingerprint/src/detectors/cms/vendor-api.ts
import type { DetectorStep } from '../types';
import type { CmsKey } from '@seesby/types';

const PROBES: Array<{ cms: CmsKey; path: string; check: (r: Response) => Promise<boolean> }> = [
	{ cms: 'wordpress',   path: '/wp-json/wp/v2/posts?per_page=1',  check: async (r) => r.ok },
	{ cms: 'shopify',     path: '/products.json?limit=1',           check: async (r) => r.ok },
	{ cms: 'ghost',       path: '/ghost/api/content/posts/?key=X', check: async (r) => r.status === 401 || r.status === 200 },
	{ cms: 'webflow',     path: '/__webflow/version',               check: async (r) => r.ok },
	{ cms: 'magento',     path: '/rest/V1/storeConfigs',            check: async (r) => r.status === 401 || r.status === 200 },
];

export const detectCmsFromVendorApi: DetectorStep<CmsKey> = async (ctx) => {
	for (const probe of PROBES) {
		try {
			const r = await fetch(`https://${ctx.hostname}${probe.path}`, { signal: AbortSignal.timeout(2500) });
			if (await probe.check(r)) {
				return {
					value: probe.cms,
					confidence: 0.95,
					tier: 'T2',
					provider: `fingerprint.cms.${probe.cms}.api`,
					tags: ['source'],
				};
			}
		} catch { /* ignore */ }
	}
	return null;
};
