import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useState, useEffect, useCallback } from 'react';
import { PhotoEntry } from '@/types';

interface EcoDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'eco-chicharro-db';
const DB_VERSION = 1;
const STORE = 'photos' as const;

let dbPromise: Promise<IDBPDatabase<EcoDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EcoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const db = await getDB();
    const all = await db.getAllFromIndex(STORE, 'by-timestamp');
    setPhotos(all.reverse());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addPhoto = useCallback(async (entry: PhotoEntry) => {
    const db = await getDB();
    await db.put(STORE, entry);
    setPhotos(prev => [entry, ...prev]);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    const db = await getDB();
    await db.delete(STORE, id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  return { photos, loading, addPhoto, deletePhoto };
}
