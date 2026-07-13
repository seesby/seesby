import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type SecurityCheckItem = {
  id: string;
  label: string;
  pass: number;
  fail: number;
  warn: number;
};

export type WcagLevel = {
  total: number;
  pass: number;
  fail: number;
  passRate: number;
};

export type FailingPageIssue = {
  rule: string;
  impact: string;
  count: number;
  pages: { url: string }[];
};

export function useSecurityA11y() {
  const { pages = [] } = useSeoCrawler() as any;
  return useMemo(() => {
    const total = pages.length || 1;

    const headerCounts = ['hsts', 'csp', 'xfo', 'xcto', 'referrer'].reduce((acc, h) => {
      acc[h] = pages.filter((p: any) => p.security?.headers?.[h]).length;
      return acc;
    }, {} as Record<string, number>);

    const certs = pages.map((p: any) => p.security?.certExpiresInDays).filter((x: any) => typeof x === 'number');
    const expiring = certs.filter((d: number) => d < 30).length;
    const valid = certs.filter((d: number) => d >= 30).length;

    // Security checklist
    const securityChecklist: SecurityCheckItem[] = [
      {
        id: 'https', label: 'HTTPS',
        pass: pages.filter((p: any) => String(p.url || '').startsWith('https://')).length,
        fail: pages.filter((p: any) => String(p.url || '').startsWith('http://')).length,
        warn: 0,
      },
      {
        id: 'hsts', label: 'HSTS',
        pass: pages.filter((p: any) => p.security?.headers?.hsts).length,
        fail: pages.filter((p: any) => !p.security?.headers?.hsts).length,
        warn: 0,
      },
      {
        id: 'csp', label: 'CSP',
        pass: pages.filter((p: any) => p.security?.headers?.csp && !p.security?.headers?.cspUnsafe).length,
        fail: pages.filter((p: any) => !p.security?.headers?.csp).length,
        warn: pages.filter((p: any) => p.security?.headers?.csp && p.security?.headers?.cspUnsafe).length,
      },
      {
        id: 'xfo', label: 'X-Frame-Options',
        pass: pages.filter((p: any) => p.security?.headers?.xfo).length,
        fail: pages.filter((p: any) => !p.security?.headers?.xfo).length,
        warn: 0,
      },
      {
        id: 'xcto', label: 'X-Content-Type',
        pass: pages.filter((p: any) => p.security?.headers?.xcto).length,
        fail: pages.filter((p: any) => !p.security?.headers?.xcto).length,
        warn: 0,
      },
      {
        id: 'referrer', label: 'Referrer-Policy',
        pass: pages.filter((p: any) => p.security?.headers?.referrer).length,
        fail: pages.filter((p: any) => !p.security?.headers?.referrer).length,
        warn: 0,
      },
      {
        id: 'permissions', label: 'Permissions-Policy',
        pass: pages.filter((p: any) => p.security?.headers?.permissions).length,
        fail: pages.filter((p: any) => !p.security?.headers?.permissions).length,
        warn: 0,
      },
      {
        id: 'cookies', label: 'Cookies',
        pass: pages.filter((p: any) => !p.security?.insecureCookies && !p.security?.sameSiteMissing).length,
        fail: pages.filter((p: any) => p.security?.insecureCookies).length,
        warn: pages.filter((p: any) => p.security?.sameSiteMissing && !p.security?.insecureCookies).length,
      },
      {
        id: 'mixed', label: 'Mixed content',
        pass: pages.filter((p: any) => !p.hasMixedContent).length,
        fail: pages.filter((p: any) => p.hasMixedContent).length,
        warn: 0,
      },
    ];

    // WCAG levels
    const a11yPages = pages.filter((p: any) => p.a11y?.violations?.length > 0 || p.a11yScore != null);
    const allViolations = pages.flatMap((p: any) => p.a11y?.violations ?? []);

    const wcagA = {
      total: pages.length,
      pass: pages.filter((p: any) => !(p.a11y?.violations ?? []).some((v: any) => v.impact === 'critical' || v.impact === 'serious')).length,
      fail: pages.filter((p: any) => (p.a11y?.violations ?? []).some((v: any) => v.impact === 'critical' || v.impact === 'serious')).length,
      passRate: 0,
    };
    wcagA.passRate = wcagA.total > 0 ? Math.round((wcagA.pass / wcagA.total) * 100) : 0;

    const wcagAA = {
      total: pages.length,
      pass: pages.filter((p: any) => !(p.a11y?.violations ?? []).some((v: any) => v.impact === 'critical')).length,
      fail: pages.filter((p: any) => (p.a11y?.violations ?? []).some((v: any) => v.impact === 'critical')).length,
      passRate: 0,
    };
    wcagAA.passRate = wcagAA.total > 0 ? Math.round((wcagAA.pass / wcagAA.total) * 100) : 0;

    const wcagAAA = {
      total: pages.length,
      pass: pages.filter((p: any) => (p.a11y?.violations ?? []).length === 0).length,
      fail: pages.filter((p: any) => (p.a11y?.violations ?? []).length > 0).length,
      passRate: 0,
    };
    wcagAAA.passRate = wcagAAA.total > 0 ? Math.round((wcagAAA.pass / wcagAAA.total) * 100) : 0;

    const wcagLevels = { a: wcagA, aa: wcagAA, aaa: wcagAAA };

    // A11y by impact
    const a11yByImpact = ['critical', 'serious', 'moderate', 'minor'].map(k => ({
      impact: k, count: allViolations.filter((v: any) => v.impact === k).length,
    }));

    // Top rules
    const topRules = Object.entries(
      allViolations.reduce((acc: Record<string, number>, v: any) => {
        acc[v.id] = (acc[v.id] ?? 0) + (v.nodes ?? 1);
        return acc;
      }, {})
    ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 12);

    // Failing pages grouped by issue
    const ruleToPages = new Map<string, { impact: string; pages: Map<string, { url: string }> }>();
    for (const p of pages) {
      for (const v of (p.a11y?.violations ?? [])) {
        if (!ruleToPages.has(v.id)) ruleToPages.set(v.id, { impact: v.impact, pages: new Map() });
        ruleToPages.get(v.id)!.pages.set(p.url, { url: p.url });
      }
    }
    const failingPagesByIssue: FailingPageIssue[] = [...ruleToPages.entries()]
      .map(([rule, data]) => ({
        rule,
        impact: data.impact,
        count: data.pages.size,
        pages: [...data.pages.values()].slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Violation trend: per-page violation counts (sorted by URL) for sparkline
    const violationTrend = pages
      .map((p: any) => (p.a11y?.violations ?? []).length)
      .sort((a: number, b: number) => a - b);

    // Security issues trend: per-page security issue count for sparkline
    const securityTrend = pages
      .map((p: any) => {
        let issues = 0;
        if (p.hasMixedContent) issues++;
        if (p.security?.insecureCookies) issues++;
        if (p.security?.sameSiteMissing) issues++;
        if (!p.security?.headers?.hsts) issues++;
        if (!p.security?.headers?.csp) issues++;
        if (!p.security?.headers?.xfo) issues++;
        return issues;
      })
      .sort((a: number, b: number) => a - b);

    return {
      total,
      headerCounts,
      expiring,
      valid,
      securityChecklist,
      wcagLevels,
      a11yByImpact,
      topRules,
      failingPagesByIssue,
      violationTrend,
      securityTrend,
    };
  }, [pages]);
}
