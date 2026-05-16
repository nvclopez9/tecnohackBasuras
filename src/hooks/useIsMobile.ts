import { useState, useEffect } from 'react';

// Detecta si el viewport está por debajo del breakpoint (modo móvil).
// Usa matchMedia: refleja el viewport CSS de forma fiable y reacciona a
// cambios de tamaño y a la emulación de dispositivo. Devuelve false en SSR.
export function useIsMobile(breakpoint = 900): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [breakpoint]);

  return isMobile;
}
