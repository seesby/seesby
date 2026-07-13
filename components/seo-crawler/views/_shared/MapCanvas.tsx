// MapCanvas.tsx — MapLibre wrapper, no token required.
import React, { useEffect, useRef } from 'react';
// @ts-ignore — maplibre-gl ships its own types when installed.
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const FREE_TILES = 'https://demotiles.maplibre.org/style.json';

export function MapCanvas({
  center = [-74, 40.7],
  zoom = 9,
  height = 480,
  markers = [],
  onReady,
}: {
  center?: [number, number];
  zoom?: number;
  height?: number;
  markers?: ReadonlyArray<{ id: string; lng: number; lat: number; color?: string; label?: string }>;
  onReady?: (map: MlMap) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: FREE_TILES,
      center,
      zoom,
      attributionControl: false,
    });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
    mapRef.current = m;
    m.on('load', () => onReady?.(m));
    return () => { m.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const els: maplibregl.Marker[] = [];
    markers.forEach(mk => {
      const el = document.createElement('div');
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.background = mk.color ?? '#f97316';
      el.style.border = '2px solid bg-[var(--brand-surface-0)]';
      el.title = mk.label ?? mk.id;
      const marker = new maplibregl.Marker({ element: el }).setLngLat([mk.lng, mk.lat]).addTo(m);
      els.push(marker);
    });
    return () => { els.forEach(e => e.remove()); };
  }, [markers]);

  return <div ref={ref} className="w-full rounded border border-[var(--brand-surface-3)] overflow-hidden" style={ { height } } />;
}
