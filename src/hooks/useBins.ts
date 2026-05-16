import { useState, useEffect } from 'react';
import { Bin } from '@/types';

export function useBins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/bins')
      .then(r => r.json())
      .then(data => {
        if (active) setBins(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { bins, loading };
}
