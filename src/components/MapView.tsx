import { useEffect, useRef } from 'react';
import type { Map as LMap, Marker } from 'leaflet';
import { Report } from '@/types';
import { containerMeta, statusMeta } from '@/lib/constants';

interface Props {
  reports: Report[];
  onMarkerClick: (reportId: string) => void;
  showHeatmap?: boolean;
}

function markerHtml(report: Report): string {
  const cm = containerMeta(report.containerType);
  const sm = statusMeta(report.status);
  const glow =
    report.priority === 'alta'
      ? `box-shadow:0 0 0 3px ${cm.color},0 0 16px ${cm.color}88;`
      : report.priority === 'media'
      ? `box-shadow:0 0 0 2px ${cm.color};`
      : `box-shadow:0 0 0 1px ${cm.color}88;`;
  const opacity = report.status === 'resuelto' ? 'opacity:0.5;' : '';
  return `<div style="
    width:52px;height:52px;
    border-radius:50%;
    overflow:hidden;
    border:3px solid ${cm.color};
    ${glow}
    ${opacity}
    cursor:pointer;
    background:#16213e;
    position:relative;
  ">
    <img src="${report.thumbnail}"
      width="52" height="52"
      style="object-fit:cover;display:block;" alt="" />
    <div style="
      position:absolute;bottom:0;right:0;
      width:14px;height:14px;border-radius:50%;
      background:${sm.color};
      border:2px solid #0d0f1a;
    "></div>
  </div>`;
}

export default function MapView({ reports, onMarkerClick, showHeatmap = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [40.416, -3.703],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          if (!destroyed)
            map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        });
      }

      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      const map = mapRef.current!;
      const currentIds = new Set(reports.map(r => r.id));

      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      reports.forEach((report) => {
        if (markersRef.current.has(report.id)) {
          // update icon (status/priority may have changed)
          const marker = markersRef.current.get(report.id)!;
          marker.setIcon(
            L.divIcon({
              className: '',
              html: markerHtml(report),
              iconSize: [52, 52],
              iconAnchor: [26, 26],
            })
          );
          return;
        }

        const icon = L.divIcon({
          className: '',
          html: markerHtml(report),
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });

        const marker = L.marker([report.lat, report.lng], { icon })
          .addTo(map)
          .on('click', () => onMarkerClick(report.id));

        markersRef.current.set(report.id, marker);
      });
    });
  }, [reports, onMarkerClick]);

  // Heatmap layer
  useEffect(() => {
    if (!mapRef.current || !showHeatmap) return;

    const points = reports.map(r => [r.lat, r.lng, 0.8] as [number, number, number]);

    import('leaflet').then(async (L) => {
      await import('leaflet.heat');
      const map = mapRef.current;
      if (!map) return;
      if (heatLayerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.removeLayer(heatLayerRef.current as any);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.2: '#2f6fb0', 0.5: '#ffc048', 1.0: '#ff4455' },
      }).addTo(map);
      heatLayerRef.current = heat;
    });
  }, [reports, showHeatmap]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
}
