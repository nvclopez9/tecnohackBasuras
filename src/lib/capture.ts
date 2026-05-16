// Captura de foto: compresión a base64 + geolocalización.

export interface Capture {
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
}

// Centro de Santa Cruz de Tenerife: fallback cuando no hay GPS o se deniega.
export const SANTA_CRUZ_CENTER = { lat: 28.4682, lng: -16.2546 };

export interface GeoResult {
  lat: number;
  lng: number;
  /** true si las coordenadas son del dispositivo; false si es el fallback. */
  precise: boolean;
  /** Motivo del fallback, para mostrar un mensaje claro al usuario. */
  fallbackReason?: 'unsupported' | 'denied' | 'unavailable' | 'timeout';
}

export function compressImage(file: File): Promise<{ full: string; thumb: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen.'));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 900;
      const THUMB = 96;

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
      resolve({ full, thumb: tCanvas.toDataURL('image/jpeg', 0.6) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

export function getGeolocation(): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ...SANTA_CRUZ_CENTER, precise: false, fallbackReason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, precise: true }),
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        const reason: GeoResult['fallbackReason'] =
          err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
        resolve({ ...SANTA_CRUZ_CENTER, precise: false, fallbackReason: reason });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}
