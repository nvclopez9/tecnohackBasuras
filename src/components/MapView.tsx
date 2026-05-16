import { useEffect, useRef, useState } from 'react';
import type { Map as LMap, Marker, Polyline, MarkerCluster } from 'leaflet';
import { Bin, Report, ContainerType } from '@/types';
import { SC_TENERIFE } from '@/lib/theme';
import { pinHtml } from '@/lib/pin';
import { TruckRoute } from '@/lib/truckRoutes';
import { CONTAINERS } from '@/lib/constants';

export interface RoutePoint { lat: number; lng: number; id: string; }

export interface FlyTo { lat: number; lng: number; zoom: number; }

export interface LatLng { lat: number; lng: number; }

/** Círculo de densidad para la capa analítica "intensidad por zona". */
export interface ZoneCircle { lat: number; lng: number; radius: number; color: string; }

export type MapVariant = 'light' | 'voyager' | 'dark' | 'satellite';

interface Props {
  bins?: Bin[];
  reports?: Report[];
  selectedId?: string | null;
  onBinClick?: (bin: Bin) => void;
  onReportClick?: (report: Report) => void;
  onBoundsChange?: (bbox: string, zoom: number) => void;
  showHeatmap?: boolean;
  containerFilter?: Set<ContainerType> | null;
  variant?: MapVariant;
  truckRoutes?: TruckRoute[];
  routePoints?: RoutePoint[];
  minZoom?: number;
  maxZoom?: number;
  flyTo?: FlyTo | null;
  userLocation?: LatLng | null;
  zoneCircles?: ZoneCircle[];
}

const TILES: Record<MapVariant, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const TILE_ATTRIB: Record<MapVariant, string> = {
  light: '&copy; <a href="https://carto.com/">CARTO</a> · OpenStreetMap',
  voyager: '&copy; <a href="https://carto.com/">CARTO</a> · OpenStreetMap',
  dark: '&copy; <a href="https://carto.com/">CARTO</a> · OpenStreetMap',
  satellite: '&copy; <a href="https://www.esri.com/">Esri</a> · Maxar · Earthstar Geographics',
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
  routePoints = [],
  minZoom = 12,
  maxZoom = 19,
  flyTo,
  userLocation = null,
  zoneCircles = [],
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
        zoom: 17,
        zoomControl: false,
        minZoom,
        maxZoom,
      });
      L.tileLayer(TILES[variant], {
        attribution: TILE_ATTRIB[variant],
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

  // fly to location
  useEffect(() => {
    if (!mapReady || !mapRef.current || !flyTo) return;
    import('leaflet').then((L) => {
      mapRef.current!.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.2 });
    });
  }, [flyTo, mapReady]);

  const filterOk = (t: ContainerType) =>
    !containerFilter || containerFilter.size === 0 || containerFilter.has(t);

  const clusterGroupRef = useRef<any>(null);
  const markerTypeMap = useRef<WeakMap<L.Marker, ContainerType>>(new WeakMap());
  const userLocMarker = useRef<Marker | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoneCirclesRef = useRef<any[]>([]);

  // bin markers — siempre agrupados con leaflet.markercluster para evitar
  // el solapamiento caótico de pines. El pin seleccionado se saca del clúster
  // para que sea siempre visible.
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((Lmod) => {
      import('leaflet.markercluster').then(() => {
        // El plugin markercluster parchea el objeto CJS de Leaflet; el espacio
        // de nombres ESM no expone esa clave nueva, así que usamos `.default`.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L: any = (Lmod as any).default ?? Lmod;
        const map = mapRef.current!;

        // Limpia capas previas
        if (clusterGroupRef.current) {
          map.removeLayer(clusterGroupRef.current);
          clusterGroupRef.current = null;
        }
        binMarkers.current.forEach((m) => m.remove());
        binMarkers.current.clear();
        markerTypeMap.current = new WeakMap();

        const group = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 44,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 19,
          iconCreateFunction: (cluster: MarkerCluster) => {
            const count = cluster.getChildCount();
            const markers = cluster.getAllChildMarkers();
            const typeCounts: Record<string, number> = {};
            markers.forEach((m: Marker) => {
              const t = markerTypeMap.current.get(m) || 'otro';
              typeCounts[t] = (typeCounts[t] || 0) + 1;
            });
            const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
            const dominantMeta = CONTAINERS.find((c) => c.type === dominant);
            const typeColor = dominantMeta?.color || '#5C6670';
            const size = count < 10 ? 34 : count < 50 ? 40 : count < 200 ? 46 : 54;
            const label = count < 1000 ? String(count) : `${Math.round(count / 100) / 10}k`;
            return L.divIcon({
              className: '',
              html: `<div style="
                width:${size}px;height:${size}px;border-radius:50%;
                background:${typeColor};border:3px solid #fff;
                display:flex;align-items:center;justify-content:center;
                color:#fff;font-size:${size < 40 ? 12 : 14}px;font-weight:800;
                box-shadow:0 3px 10px rgba(0,0,0,.32);
              ">${label}</div>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            });
          },
        });
        clusterGroupRef.current = group;
        map.addLayer(group);

        bins.forEach((bin) => {
          if (!filterOk(bin.type)) return;
          const selected = bin.id === selectedId;
          const size = selected ? 46 : 34;
          const html = pinHtml({ type: bin.type, size, selected });
          const icon = L.divIcon({ className: '', html, iconSize: [size, size * 1.25], iconAnchor: [size / 2, size * 1.25] });
          const m = L.marker([bin.lat, bin.lng], { icon, zIndexOffset: selected ? 1000 : 0 })
            .on('click', () => onBinClick?.(bin));
          markerTypeMap.current.set(m, bin.type);
          binMarkers.current.set(bin.id, m);
          if (selected) {
            m.addTo(map); // fuera del clúster → siempre visible
          } else {
            group.addLayer(m);
          }
        });
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

  // user route polyline + stop markers (street routing via OSRM)
  const userPolyRef = useRef<Polyline | null>(null);
  const userStopMarkers = useRef<Marker[]>([]);
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let cancelled = false;
    import('leaflet').then((L) => {
      const map = mapRef.current!;
      if (userPolyRef.current) { userPolyRef.current.remove(); userPolyRef.current = null; }
      userStopMarkers.current.forEach(m => m.remove());
      userStopMarkers.current = [];
      if (routePoints.length < 2) return;

      const coords = routePoints.map(p => `${p.lng},${p.lat}`).join(';');
      fetch(`https://router.project-osrm.org/route/v1/foot/${coords}?geometries=geojson&overview=full&steps=false`)
        .then(r => r.json())
        .then((data) => {
          if (cancelled || !mapRef.current) return;
          if (!data.routes?.[0]) return;
          const geom = data.routes[0].geometry as { coordinates: [number, number][] };
          const latlngs = geom.coordinates.map(c => [c[1], c[0]] as [number, number]);
          userPolyRef.current = L.polyline(latlngs, {
            color: '#005A9C', weight: 5, opacity: 0.85,
          }).addTo(map);
        })
        .catch(() => {});

      routePoints.forEach((p, i) => {
        const size = 22;
        const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#005A9C;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i + 1}</div>`;
        const icon = L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        userStopMarkers.current.push(marker);
      });
    });
    return () => { cancelled = true; };
  }, [routePoints, mapReady]);

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

  // marcador "mi ubicación" — punto azul con halo
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current!;
      if (userLocMarker.current) { userLocMarker.current.remove(); userLocMarker.current = null; }
      if (!userLocation) return;
      const html = `<div style="position:relative;width:22px;height:22px">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,90,156,.25);animation:ecoPulse 2s ease-out infinite"></div>
        <div style="position:absolute;top:5px;left:5px;width:12px;height:12px;border-radius:50%;background:#005A9C;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>
      </div>`;
      const icon = L.divIcon({ className: '', html, iconSize: [22, 22], iconAnchor: [11, 11] });
      userLocMarker.current = L.marker([userLocation.lat, userLocation.lng], { icon, interactive: false, zIndexOffset: 500 }).addTo(map);
    });
  }, [userLocation, mapReady]);

  // capa analítica: intensidad por zona (círculos de densidad)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current!;
      zoneCirclesRef.current.forEach((c) => c.remove());
      zoneCirclesRef.current = [];
      zoneCircles.forEach((z) => {
        const circle = L.circle([z.lat, z.lng], {
          radius: z.radius,
          color: z.color,
          weight: 1.5,
          fillColor: z.color,
          fillOpacity: 0.32,
        }).addTo(map);
        zoneCirclesRef.current.push(circle);
      });
    });
  }, [zoneCircles, mapReady]);

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