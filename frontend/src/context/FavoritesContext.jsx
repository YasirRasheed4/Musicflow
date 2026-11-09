import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    const res = await api.get("/favorites");
    setIds(new Set(res.tracks.map((t) => t.id)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (track) => {
      if (!user) return false;
      const isFav = ids.has(track.id);
      setIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(track.id);
        else next.add(track.id);
        return next;
      });
      try {
        if (isFav) await api.delete(`/favorites/${track.id}`);
        else await api.post(`/favorites/${track.id}`);
      } catch {
        refresh(); // resync on failure
      }
      return !isFav;
    },
    [ids, user, refresh]
  );

  return (
    <FavoritesContext.Provider value={{ ids, isFavorited: (id) => ids.has(id), toggleFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
