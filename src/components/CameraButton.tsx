import { useRef, useCallback, useState } from 'react';

export interface CaptureResult {
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
}

interface Props {
  onCapture: (result: CaptureResult) => void;
}

async function compressImage(file: File): Promise<{ full: string; thumb: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      const THUMB = 80;

      const canvas = document.createElement('canvas');
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const full = canvas.toDataURL('image/jpeg', 0.75);

      const tCanvas = document.createElement('canvas');
      tCanvas.width = THUMB;
      tCanvas.height = THUMB;
      const tCtx = tCanvas.getContext('2d')!;
      const side = Math.min(canvas.width, canvas.height);
      tCtx.drawImage(
        canvas,
        (canvas.width - side) / 2,
        (canvas.height - side) / 2,
        side, side, 0, 0, THUMB, THUMB
      );
      const thumb = tCanvas.toDataURL('image/jpeg', 0.6);
      resolve({ full, thumb });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function getGeolocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export default function CameraButton({ onCapture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [capturing, setCapturing] = useState(false);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCapturing(true);
      try {
        const [coords, { full, thumb }] = await Promise.all([
          getGeolocation(),
          compressImage(file),
        ]);
        onCapture({
          photo: full,
          thumbnail: thumb,
          lat: coords.latitude,
          lng: coords.longitude,
        });
      } catch {
        alert(
          'No se pudo obtener la ubicación. Permite el acceso a la cámara y a la ubicación.'
        );
      } finally {
        setCapturing(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onCapture]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={capturing}
        aria-label="Reportar incidencia"
        style={{
          position: 'fixed',
          bottom: '1.8rem',
          right: '1.5rem',
          zIndex: 900,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: capturing ? '#333' : 'var(--accent)',
          color: capturing ? '#888' : '#0d0f1a',
          fontSize: '26px',
          border: 'none',
          boxShadow: capturing
            ? 'none'
            : '0 0 0 4px rgba(0,255,136,0.2), 0 4px 20px rgba(0,255,136,0.4)',
          cursor: capturing ? 'wait' : 'pointer',
          touchAction: 'manipulation',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {capturing ? '⏳' : '📷'}
      </button>
    </>
  );
}
