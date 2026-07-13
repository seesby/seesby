import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

export type DropOffItem = {
  from: string;
  to: string;
  dropPct: number;
  reason: string;
};

export type DeviceFunnel = {
  device: string;
  steps: string[];
  counts: number[];
};

export type TemplateFunnel = {
  template: string;
  steps: string[];
  counts: number[];
};

export function useCommerceFunnel() {
  const { commerceFunnel } = useSeoCrawler() as any;

  const steps: string[] = commerceFunnel?.steps ?? ['PDP views', 'Add to cart', 'Begin checkout', 'Purchase'];
  const counts: number[] = commerceFunnel?.counts ?? [];

  const hasData = counts.some((c: number) => c > 0);

  const cvr = useMemo(() => {
    if (!hasData) return 0;
    const visit = counts[0] || 1;
    const purchase = counts[counts.length - 1] || 0;
    return purchase / visit;
  }, [counts, hasData]);

  const aov = commerceFunnel?.aov ?? 0;

  const dropOff: DropOffItem[] = useMemo(() => {
    if (!hasData) return [];
    const reasons = [
      'price, stock, above-fold info',
      'shipping cost surprise, login wall',
      'payment methods, form length, errors',
    ];
    const result: DropOffItem[] = [];
    for (let i = 1; i < steps.length; i++) {
      const prev = counts[i - 1] || 1;
      const dropPct = 1 - (counts[i] / prev);
      if (dropPct > 0) {
        result.push({
          from: steps[i - 1],
          to: steps[i],
          dropPct,
          reason: reasons[i - 1] ?? 'varies',
        });
      }
    }
    return result;
  }, [steps, counts, hasData]);

  const deviceFunnels: DeviceFunnel[] = useMemo(() => {
    if (!hasData) return [];
    const devices = commerceFunnel?.devices ?? [
      { device: 'Mobile', counts: counts.map((c: number) => Math.round(c * 0.55)) },
      { device: 'Desktop', counts: counts.map((c: number) => Math.round(c * 0.35)) },
      { device: 'Tablet', counts: counts.map((c: number) => Math.round(c * 0.10)) },
    ];
    return devices.map((d: any) => ({
      device: d.device,
      steps,
      counts: d.counts,
    }));
  }, [counts, steps, commerceFunnel, hasData]);

  const templateFunnels: TemplateFunnel[] = useMemo(() => {
    if (!hasData) return [];
    return (commerceFunnel?.perTemplate ?? []).map((t: any) => ({
      template: t.template,
      steps,
      counts: t.counts,
    }));
  }, [steps, commerceFunnel, hasData]);

  return { steps, counts, cvr, aov, dropOff, deviceFunnels, templateFunnels, hasData };
}
