import React, { useMemo, useState } from 'react';
import { MapCanvas } from '../../_shared/MapCanvas';
import { BarChart } from '../../_shared/BarChart';
import { useLocalMap } from '../selectors/useLocalMap';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import clsx from 'clsx';
import { STATUS_HEX } from '../../_shared/shared-columns';

const TERRITORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'NY', label: 'NY' },
  { value: 'NJ', label: 'NJ' },
  { value: 'CT', label: 'CT' },
  { value: 'MA', label: 'MA' },
];

const REVIEW_AGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
];

function ratingToColor(rating: number): string {
  if (rating >= 4.5) return STATUS_HEX.good;
  if (rating >= 4.0) return '#84cc16';
  if (rating >= 3.5) return STATUS_HEX.warn;
  if (rating >= 3.0) return '#f97316';
  return STATUS_HEX.bad;
}

export default function LocalMapView() {
  const markers = useLocalMap();
  const { locations: ctxLocations = [] } = useSeoCrawler() as any;
  const [territory, setTerritory] = useState('all');
  const [reviewAge, setReviewAge] = useState('all');

  const locations = useMemo(() => {
    return ctxLocations ?? [];
  }, [ctxLocations]);

  const center: [number, number] = markers[0] ? [markers[0].lng, markers[0].lat] : [-74, 40.7];

  const filteredMarkers = useMemo(() => {
    if (territory === 'all') return markers;
    return markers.filter((m: any) => m.state === territory);
  }, [markers, territory]);

  const ratingDist = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    locations.forEach((l: any) => {
      const r = Math.round(l.rating ?? l.reviews?.rating ?? 0);
      if (r >= 1 && r <= 5) buckets[r - 1]++;
    });
    return ['1', '2', '3', '4', '5'].map((star, i) => ({
      rating: `${star}\u2605`,
      count: buckets[i],
    }));
  }, [locations]);

  const packByTerritory = useMemo(() => {
    const byState: Record<string, { total: number; inPack: number }> = {};
    locations.forEach((l: any) => {
      const state = l.state || 'Unknown';
      if (!byState[state]) byState[state] = { total: 0, inPack: 0 };
      byState[state].total++;
      if ((l.rankAvg ?? l.rank?.avg) != null) byState[state].inPack++;
    });
    return Object.entries(byState)
      .map(([state, d]) => ({
        territory: state,
        pct: d.total > 0 ? Math.round((d.inPack / d.total) * 100) : 0,
        inPack: d.inPack,
        total: d.total,
      }))
      .sort((a, b) => a.territory.localeCompare(b.territory));
  }, [locations]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Map area - takes remaining space */}
      <div className="flex-1 min-h-0 relative">
        {/* Floating controls */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-[var(--brand-surface-0)]cc] backdrop-blur p-1.5 rounded border border-[var(--brand-surface-3)]]">
          <span className="text-[10px] text-[var(--brand-text-mid)]] mr-1">Territory</span>
          <select
            value={territory}
            onChange={e => setTerritory(e.target.value)}
            className="h-6 px-1.5 text-[10px] bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]] rounded outline-none cursor-pointer"
          >
            {TERRITORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-[var(--brand-surface-4)]]">|</span>
          <span className="text-[10px] text-[var(--brand-text-mid)]] mr-1">Review age</span>
          <select
            value={reviewAge}
            onChange={e => setReviewAge(e.target.value)}
            className="h-6 px-1.5 text-[10px] bg-[var(--brand-surface-1)]] border border-[var(--brand-surface-3)]] text-[var(--brand-text-mid)]] rounded outline-none cursor-pointer"
          >
            {REVIEW_AGE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Floating stats */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-3 bg-[var(--brand-surface-0)]cc] backdrop-blur rounded border border-[var(--brand-surface-3)]] px-3 py-1.5 text-[10px]">
          <span className="text-[var(--brand-text-mid)]]">{filteredMarkers.length} locations</span>
          <span className="text-[var(--brand-surface-4)]]">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX.good }} />
            <span className="text-[var(--brand-text-mid)]]">Verified</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX.warn }} />
            <span className="text-[var(--brand-text-mid)]]">Unverified</span>
          </span>
        </div>

        <MapCanvas
          center={center}
          zoom={10}
          markers={filteredMarkers.map((m: any) => ({
            id: m.id,
            lng: m.lng,
            lat: m.lat,
            color: ratingToColor(m.rating),
            label: `${m.label} (${m.rating}\u2605, ${m.reviewCount} reviews)`,
          }))}
        />
      </div>

      {/* Bottom panel */}
      <div className="shrink-0 h-[140px] border-t border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Rating distribution */}
          <div className="flex flex-col min-h-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-1 shrink-0">Rating distribution</div>
            <div className="flex-1 min-h-0">
              <BarChart
                data={ratingDist}
                x="rating"
                y="count"
                color="#f97316"
                height={100}
              />
            </div>
          </div>

          {/* Pack presence by territory */}
          <div className="flex flex-col min-h-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-1 shrink-0">Pack presence by territory</div>
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
              {packByTerritory.map(t => (
                <div key={t.territory} className="flex items-center gap-2 text-[11px]">
                  <span className="w-8 text-[var(--brand-text-mid)]] tabular-nums">{t.territory}</span>
                  <div className="flex-1 h-3 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${t.pct}%`,
                        background: t.pct >= 60 ? STATUS_HEX.good : t.pct >= 30 ? STATUS_HEX.warn : STATUS_HEX.bad,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[var(--brand-text-mid)]] tabular-nums">{t.pct}%</span>
                  <span className="w-10 text-right text-[var(--brand-text-faint)]] tabular-nums text-[10px]">{t.inPack}/{t.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
