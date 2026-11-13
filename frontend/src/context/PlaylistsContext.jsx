import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";

const PlaylistsContext = createContext(null);

export function PlaylistsProvider({ children }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }
    const res = await api.get("/playlists");
    setPlaylists(res.playlists);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPlaylist = useCallback(
    async (name, description, isPublic) => {
      const res = await api.post("/playlists", { name, description, isPublic });
      setPlaylists((prev) => [res.playlist, ...prev]);
      return res.playlist;
    },
    []
  );

  const renamePlaylist = useCallback(async (id, name) => {
    const res = await api.patch(`/playlists/${id}`, { name });
    setPlaylists((prev) => prev.map((playlist) =>
      playlist.id === id ? { ...playlist, ...res.playlist } : playlist
    ));
    return res.playlist;
  }, []);

  const updatePlaylist = useCallback((updatedPlaylist) => {
    setPlaylists((prev) => prev.map((playlist) =>
      playlist.id === updatedPlaylist.id ? { ...playlist, ...updatedPlaylist } : playlist
    ));
  }, []);

  const deletePlaylist = useCallback(async (id) => {
    await api.delete(`/playlists/${id}`);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <PlaylistsContext.Provider value={{ playlists, refresh, createPlaylist, renamePlaylist, updatePlaylist, deletePlaylist }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) throw new Error("usePlaylists must be used within PlaylistsProvider");
  return ctx;
}
