import { useEffect, useRef } from 'react';
import type { Map as LMap, Marker } from 'leaflet';
import { PhotoEntry } from '@/types';

interface Props {
  photos: PhotoEntry[];
  onMarkerClick: (index: number) => void;
}

export default function MapView({ photos, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          if (!destroyed) map.setView([pos.coords.latitude, pos.coords.longitude], 15);
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
      const currentIds = new Set(photos.map(p => p.id));

      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      photos.forEach((photo, index) => {
        if (markersRef.current.has(photo.id)) return;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
              width:52px;height:52px;
              border-radius:50%;
              overflow:hidden;
              border:3px solid #16213e;
              box-shadow:0 2px 10px rgba(0,0,0,0.55);
              cursor:pointer;
              background:#ccc;
            ">
              <img src="${photo.thumbnail}"
                   width="52" height="52"
                   style="object-fit:cover;display:block;"
                   alt="" />
            </div>`,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });

        const marker = L.marker([photo.lat, photo.lng], { icon })
          .addTo(map)
          .on('click', () => onMarkerClick(index));

        markersRef.current.set(photo.id, marker);
      });
    });
  }, [photos, onMarkerClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        height: '100dvh' as string,
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    />
  );
}
