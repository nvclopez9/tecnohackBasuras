import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import Head from 'next/head';
import CameraButton from '@/components/CameraButton';
import PhotoLightbox from '@/components/PhotoLightbox';
import { usePhotos } from '@/hooks/usePhotos';
import { PhotoEntry, LightboxState } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '1.1rem',
    }}>
      Cargando mapa…
    </div>
  ),
});

export default function HomePage() {
  const { photos, addPhoto } = usePhotos();
  const [lightbox, setLightbox] = useState<LightboxState>({ isOpen: false, currentIndex: 0 });

  const handleCapture = useCallback(async (entry: PhotoEntry) => {
    await addPhoto(entry);
  }, [addPhoto]);

  const openLightbox = useCallback((index: number) => {
    setLightbox({ isOpen: true, currentIndex: index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, isOpen: false }));
  }, []);

  const navigateLightbox = useCallback((index: number) => {
    setLightbox({ isOpen: true, currentIndex: index });
  }, []);

  return (
    <>
      <Head>
        <title>EcoChicharro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Mapa de fotos geolocalizadas" />
      </Head>
      <MapView photos={photos} onMarkerClick={openLightbox} />
      <CameraButton onCapture={handleCapture} />
      {lightbox.isOpen && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightbox.currentIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}
