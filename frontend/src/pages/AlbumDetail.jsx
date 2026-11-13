import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Play, Trash2 } from "lucide-react";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const [error, setError] = useState("");
  const { playTrack } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    setAlbum(null);
    api.get(`/albums/${id}`).then((res) => {
      setAlbum(res.album);
      setTracks(res.tracks);
    });
  }, [id]);

  const handleDeleteAlbum = async () => {
    if (!window.confirm(`Delete "${album.title}" and all of its songs?`)) return;
    try {
      await api.delete(`/albums/${album.id}`);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete album");
    }
  };

  const handleRenameAlbum = async () => {
    const title = window.prompt("Enter a new album name", album.title);
    if (title === null || !title.trim()) return;
    try {
      const { album: updatedAlbum } = await api.patch(`/albums/${album.id}`, { title });
      setAlbum(updatedAlbum);
      setTracks((previous) => previous.map((track) => ({ ...track, albumTitle: updatedAlbum.title })));
    } catch (err) {
      setError(err.message || "Failed to rename album");
    }
  };

  const handleDeleteTrack = async (track) => {
    if (!window.confirm(`Delete "${track.title}"? This removes it from all playlists and favorites.`)) return;
    try {
      await api.delete(`/tracks/${track.id}`);
      setTracks((previous) => previous.filter((item) => item.id !== track.id));
    } catch (err) {
      setError(err.message || "Failed to delete song");
    }
  };

  if (!album) return null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
        <img src={album.coverUrl} alt="" className="h-48 w-48 rounded-xl object-cover shadow-2xl shadow-black/40" />
        <div className="text-center sm:text-left">
          <p className="text-sm uppercase tracking-wide text-muted">Album</p>
          <h1 className="font-display text-4xl">{album.title}</h1>
          <p className="mt-1 text-muted">
            {album.artistName} · {album.releaseDate?.slice(0, 4)} · {album.label}
          </p>
          <button
            onClick={() => tracks.length && playTrack(tracks[0], tracks)}
            className="mt-4 flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-bg"
          >
            <Play size={16} fill="currentColor" /> Play
          </button>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleRenameAlbum}
                className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink hover:bg-line"
              >
                <Pencil size={16} /> Rename album
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 size={16} /> Delete album
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i + 1}
            queue={tracks}
            onAddToPlaylist={setAddTrack}
            onDelete={user ? handleDeleteTrack : undefined}
          />
        ))}
      </div>

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
    </div>
  );
}
