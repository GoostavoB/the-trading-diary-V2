import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nav:favorites:v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Personal UI preference — nav favorites pinned to the top bar.
 * Persisted in localStorage only (no backend by design).
 */
export function useNavFavorites() {
  const [favorites, setFavorites] = useState<string[]>(read);

  // Keep multiple tabs / components in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(read());
    };
    const onLocal = () => setFavorites(read());
    window.addEventListener('storage', onStorage);
    window.addEventListener('nav-favorites-changed', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('nav-favorites-changed', onLocal);
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
    window.dispatchEvent(new Event('nav-favorites-changed'));
  }, []);

  const isFavorite = useCallback((url: string) => favorites.includes(url), [favorites]);

  const toggleFavorite = useCallback(
    (url: string) => {
      persist(favorites.includes(url) ? favorites.filter((u) => u !== url) : [...favorites, url]);
    },
    [favorites, persist]
  );

  return { favorites, isFavorite, toggleFavorite };
}
