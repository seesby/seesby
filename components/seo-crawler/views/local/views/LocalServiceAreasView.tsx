import React, { useMemo, useState } from 'react';
import { Geogrid } from '../../_shared/Geogrid';
import { MapCanvas } from '../../_shared/MapCanvas';
import { useServiceAreas } from '../selectors/useServiceAreas';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS } from '../../_shared/tokens';

type TerritoryRow = {
  territory: string;
  popCovered: number;
  locations: number;
  gapZips: number;
  rankAvg: string;
};

type OverlapWarning = {
  type: 'overlap' | 'gap' | 'density';
  message: string;
  territories: string[];
};

export default function LocalServiceAreasView() {
  const grids = useServiceAreas();
  const { locations = [], runGridScan, setRsTab, setInspectorOpen, setSelectedPageUrl } = useSeoCrawler() as any;
  const [selectedId, setSelectedId] = useState<string | null>(grids[0]?.id ?? null);
  const selected = grids.find((g: any) => g.id === selectedId) ?? grids[0];

  const handleScan = () => {
    if (runGridScan && selected) {
      runGridScan(selected.id);
    } else {
      if (selected) setSelectedPageUrl?.(selected.id);
      setRsTab?.('local', 'pack');
      setInspectorOpen?.(true);
    }
  };

  /* ── Map markers for all service-area locations ── */
  const markers = useMemo(() => grids.map((g: any) => ({
    id: g.id,
    lng: g.lng,
    lat: g.lat,
    color: '#f97316',
    label: g.name,
  })), [grids]);

  const mapCenter: [number, number] = markers[0] ? [markers[0].lng, markers[0].lat] : [-74, 40.7];

  /* ── Coverage per territory table ── */
  const coverageTable: TerritoryRow[] = useMemo(() => {
    const byCity: Record<string, { pop: number; locs: number; gaps: number; ranks: number[] }> = {};
    locations.forEach((l: any) => {
      const city = l.city || 'Unknown';
      if (!byCity[city]) byCity[city] = { pop: 0, locs: 0, gaps: 0, ranks: [] };
      byCity[city].locs++;
      // Derive population coverage from geogrid cells with rank data
      if (l.geogrid?.length) {
        const ranked = l.geogrid.filter((c: any) => c.rank > 0).length;
        byCity[city].pop += ranked * 1000; // approximate 1k pop per grid cell
        byCity[city].gaps += l.geogrid.filter((c: any) => !c.rank || c.rank > 20).length;
        l.geogrid.filter((c: any) => c.rank > 0).forEach((c: any) => byCity[city].ranks.push(c.rank));
      }
    });
    return Object.entries(byCity).map(([city, v]) => ({
      territory: city,
      popCovered: v.pop,
      locations: v.locs,
      gapZips: v.gaps,
      rankAvg: v.ranks.length > 0 ? (v.ranks.reduce((a: number, b: number) => a + b, 0) / v.ranks.length).toFixed(1) : '—',
    }));
  }, [locations]);

  /* ── Overlap warnings ── */
  const overlapWarnings: OverlapWarning[] = useMemo(() => {
    const warnings: OverlapWarning[] = [];
    // Check for overlapping service areas (locations in same city)
    const cityGroups: Record<string, string[]> = {};
    locations.forEach((l: any) => {
      const city = l.city || 'Unknown';
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(l.name);
    });
    Object.entries(cityGroups).forEach(([city, names]) => {
      if (names.length > 1) {
        warnings.push({
          type: 'overlap',
          message: `${names.length} locations overlap in ${city} — potential cannibalization`,
          territories: names,
        });
      }
    });
    // Check for territories with no coverage
    const gridCities = new Set(grids.map((g: any) => g.name));
    const locCities = new Set(locations.map((l: any) => l.city || 'Unknown'));
    gridCities.forEach((city: string) => {
      if (!locCities.has(city)) {
        warnings.push({
          type: 'gap',
          message: `${city} has a grid scan but no tracked location`,
          territories: [city],
        });
      }
    });
    // Check for low density (single location in large territory)
    locations.forEach((l: any) => {
      if (l.geogrid?.length) {
        const totalCells = l.geogrid.length;
        const rankedCells = l.geogrid.filter((c: any) => c.rank > 0 && c.rank <= 10).length;
        if (totalCells > 0 && rankedCells / totalCells < 0.15) {
          warnings.push({
            type: 'density',
            message: `${l.name}: only ${rankedCells}/${totalCells} grid cells in pack — thin coverage`,
            territories: [l.name],
          });
        }
      }
    });
    return warnings;
  }, [locations, grids]);

  const warnColor: Record<string, string> = {
    overlap: STATUS.warn,
    gap: STATUS.bad,
    density: STATUS.info,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] shrink-0">
        <div className="text-[11px] text-[var(--brand-text-faint)] uppercase tracking-wider">
          {selected ? `${selected.name} \u00b7 ${selected.keyword || 'no keyword'}` : 'Service Areas'}
        </div>
        {grids.length > 0 && (
          <select className="h-7 px-2 text-[11px] bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] text-[var(--brand-text-mid)] rounded outline-none focus:border-[#F59E0B]"
                  value={selectedId ?? ''}
                  onChange={e => setSelectedId(e.target.value)}>
            {grids.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0 overflow-auto custom-scrollbar">
        {/* Left: Map + Geogrid */}
        <div className="col-span-7 flex flex-col gap-3 min-h-0">
          <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 flex flex-col">
            <SectionHead>Service Area Map</SectionHead>
            <MapCanvas center={mapCenter} zoom={markers.length > 1 ? 9 : 11} markers={markers} height={220} />
            <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--brand-text-faint)]">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
                Service area location
              </span>
              <span>Grid cells color = pack rank (green top-3, amber 4-10, red 11+)</span>
            </div>
          </div>

          <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 flex-1 min-h-0 relative">
            <SectionHead>Pack Rank Grid</SectionHead>
            <div className="flex-1 min-h-0 relative">
              {selected && selected.grid && selected.grid.length > 0 ? (
                <Geogrid cells={selected.grid as any} size={7} height={340} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="text-[12px] text-[var(--brand-text-faint)] mb-3">No grid scan yet. Run a grid scan from the right sidebar &gt; Pack tab.</div>
                  <button onClick={handleScan} className="h-7 px-3 text-[11px] bg-[#F59E0B] text-[var(--brand-text-strong)] rounded hover:bg-[#df3248]">
                    Run grid scan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Coverage table + Overlap warnings */}
        <div className="col-span-5 flex flex-col gap-3 min-h-0">
          <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 flex-1 min-h-0 overflow-auto custom-scrollbar">
            <SectionHead>Coverage per Territory</SectionHead>
            {coverageTable.length > 0 ? (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] border-b border-[var(--brand-surface-3)]">
                    <th className="text-left py-1.5 pr-2 font-normal">Territory</th>
                    <th className="text-right py-1.5 px-2 font-normal">Pop</th>
                    <th className="text-right py-1.5 px-2 font-normal">Locs</th>
                    <th className="text-right py-1.5 px-2 font-normal">Gaps</th>
                    <th className="text-right py-1.5 pl-2 font-normal">Rank avg</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageTable.map((row, i) => (
                    <tr key={row.territory} className={`border-b border-[var(--brand-surface-1)] ${i % 2 === 0 ? '' : 'bg-[var(--brand-surface-0)]'}`}>
                      <td className="py-1.5 pr-2 text-[var(--brand-text-strong)] truncate">{row.territory}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--brand-text-mid)]">{row.popCovered.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[var(--brand-text-mid)]">{row.locations}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        <span className={row.gapZips > 10 ? 'text-[#ef4444]' : row.gapZips > 5 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-mid)]'}>
                          {row.gapZips}
                        </span>
                      </td>
                      <td className="py-1.5 pl-2 text-right tabular-nums text-[var(--brand-text-mid)]">{row.rankAvg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-[12px] text-[var(--brand-text-faint)] py-8 text-center">No territory data available.</div>
            )}
          </div>

          <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 max-h-[40%] overflow-auto custom-scrollbar">
            <SectionHead>Overlap &amp; Gap Warnings</SectionHead>
            {overlapWarnings.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {overlapWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] py-1.5 px-2 rounded bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: warnColor[w.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--brand-text-mid)]">{w.message}</div>
                      <div className="text-[10px] text-[var(--brand-text-faint)] mt-0.5">
                        {w.territories.join(', ')}
                      </div>
                    </div>
                    <span className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: warnColor[w.type], background: `${warnColor[w.type]}15` }}>
                      {w.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--brand-text-faint)] py-4 text-center">No warnings. Coverage looks clean.</div>
            )}
          </div>

          <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 text-[11px] text-[var(--brand-text-mid)]">
            <SectionHead>Legend</SectionHead>
            <p>Green = top 3 pack rank, amber = 4-10, red = 11+, dark = no rank. Each grid cell maps to ~1km. Gap cells are those ranking outside the top 20 or with no data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">{children}</div>;
}
