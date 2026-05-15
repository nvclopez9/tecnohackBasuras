import { useRef, useCallback, useState } from 'react';
import { PhotoEntry } from '@/types';

interface Props {
  onCapture: (entry: PhotoEntry) => void;
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
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const full = canvas.toDataURL('image/jpeg', 0.75);

      const tCanvas = document.createElement('canvas');
      tCanvas.width = THUMB;
      tCanvas.height = THUMB;
      const tCtx = tCanvas.getContext('2d')!;
      const side = Math.min(canvas.width, canvas.height);
      const sx = (canvas.width - side) / 2;
      const sy = (canvas.height - side) / 2;
      tCtx.drawImage(canvas, sx, sy, side, side, 0, 0, THUMB, THUMB);
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

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturing(true);
    try {
      const [coords, { full, thumb }] = await Promise.all([
        getGeolocation(),
        compressImage(file),
      ]);
      const entry: PhotoEntry = {
        id: crypto.randomUUID(),
        base64: full,
        thumbnail: thumb,
        lat: coords.latitude,
        lng: coords.longitude,
        timestamp: Date.now(),
      };
      onCapture(entry);
    } catch {
      alert('No se pudo obtener la ubicación. Permite el acceso a la cámara y ubicación.');
    } finally {
      setCapturing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onCapture]);

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
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: capturing ? '#444' : '#16213e',
          color: 'white',
          fontSize: '28px',
          border: '3px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          cursor: capturing ? 'wait' : 'pointer',
          touchAction: 'manipulation',
          transition: 'background 0.2s',
        }}
        aria-label="Tomar foto"
      >
        {capturing ? '⏳' : '📷'}
      </button>
    </>
  );
}
