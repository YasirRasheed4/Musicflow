import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePlaylists } from "../context/PlaylistsContext";
import { useFavorites } from "../context/FavoritesContext";
import TrackRow from "../components/TrackRow";
import Card from "../components/Card";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import ImportSpotifyModal from "../components/ImportSpotifyModal";
import { api } from "../api";

export default function Library() {
  const { user } = useAuth();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylists();
  const { toggleFavorite } = useFavorites();
  const [tab, setTab] = useState("playlists");
  const [favorites, setFavorites] = useState([]);
  const [newName, setNewName] = useState("");
  const [addTrack, setAddTrack] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && tab === "favorites") {
      api.get("/favorites").then((res) => setFavorites(res.tracks));
    }
  }, [user, tab]);

  const handleDeletePlaylist = async (p) => {
    if (window.confirm(`Are you sure you want to delete the playlist "${p.name}"?`)) {
      await deletePlaylist(p.id);
    }
  };

  const handleRemoveFavorite = async (t) => {
    await toggleFavorite(t);
    setFavorites((prev) => prev.filter((item) => item.id !== t.id));
  };

  const handleDeleteTrack = async (track) => {
    if (!window.confirm(`Delete "${track.title}"? This removes it from all playlists and favorites.`)) return;
    try {
      await api.delete(`/tracks/${track.id}`);
      setFavorites((previous) => previous.filter((item) => item.id !== track.id));
    } catch (err) {
      setError(err.message || "Failed to delete song");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="mb-2 font-display text-2xl">Your library is waiting</h1>
        <p className="mb-4 text-muted">Log in to see your playlists and favorites.</p>
        <Link to="/login" className="rounded-full bg-accent px-5 py-2 font-semibold text-bg">
          Log in
        </Link>
      </div>
    );
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPlaylist(newName.trim(), "", false);
    setNewName("");
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">Your library</h1>
          <p className="text-sm text-muted">Manage your playlists, favorites, and imported music.</p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 self-start rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition sm:self-auto"
        >
          <Sparkles size={16} /> Import from Spotify
        </button>
      </div>

      <div className="flex gap-2">
        {["playlists", "favorites"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-ink text-bg" : "bg-surface2 text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        <>
          <form onSubmit={handleCreate} className="flex max-w-sm items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist name"
              className="flex-1 rounded-lg bg-surface2 px-4 py-2 text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-bg"
              aria-label="Create playlist"
            >
              <Plus size={18} />
            </button>
          </form>

          {playlists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center">
              <p className="text-muted mb-3">No playlists yet — create one or import your favorite Spotify playlist.</p>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg"
              >
                <Sparkles size={16} /> Import Spotify Playlist
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {playlists.map((p) => (
                <Card
                  key={p.id}
                  to={`/playlists/${p.id}`}
                  image={p.coverUrl}
                  title={p.name}
                  subtitle={p.trackCount !== undefined ? `${p.trackCount} songs · ${p.isPublic ? "Public" : "Private"}` : (p.isPublic ? "Public" : "Private")}
                  onDelete={() => handleDeletePlaylist(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "favorites" && (
        <div className="flex flex-col">
          {favorites.length === 0 ? (
            <p className="text-muted">Tracks you favorite will show up here.</p>
          ) : (
            favorites.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i + 1}
                queue={favorites}
                onAddToPlaylist={setAddTrack}
                onRemove={() => handleRemoveFavorite(t)}
                onDelete={handleDeleteTrack}
              />
            ))
          )}
        </div>
      )}

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
      {showImportModal && <ImportSpotifyModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}
