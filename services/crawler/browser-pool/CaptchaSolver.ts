// services/crawler/browser-pool/CaptchaSolver.ts
// ── CAPTCHA Detection & Solving ─────────────────────────────────────
//
// Handles CAPTCHA challenges encountered during browser-offload
// scraping. Supports detection of common CAPTCHA providers and
// multiple resolution strategies.
//
// Resolution order:
//   1. Audio STT (Whisper / Google STT) for audio CAPTCHAs
//   2. Fingerprint-varied retry for hCaptcha / Turnstile
//   3. UA + IP-varied retry for reCAPTCHA v3
//   4. User-assist modal (manual fallback)

// ── Types ───────────────────────────────────────────────────────────

export interface CaptchaResult {
  /** Whether the CAPTCHA was resolved */
  solved: boolean;
  /** Method used to solve, or null if unsolved */
  method: 'audio-stt' | 'hcaptcha-bypass' | 'recaptcha-retry' | 'user-assist' | null;
  /** Error message if solving failed */
  error?: string;
}

/** Known CAPTCHA provider signatures in HTML */
const CAPTCHA_SIGNATURES: { provider: string; pattern: RegExp }[] = [
  { provider: 'recaptcha-v2',  pattern: /g-recaptcha|google\.com\/recaptcha/i },
  { provider: 'recaptcha-v3',  pattern: /recaptcha\/enterprise|grecaptcha\.execute/i },
  { provider: 'hcaptcha',     pattern: /hcaptcha\.com|h-captcha/i },
  { provider: 'turnstile',    pattern: /turnstile|cf-turnstile/i },
  { provider: 'arkose',       pattern: /arkoselabs|funcaptcha/i },
  { provider: 'audio',        pattern: /audio.?captcha|captcha.*audio/i },
  { provider: 'generic',      pattern: /captcha|challenge.*page|verify.*human/i },
];

/** User-Agent rotation pool for fingerprint variation */
const UA_POOL: string[] = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
];

// ── Implementation ──────────────────────────────────────────────────

export class CaptchaSolver {
  /** Optional Whisper-compatible STT endpoint for audio CAPTCHAs */
  private audioSTTEndpoint?: string;
  /** Counter for UA rotation */
  private uaIndex = 0;

  constructor(options?: { audioSTTEndpoint?: string }) {
    this.audioSTTEndpoint = options?.audioSTTEndpoint;
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Detect whether a response contains a CAPTCHA challenge.
   * Checks both HTTP status codes and HTML content.
   */
  async detectCaptcha(response: Response, html: string): Promise<boolean> {
    // HTTP 403 / 429 with captcha indicators
    if (response.status === 403 || response.status === 429) {
      for (const { pattern } of CAPTCHA_SIGNATURES) {
        if (pattern.test(html)) {
          return true;
        }
      }
    }

    // HTTP 503 with captcha (Cloudflare challenge)
    if (response.status === 503) {
      for (const { pattern } of CAPTCHA_SIGNATURES) {
        if (pattern.test(html)) {
          return true;
        }
      }
    }

    // Check for known CAPTCHA challenge page titles
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].toLowerCase();
      if (
        title.includes('captcha') ||
        title.includes('challenge') ||
        title.includes('verify') ||
        title.includes('access denied')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Attempt to solve a CAPTCHA detected in the HTML.
   * Tries each strategy in order and returns the first success.
   */
  async solve(html: string, site: string): Promise<CaptchaResult> {
    const detected = this.identifyProvider(html);

    // Strategy 1: Audio STT (works for audio CAPTCHAs and some reCAPTCHA v2)
    if (detected === 'recaptcha-v2' || detected === 'audio') {
      const audioResult = await this.tryAudioSTT(html, site);
      if (audioResult) {
        return { solved: true, method: 'audio-stt' };
      }
    }

    // Strategy 2: hCaptcha / Turnstile fingerprint-retry
    if (detected === 'hcaptcha' || detected === 'turnstile') {
      const bypassResult = await this.retryWithFingerprint(site);
      if (bypassResult) {
        return { solved: true, method: 'hcaptcha-bypass' };
      }
    }

    // Strategy 3: reCAPTCHA v3 retry with varied fingerprint
    if (detected === 'recaptcha-v3') {
      const retryResult = await this.retryRecaptcha(site);
      if (retryResult) {
        return { solved: true, method: 'recaptcha-retry' };
      }
    }

    // Strategy 4: User assist (manual fallback)
    const userResult = await this.requestUserAssist(site);
    if (userResult) {
      return { solved: true, method: 'user-assist' };
    }

    return {
      solved: false,
      method: null,
      error: `Unable to solve CAPTCHA (provider: ${detected ?? 'unknown'}) on ${site}`,
    };
  }

  // ── Private: Provider Identification ──────────────────────────────

  /** Identify which CAPTCHA provider is present in the HTML. */
  private identifyProvider(html: string): string | null {
    for (const { provider, pattern } of CAPTCHA_SIGNATURES) {
      if (pattern.test(html)) {
        return provider;
      }
    }
    return null;
  }

  // ── Private: Audio STT Strategy ───────────────────────────────────

  /**
   * Attempt to solve an audio CAPTCHA via speech-to-text.
   * Extracts the audio URL, sends it to the configured STT endpoint,
   * and returns the transcribed text.
   */
  private async tryAudioSTT(html: string, site: string): Promise<boolean> {
    if (!this.audioSTTEndpoint) {
      return false;
    }

    try {
      // Extract audio source URL from the CAPTCHA HTML
      const audioUrl = this.extractAudioUrl(html);
      if (!audioUrl) {
        return false;
      }

      // Fetch the audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        return false;
      }

      const audioBlob = await audioResponse.blob();

      // Send to STT endpoint
      const formData = new FormData();
      formData.append('audio', audioBlob, 'captcha.wav');
      formData.append('language', 'en');

      const sttResponse = await fetch(this.audioSTTEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        return false;
      }

      const result = await sttResponse.json() as { text?: string };
      if (!result.text) {
        return false;
      }

      // Submit the transcribed text to the CAPTCHA form
      return this.submitCaptchaAnswer(site, result.text.trim());
    } catch {
      return false;
    }
  }

  /** Extract the audio URL from reCAPTCHA audio challenge HTML. */
  private extractAudioUrl(html: string): string | null {
    // reCAPTCHA audio: /recaptcha/api2/payload?c=...&p=...
    const recaptchaMatch = html.match(
      /\/recaptcha\/api2\/payload\?[^"'\s]+/i,
    );
    if (recaptchaMatch) {
      return recaptchaMatch[0];
    }

    // Generic audio tag
    const audioMatch = html.match(
      /<audio[^>]+src=["']([^"']+)["']/i,
    );
    if (audioMatch) {
      return audioMatch[1];
    }

    // data-url attribute on audio elements
    const dataMatch = html.match(
      /data-audio-url=["']([^"']+)["']/i,
    );
    if (dataMatch) {
      return dataMatch[1];
    }

    return null;
  }

  /**
   * Submit a solved answer to the CAPTCHA form on the page.
   * Returns true if submission succeeded.
   */
  private async submitCaptchaAnswer(site: string, answer: string): Promise<boolean> {
    try {
      const response = await fetch(site, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'g-recaptcha-response': answer }).toString(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ── Private: Fingerprint Retry Strategy ───────────────────────────

  /**
   * Retry the request with a varied browser fingerprint.
   * Rotates User-Agent and adjusts Accept-Language to
   * appear as a different visitor.
   */
  private async retryWithFingerprint(site: string): Promise<boolean> {
    const ua = this.nextUA();
    const languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.8', 'en-CA,en;q=0.9'];

    try {
      const response = await fetch(site, {
        method: 'GET',
        headers: {
          'User-Agent': ua,
          'Accept-Language': languages[this.uaIndex % languages.length],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const html = await response.text();
        return !await this.detectCaptcha(response, html);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Private: reCAPTCHA v3 Retry Strategy ──────────────────────────

  /**
   * Retry with a different fingerprint for reCAPTCHA v3.
   * v3 uses risk analysis; varying the visitor pattern can
   * yield a higher score on retry.
   */
  private async retryRecaptcha(site: string): Promise<boolean> {
    // Add a small delay to vary timing fingerprint
    await this.delay(500 + Math.random() * 2000);

    return this.retryWithFingerprint(site);
  }

  // ── Private: User Assist Strategy ─────────────────────────────────

  /**
   * Emit a UI event requesting manual user intervention.
   * In a real implementation, this would show a modal / toast
   * asking the user to solve the CAPTCHA manually.
   */
  private async requestUserAssist(site: string): Promise<boolean> {
    try {
      // Dispatch a custom event that the UI layer can listen to
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('browser-pool:captcha-assist', {
          detail: { site, timestamp: Date.now() },
        });
        window.dispatchEvent(event);
      }

      // In a full implementation, this would await a Promise
      // that resolves when the user solves the CAPTCHA in the UI.
      // For now, return false (unsolved) as a graceful degradation.
      return false;
    } catch {
      return false;
    }
  }

  // ── Private: Helpers ──────────────────────────────────────────────

  /** Get the next User-Agent from the rotation pool. */
  private nextUA(): string {
    const ua = UA_POOL[this.uaIndex % UA_POOL.length];
    this.uaIndex += 1;
    return ua;
  }

  /** Promise-based delay. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
