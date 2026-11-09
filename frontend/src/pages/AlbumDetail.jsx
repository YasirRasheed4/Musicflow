import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Play } from "lucide-react";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";

export default function AlbumDetail() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    setAlbum(null);
    api.get(`/albums/${id}`).then((res) => {
      setAlbum(res.album);
      setTracks(res.tracks);
    });
  }, [id]);

  if (!album) return null;

  return (
    <div className="flex flex-col gap-6 pb-10">
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
        </div>
      </div>

      <div className="flex flex-col">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i + 1} queue={tracks} onAddToPlaylist={setAddTrack} />
        ))}
      </div>

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
    </div>
  );
}
