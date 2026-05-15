import { useEffect, useCallback } from 'react';
import { PhotoEntry } from '@/types';

interface Props {
  photos: PhotoEntry[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({ photos, currentIndex, onClose, onNavigate }: Props) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!photo) return null;

  const date = new Date(photo.timestamp).toLocaleString('es-ES');
  const coords = `${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}`;

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    padding: '0.6rem 1.4rem',
    background: enabled ? '#16213e' : '#333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.4,
    touchAction: 'manipulation',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '560px' }}
      >
        <img
          src={photo.base64}
          alt={`Foto en ${coords}`}
          style={{
            width: '100%',
            borderRadius: '10px',
            display: 'block',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        />
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          margin: '0.6rem 0 0',
          fontSize: '0.85rem',
        }}>
          {date} · {coords}
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          fontSize: '0.75rem',
          margin: '0.2rem 0 0',
        }}>
          {currentIndex + 1} / {photos.length}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1rem',
          gap: '0.5rem',
        }}>
          <button
            onClick={() => hasPrev && onNavigate(currentIndex - 1)}
            style={btnStyle(hasPrev)}
          >
            ← Anterior
          </button>
          <button onClick={onClose} style={{ ...btnStyle(true), background: '#555' }}>
            Cerrar
          </button>
          <button
            onClick={() => hasNext && onNavigate(currentIndex + 1)}
            style={btnStyle(hasNext)}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
