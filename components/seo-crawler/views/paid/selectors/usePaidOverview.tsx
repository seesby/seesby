import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function usePaidOverview() {
  const { paid = {} } = useSeoCrawler() as any;
  return useMemo(() => {
    const campaigns = paid.campaigns ?? [];
    const spendByCampaign = paid.spendByCampaign ?? [];
    const spendByDevice = paid.spendByDevice ?? [];
    const spendByNetwork = paid.spendByNetwork ?? [];
    const daily = paid.daily ?? [];
    const keywords = paid.keywords ?? [];
    const auctionInsights = paid.auctionInsights ?? {};

    const impressions = paid.impressions ?? 0;
    const clicks = paid.clicks ?? 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;

    const spend30d = paid.spend30d ?? 0;
    const conversions = paid.conversions ?? 0;
    const revenue = paid.revenue ?? 0;
    const roas = revenue && spend30d ? revenue / spend30d : 0;
    const cpa = spend30d && conversions ? spend30d / conversions : 0;
    const impressionShare = auctionInsights.ourImpressionShare ?? 0;

    // QS distribution by individual score (10, 9, 8, 7, 6, 5, <5)
    const qsByScore: Record<number, number> = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0 };
    let qsBelow5 = 0;
    keywords.forEach((k: any) => {
      const qs = Math.round(k.qualityScore ?? 0);
      if (qs >= 5 && qs <= 10) qsByScore[qs]++;
      else qsBelow5++;
    });
    const qsDist = [
      { score: 10, count: qsByScore[10] },
      { score: 9, count: qsByScore[9] },
      { score: 8, count: qsByScore[8] },
      { score: 7, count: qsByScore[7] },
      { score: 6, count: qsByScore[6] },
      { score: 5, count: qsByScore[5] },
      { score: 4, count: qsBelow5 },
    ];
    const maxQs = Math.max(...qsDist.map(q => q.count), 1);

    // Scatter data: each campaign as { spend, conv, name } for quadrant
    const scatterData = campaigns
      .filter((c: any) => (c.spend ?? 0) > 0)
      .map((c: any) => ({
        x: c.spend ?? 0,
        y: c.conv ?? 0,
        name: c.name,
        roas: c.roas ?? 0,
      }));

    // Top movers (campaigns with biggest spend delta)
    const topMovers = [...campaigns]
      .filter((c: any) => Math.abs(c.spendDelta ?? 0) > 0 || Math.abs(c.convDelta ?? 0) > 0)
      .sort((a: any, b: any) => Math.abs(b.spendDelta ?? 0) - Math.abs(a.spendDelta ?? 0))
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name,
        spendDelta: c.spendDelta ?? 0,
        convDelta: c.convDelta ?? 0,
      }));

    // Top 5 campaigns by ROAS for right sidebar
    const topCampaigns = [...campaigns]
      .filter((c: any) => (c.roas ?? 0) > 0)
      .sort((a: any, b: any) => (b.roas ?? 0) - (a.roas ?? 0))
      .slice(0, 5);

    // Auction preview (top 4 competitors)
    const competitors = (auctionInsights.competitors ?? [])
      .slice(0, 4)
      .map((c: any) => ({
        host: c.host,
        overlap: c.overlap ?? 0,
        posAbove: c.posAbove ?? 0,
        topShare: c.topShare ?? 0,
      }));

    // ROAS trend from daily data
    const roasTrend = daily
      .filter((d: any) => d.roas != null)
      .map((d: any) => ({ date: d.date, roas: d.roas, target: 3.0 }));

    // Status counts
    const statusCounts = { active: 0, paused: 0, learning: 0, removed: 0 };
    campaigns.forEach((c: any) => {
      const s = c.status ?? 'active';
      if (s === 'enabled' || s === 'active') statusCounts.active++;
      else if (s === 'paused') statusCounts.paused++;
      else if (s === 'learning') statusCounts.learning++;
      else statusCounts.removed++;
    });

    // Network counts
    const networkCounts: Record<string, number> = {};
    campaigns.forEach((c: any) => {
      const n = c.network ?? 'unknown';
      networkCounts[n] = (networkCounts[n] ?? 0) + 1;
    });

    // Funnel stage counts
    const funnelCounts: Record<string, number> = {};
    campaigns.forEach((c: any) => {
      const f = c.funnelStage ?? 'unknown';
      funnelCounts[f] = (funnelCounts[f] ?? 0) + 1;
    });

    return {
      spend30d,
      spendPrev30d: paid.spendPrev30d ?? 0,
      impressions,
      clicks,
      ctr,
      conversions,
      revenue,
      roas,
      cpa,
      impressionShare,
      qualityScoreAvg: paid.qualityScoreAvg ?? 0,
      daily,
      spendByCampaign,
      spendByDevice,
      spendByNetwork,
      qsDist,
      maxQs,
      scatterData,
      topMovers,
      topCampaigns,
      competitors,
      roasTrend,
      statusCounts,
      networkCounts,
      funnelCounts,
      campaignCount: campaigns.length,
      adCount: paid.adCount ?? 0,
      keywordCount: keywords.length,
      lpCount: paid.landingPages?.length ?? 0,
    };
  }, [paid]);
}
