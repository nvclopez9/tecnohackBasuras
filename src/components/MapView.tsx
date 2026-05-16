import { useEffect, useRef, useState } from 'react';
import type { Map as LMap, Marker, Polyline } from 'leaflet';
import { Bin, Report, ContainerType } from '@/types';
import { SC_TENERIFE } from '@/lib/theme';
import { pinHtml } from '@/lib/pin';
import { TruckRoute } from '@/lib/truckRoutes';

interface Props {
  bins?: Bin[];
  reports?: Report[];
  selectedId?: string | null;
  onBinClick?: (bin: Bin) => void;
  onReportClick?: (report: Report) => void;
  onBoundsChange?: (bbox: string, zoom: number) => void;
  showHeatmap?: boolean;
  containerFilter?: Set<ContainerType> | null;
  variant?: 'light' | 'voyager';
  truckRoutes?: TruckRoute[];
}

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

export default function MapView({
  bins = [],
  reports = [],
  selectedId,
  onBinClick,
  onReportClick,
  onBoundsChange,
  showHeatmap = false,
  containerFilter = null,
  variant = 'light',
  truckRoutes = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const binMarkers = useRef<Map<string, Marker>>(new Map());
  const reportMarkers = useRef<Map<string, Marker>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatRef = useRef<any>(null);
  // truck route layers
  const routePolylines = useRef<Polyline[]>([]);
  const routeMarkers = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current || mapRef.current) return;
      // Limpia cualquier id de Leaflet residual (Fast Refresh / StrictMode).
      const el = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
      if (el._leaflet_id) delete el._leaflet_id;
      const map = L.map(containerRef.current, {
        center: [SC_TENERIFE.lat, SC_TENERIFE.lng],
        zoom: 15,
        zoomControl: false,
      });
      L.tileLayer(TILES[variant], {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> · OpenStreetMap',
        maxZoom: 20,
      }).addTo(map);
      mapRef.current = map;

      // Emit bounds on initial load and every pan/zoom
      const emitBounds = () => {
        const b = map.getBounds();
        const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
        onBoundsChange?.(bbox, map.getZoom());
      };
      map.whenReady(emitBounds);
      map.on('moveend', emitBounds);

      setMapReady(true);
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      binMarkers.current.clear();
      reportMarkers.current.clear();
      // clean truck route layers
      routePolylines.current = [];
      routeMarkers.current = [];
      setMapReady(false);
    };
  }, [variant]);

  const filterOk = (t: ContainerType) =>
    !containerFilter || containerFilter.size === 0 || containerFilter.has(t);

  // bin markers
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current!;
      const shown = new Set<string>();
      bins.forEach((bin) => {
        if (!filterOk(bin.type)) return;
        shown.add(bin.id);
        const selected = bin.id === selectedId;
        const size = selected ? 44 : 34;
        const html = pinHtml({ type: bin.type, size, selected });
        const icon = L.divIcon({ className: '', html, iconSize: [size, size * 1.25], iconAnchor: [size / 2, size * 1.25] });
        const existing = binMarkers.current.get(bin.id);
        if (existing) {
          existing.setIcon(icon);
        } else {
          const m = L.marker([bin.lat, bin.lng], { icon })
            .addTo(map)
            .on('click', () => onBinClick?.(bin));
          binMarkers.current.set(bin.id, m);
        }
      });
      binMarkers.current.forEach((m, id) => {
        if (!shown.has(id)) {
          m.remove();
          binMarkers.current.delete(id);
        }
      });
    });
  }, [bins, selectedId, onBinClick, containerFilter, mapReady]);

  // report markers
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current!;
      const shown = new Set<string>();
      if (!showHeatmap) {
        reports.forEach((r) => {
          if (!filterOk(r.containerType)) return;
          shown.add(r.id);
          const selected = r.id === selectedId;
          const size = selected ? 38 : 30;
          const html = pinHtml({
            type: r.containerType,
            status: r.status,
            size,
            selected,
            faded: r.status === 'resuelto',
          });
          const icon = L.divIcon({ className: '', html, iconSize: [size, size * 1.25], iconAnchor: [size / 2, size * 1.25] });
          const existing = reportMarkers.current.get(r.id);
          if (existing) {
            existing.setIcon(icon);
          } else {
            const m = L.marker([r.lat, r.lng], { icon })
              .addTo(map)
              .on('click', () => onReportClick?.(r));
            reportMarkers.current.set(r.id, m);
          }
        });
      }
      reportMarkers.current.forEach((m, id) => {
        if (!shown.has(id)) {
          m.remove();
          reportMarkers.current.delete(id);
        }
      });
    });
  }, [reports, selectedId, onReportClick, showHeatmap, containerFilter, mapReady]);

  // heatmap
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(async (L) => {
      await import('leaflet.heat');
      const map = mapRef.current;
      if (!map) return;
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      if (!showHeatmap) return;
      const pts = reports
        .filter((r) => filterOk(r.containerType))
        .map((r) => [r.lat, r.lng, 0.9] as [number, number, number]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heatRef.current = (L as any)
        .heatLayer(pts, {
          radius: 38,
          blur: 28,
          maxZoom: 18,
          gradient: { 0.2: '#005A9C', 0.5: '#E8A317', 1.0: '#C0392B' },
        })
        .addTo(map);
    });
  }, [reports, showHeatmap, containerFilter, mapReady]);

  // truck routes — polylines + stop markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current!;

      // Remove previous route layers
      routePolylines.current.forEach((p) => p.remove());
      routePolylines.current = [];
      routeMarkers.current.forEach((m) => m.remove());
      routeMarkers.current = [];

      if (!truckRoutes || truckRoutes.length === 0) return;

      truckRoutes.forEach((route) => {
        const latlngs = route.stops.map((s) => [s.lat, s.lng] as [number, number]);

        // Polyline
        const polyline = L.polyline(latlngs, {
          color: route.color,
          weight: 4,
          opacity: 0.8,
          dashArray: route.status === 'planificada' ? '8,6' : undefined,
        }).addTo(map);
        routePolylines.current.push(polyline);

        // Stop markers
        route.stops.forEach((stop, idx) => {
          const isCompleted = idx < route.completedStops;
          const size = 14;
          const html = isCompleted
            ? `<div style="
                width:${size}px;height:${size}px;border-radius:50%;
                background:${route.color};
                border:2px solid #fff;
                box-shadow:0 1px 4px rgba(0,0,0,.3);
              "></div>`
            : `<div style="
                width:${size}px;height:${size}px;border-radius:50%;
                background:#fff;
                border:2.5px solid ${route.color};
                box-shadow:0 1px 4px rgba(0,0,0,.2);
              "></div>`;

          const icon = L.divIcon({
            className: '',
            html,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([stop.lat, stop.lng], { icon })
            .addTo(map)
            .bindTooltip(
              `<strong>${stop.address}</strong><br>${stop.containerType} · ${stop.visitedAt}`,
              { direction: 'top', offset: [0, -8] }
            );
          routeMarkers.current.push(marker);
        });
      });
    });
  }, [truckRoutes, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%', background: '#EAEAEA',
        position: 'relative', isolation: 'isolate',
      }}
    />
  );
}