import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export function useAuctionInsights() {
  const { paid = {} } = useSeoCrawler() as any;
  return useMemo(() => {
    const competitors = paid.auctionInsights?.competitors ?? [];
    const timeseries = paid.auctionInsights?.timeseries ?? [];

    const ourIS = paid.auctionInsights?.ourImpressionShare ?? 0;
    const lostBudget = paid.auctionInsights?.lostBudget ?? 0;
    const lostRank = paid.auctionInsights?.lostRank ?? 0;
    const lostAdRank = paid.auctionInsights?.lostAdRank ?? 0;
    const topImpressionShare = paid.auctionInsights?.topImpressionShare ?? 0;
    const absTopShare = paid.auctionInsights?.absTopShare ?? 0;

    // Full matrix: us + top 10 competitors
    const matrix = [
      {
        host: 'us',
        isOur: true,
        overlap: 0,
        posAbove: 0,
        topShare: paid.auctionInsights?.ourTopShare ?? 0,
        absTopShare: paid.auctionInsights?.ourAbsTopShare ?? 0,
        outrankUs: 0,
        impressionShare: ourIS,
      },
      ...competitors.slice(0, 10).map((c: any) => ({
        host: c.host,
        isOur: false,
        overlap: c.overlap ?? 0,
        posAbove: c.posAbove ?? 0,
        topShare: c.topShare ?? 0,
        absTopShare: c.absTopShare ?? 0,
        outrankUs: c.outranked ?? 0,
        impressionShare: c.impressionShare ?? 0,
      })),
    ];

    // SoV stream data (us + top 4 competitors over time)
    const top4Hosts = competitors.slice(0, 4).map((c: any) => c.host);
    const streamData = timeseries.map((t: any) => {
      const row: any = { date: t.date };
      const points = t.points ?? [];
      const usPoint = points.find((p: any) => p.host === 'us');
      row.us = usPoint?.impressionShare ?? 0;
      top4Hosts.forEach(host => {
        const pt = points.find((p: any) => p.host === host);
        row[host] = pt?.impressionShare ?? 0;
      });
      return row;
    });

    // Lost breakdown
    const lostBreakdown = [
      { reason: 'rank', value: lostRank, label: 'rank', action: 'raise bids' },
      { reason: 'budget', value: lostBudget, label: 'budget', action: '+ budget' },
      { reason: 'adRank', value: lostAdRank, label: 'ad rank', action: 'refresh creatives' },
    ].filter(l => l.value > 0);

    // Competitor trend sparklines (top 4)
    const competitorTrends = top4Hosts.map(host => {
      const values = timeseries.map((t: any) => {
        const pt = (t.points ?? []).find((p: any) => p.host === host);
        return pt?.impressionShare ?? 0;
      });
      return { host, values };
    });

    return {
      competitors,
      timeseries,
      ourIS,
      lostBudget,
      lostRank,
      lostAdRank,
      topImpressionShare,
      absTopShare,
      matrix,
      streamData,
      top4Hosts,
      lostBreakdown,
      competitorTrends,
    };
  }, [paid.auctionInsights]);
}
