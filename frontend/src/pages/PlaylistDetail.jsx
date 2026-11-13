import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { Pencil, Play, Plus, Trash2, Download } from "lucide-react";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import ImportSpotifyModal from "../components/ImportSpotifyModal";
import MusicFlowIcon from "../components/MusicFlowIcon";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { usePlaylists } from "../context/PlaylistsContext";

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { renamePlaylist, deletePlaylist } = usePlaylists();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState("");
  const [addTrack, setAddTrack] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { playTrack } = usePlayer();

  const load = useCallback(() => {
    setError("");
    setPlaylist(null);
    api
      .get(`/playlists/${id}`)
      .then((res) => {
        setPlaylist(res.playlist);
        setTracks(res.tracks);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = user && playlist && user.id === playlist.userId;

  const handleRemove = async (track) => {
    const res = await api.delete(`/playlists/${id}/tracks/${track.id}`);
    setTracks(res.tracks);
  };

  const handleDeleteTrack = async (track) => {
    if (!window.confirm(`Delete "${track.title}" from the catalog and all playlists?`)) return;
    try {
      await api.delete(`/tracks/${track.id}`);
      setTracks((previous) => previous.filter((item) => item.id !== track.id));
    } catch (err) {
      setError(err.message || "Failed to delete song");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) return;
    setDeleting(true);
    try {
      await deletePlaylist(playlist.id);
      navigate("/library");
    } catch (err) {
      setError(err.message || "Failed to delete playlist");
      setDeleting(false);
    }
  };

  const handleRename = async () => {
    const name = window.prompt("Enter a new playlist name", playlist.name);
    if (name === null || !name.trim()) return;
    try {
      const updatedPlaylist = await renamePlaylist(playlist.id, name);
      setPlaylist((previous) => ({ ...previous, ...updatedPlaylist }));
    } catch (err) {
      setError(err.message || "Failed to rename playlist");
    }
  };

  const handleDownload = async () => {
    const downloadableTracks = tracks.filter((track) => track.isDownloadable && track.audioUrl);
    if (!downloadableTracks.length) {
      setError("This playlist has no downloadable songs.");
      return;
    }

    setDownloading(true);
    setError("");
    try {
      const zip = new JSZip();
      const skipped = [];
      for (const track of downloadableTracks) {
        try {
          const response = await fetch(track.audioUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const audio = await response.blob();
          const filename = `${String(track.title).replace(/[\\/:*?"<>|]/g, "-")}.wav`;
          zip.file(filename, audio);
        } catch {
          skipped.push(track.title);
        }
      }

      if (zip.file(/.*/).length === 0) {
        throw new Error("None of the songs could be downloaded.");
      }

      const archive = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${playlist.name.replace(/[\\/:*?"<>|]/g, "-")}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (skipped.length) setError(`Some songs could not be downloaded: ${skipped.join(", ")}`);
    } catch (err) {
      setError(err.message || "Failed to download playlist");
    } finally {
      setDownloading(false);
    }
  };

  if (!playlist) return error ? <p className="text-muted">{error}</p> : null;

  const coverUrl = playlist.coverUrl || tracks[0]?.coverUrl;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-48 w-48 rounded-xl object-cover shadow-2xl shadow-black/40"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-surface2 shadow-2xl shadow-black/40">
            <MusicFlowIcon size={56} />
          </div>
        )}
        <div className="text-center sm:text-left">
          <p className="text-sm uppercase tracking-wide text-muted">
            {playlist.isPublic ? "Public Playlist" : "Personal Playlist"} · {tracks.length} songs
          </p>
          <h1 className="font-display text-4xl font-bold">{playlist.name}</h1>
          {playlist.description && <p className="mt-1 max-w-xl text-muted text-sm">{playlist.description}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {tracks.length > 0 && (
              <button
                onClick={() => playTrack(tracks[0], tracks)}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-bg hover:opacity-90 transition"
              >
                <Play size={16} fill="currentColor" /> Play
              </button>
            )}
            {tracks.some((track) => track.isDownloadable) && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition disabled:opacity-50"
              >
                <Download size={16} /> {downloading ? "Preparing..." : "Download Playlist"}
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={handleRename}
                  className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition"
                >
                  <Pencil size={16} /> Rename Playlist
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition"
                >
                  <Plus size={16} /> Add Songs
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50"
                  title="Delete playlist"
                >
                  <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete Playlist"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {tracks.length === 0 ? (
          <p className="text-muted">No tracks yet — add some from any track's + button.</p>
        ) : (
          tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i + 1}
              queue={tracks}
              onAddToPlaylist={setAddTrack}
              onRemove={isOwner ? handleRemove : undefined}
              onDelete={user ? handleDeleteTrack : undefined}
            />
          ))
        )}
      </div>

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
      {showAddModal && (
        <ImportSpotifyModal
          defaultPlaylistId={playlist.id}
          onClose={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
