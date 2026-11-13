import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Play, Trash2, UploadCloud } from "lucide-react";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";

const MAX_COVER_FILE_BYTES = 10 * 1024 * 1024;
const MAX_COVER_IMAGE_BYTES = 512 * 1024;

async function compressCoverImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > MAX_COVER_FILE_BYTES) {
    throw new Error("Choose an image smaller than 10 MB.");
  }

  const image = await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(element);
    };
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be opened."));
    };
    element.src = objectUrl;
  });

  const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("Your browser could not compress this image.");
  if (blob.size > MAX_COVER_IMAGE_BYTES) {
    throw new Error("The compressed cover must be 512 KB or smaller. Try a smaller image.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The compressed image could not be read."));
    reader.readAsDataURL(blob);
  });
}

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const coverInputRef = useRef(null);
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
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-ink hover:bg-line disabled:opacity-50"
              >
                <UploadCloud size={16} /> {uploadingCover ? "Uploading cover..." : "Change cover photo"}
              </button>
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
