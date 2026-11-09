import { useState } from "react";
import { X, Plus } from "lucide-react";
import { usePlaylists } from "../context/PlaylistsContext";
import { api } from "../api";

export default function AddToPlaylistModal({ track, onClose }) {
  const { playlists, createPlaylist } = usePlaylists();
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [creating, setCreating] = useState(false);

  const addTo = async (playlistId) => {
    setBusyId(playlistId);
    try {
      await api.post(`/playlists/${playlistId}/tracks`, { trackId: track.id });
      setAddedIds((prev) => new Set(prev).add(playlistId));
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const playlist = await createPlaylist(newName.trim(), "", false);
      await addTo(playlist.id);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Add to playlist</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 truncate text-sm text-muted">
          {track.title} — {track.artistName}
        </p>

        <div className="mb-4 max-h-52 space-y-1 overflow-y-auto">
          {playlists.length === 0 && <p className="text-sm text-muted">You don't have any playlists yet.</p>}
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => addTo(p.id)}
              disabled={busyId === p.id}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2"
            >
              <span className="truncate">{p.name}</span>
              <span className="text-xs text-accent">
                {addedIds.has(p.id) ? "Added" : busyId === p.id ? "..." : ""}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleCreate} className="flex items-center gap-2 border-t border-line pt-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 rounded-lg bg-surface2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-bg disabled:opacity-50"
            aria-label="Create playlist"
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
