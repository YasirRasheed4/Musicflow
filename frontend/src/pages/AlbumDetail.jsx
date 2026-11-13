import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, CloudDownload, ListPlus, Pencil, Play, Trash2, UploadCloud } from "lucide-react";
import OverflowMenu from "../components/OverflowMenu";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import compressCoverImage from "../compressCoverImage";
import { getAlbumOfflineStatus, saveAlbumOffline } from "../offline";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { usePlaylists } from "../context/PlaylistsContext";

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [offlineStatus, setOfflineStatus] = useState({ totalCount: 0, availableCount: 0, savedCount: 0 });
  const [savingOffline, setSavingOffline] = useState(false);
  const [addingAlbumPlaylist, setAddingAlbumPlaylist] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState({ completed: 0, total: 0 });
  const [offlineNotice, setOfflineNotice] = useState(null);
  const coverInputRef = useRef(null);
  const { playTrack } = usePlayer();
  const { user } = useAuth();
  const { refresh: refreshPlaylists } = usePlaylists();

  useEffect(() => {
    setAlbum(null);
    api.get(`/albums/${id}`).then((res) => {
      setAlbum(res.album);
      setTracks(res.tracks);
    });
  }, [id]);

  useEffect(() => {
    let active = true;
    getAlbumOfflineStatus(tracks)
      .then((status) => {
        if (active) setOfflineStatus(status);
      })
      .catch((err) => {
        if (active) setOfflineNotice({ text: err.message || "Could not check offline status", isError: true });
      });
    return () => {
      active = false;
    };
  }, [tracks]);

  const handleDeleteAlbum = async () => {
    if (!window.confirm(`Delete "${album.title}" and all of its songs?`)) return;
    try {
      await api.delete(`/albums/${album.id}`);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete album");
    }
  };

  const handleAddAlbumToPlaylists = async () => {
    setAddingAlbumPlaylist(true);
    setError("");
    try {
      const { playlist } = await api.post(`/albums/${album.id}/playlist`, {});
      await refreshPlaylists();
      navigate(`/playlists/${playlist.id}`);
    } catch (err) {
      setError(err.message || "Failed to add album to Playlists");
    } finally {
      setAddingAlbumPlaylist(false);
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

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingCover(true);
    try {
      const coverUrl = await compressCoverImage(file);
      const { album: updatedAlbum } = await api.patch(`/albums/${album.id}`, { coverUrl });
      setAlbum(updatedAlbum);
      setTracks((previous) => previous.map((track) => ({ ...track, coverUrl: updatedAlbum.coverUrl })));
    } catch (err) {
      setError(err.message || "Failed to update album cover");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
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

  const handleSaveOffline = async () => {
    setSavingOffline(true);
    setOfflineNotice(null);
    setOfflineProgress({ completed: 0, total: tracks.length });
    try {
      const result = await saveAlbumOffline(tracks, (completed, total) => {
        setOfflineProgress({ completed, total });
      });
      const status = await getAlbumOfflineStatus(tracks);
      setOfflineStatus(status);

      const messages = [];
      if (result.skippedCount) {
        messages.push(`${result.skippedCount} track(s) do not have an offline-capable audio source.`);
      }
      if (result.failures.length) {
        messages.push(`${result.failures.length} track(s) could not be cached.`);
      }
      const failure = result.failures[0];
      setOfflineNotice({
        text: [
          `Saved ${result.savedCount} of ${tracks.length} track(s) for offline playback.`,
          ...messages,
          ...(failure ? [`${failure.track.title}: ${failure.error.message}`] : []),
        ].join(" "),
        isError: result.failures.length > 0 || result.skippedCount > 0,
      });
    } catch (err) {
      setOfflineNotice({ text: err.message || "Could not save this album offline", isError: true });
    } finally {
      setSavingOffline(false);
    }
  };

  if (!album) return null;

  const isOfflineComplete =
    offlineStatus.availableCount > 0 && offlineStatus.savedCount === offlineStatus.availableCount;
  const offlineActionLabel = savingOffline
    ? `Saving offline ${offlineProgress.completed}/${offlineProgress.total}`
    : offlineStatus.availableCount === 0
      ? "Offline not available"
      : isOfflineComplete
        ? `Saved offline (${offlineStatus.savedCount}/${offlineStatus.availableCount})`
        : "Save album offline";
  const albumActions = [
    {
      id: "save-offline",
      label: offlineActionLabel,
      icon: isOfflineComplete ? Check : CloudDownload,
      onClick: handleSaveOffline,
      disabled:
        savingOffline ||
        offlineStatus.availableCount === 0 ||
        isOfflineComplete,
    },
    ...(user
      ? [
          {
            id: "change-cover",
            label: uploadingCover ? "Uploading cover..." : "Change cover photo",
            icon: UploadCloud,
            onClick: () => coverInputRef.current?.click(),
            disabled: uploadingCover,
          },
          { id: "rename", label: "Rename album", icon: Pencil, onClick: handleRenameAlbum },
          {
            id: "delete",
            label: "Delete album",
            icon: Trash2,
            onClick: handleDeleteAlbum,
            destructive: true,
          },
        ]
      : []),
  ];

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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <button
              onClick={() => tracks.length && playTrack(tracks[0], tracks)}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-bg"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            {user && (
              <button
                type="button"
                onClick={handleAddAlbumToPlaylists}
                disabled={addingAlbumPlaylist || !tracks.length}
                className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                <ListPlus size={16} />
                {addingAlbumPlaylist ? "Adding playlist..." : "Add album to Playlists"}
              </button>
            )}
            {user && (
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            )}
            <OverflowMenu actions={albumActions} label="Album actions" />
          </div>
          {(savingOffline || offlineNotice) && (
            <p
              role={offlineNotice?.isError ? "alert" : "status"}
              className={`mt-2 text-sm ${offlineNotice?.isError ? "text-rose-400" : "text-muted"}`}
            >
              {savingOffline
                ? `Saving album offline: ${offlineProgress.completed}/${offlineProgress.total} tracks`
                : offlineNotice?.text}
            </p>
          )}
          {tracks.length > 0 && offlineStatus.availableCount === 0 && !offlineNotice && (
            <p className="mt-2 text-sm text-muted">
                Offline saving is not supported for this album&apos;s audio source.
            </p>
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
