import { useState, useEffect, useCallback } from 'react';
import { User, UserStats } from '@/types';

export function useMe() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      setUser(data.user);
      setStats(data.stats);
    } catch {
      // ignorar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, stats, loading, reload: load };
}
