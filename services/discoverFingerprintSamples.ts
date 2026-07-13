export async function discoverFingerprintSamples(rootUrl: string): Promise<string[]> {
  const samples = new Set<string>();

  try {
    samples.add(new URL(rootUrl).toString());
  } catch {
    return [];
  }

  try {
    const sitemapUrl = new URL('/sitemap.xml', rootUrl).toString();
    const response = await fetch(sitemapUrl, {
      headers: { 'user-agent': 'SeesbyFingerprint/1.0' },
    });

    if (response.ok) {
      const xml = await response.text();
      const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
      const picks = pickRepresentativeUrls(urls);
      for (const url of picks) {
        samples.add(url);
        if (samples.size >= 10) break;
      }
    }
  } catch {
    // Best-effort only.
  }

  const fallbacks = ['/about', '/contact', '/products', '/services', '/blog', '/pricing'];
  for (const path of fallbacks) {
    if (samples.size >= 10) break;
    try {
      samples.add(new URL(path, rootUrl).toString());
    } catch {
      // Ignore malformed fallback resolution.
    }
  }

  return [...samples].slice(0, 10);
}

function pickRepresentativeUrls(urls: string[]): string[] {
  if (urls.length <= 7) return urls;

  const sorted = [...urls].sort((a, b) => depthOf(a) - depthOf(b));
  const first = sorted[0];
  const middle = sorted[Math.floor(sorted.length / 2)];
  const last = sorted[sorted.length - 1];
  const deep = [...sorted].reverse().find((url) => depthOf(url) >= 3);

  const picks = new Set<string>([first, middle, last, deep].filter(Boolean) as string[]);
  for (const url of sorted) {
    if (picks.size >= 7) break;
    picks.add(url);
  }

  return [...picks];
}

function depthOf(url: string): number {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).length;
  } catch {
    return 0;
  }
}
