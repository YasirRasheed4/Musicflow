import { useEffect, useState, useCallback } from "react";
import Card from "../components/Card";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { usePlaylists } from "../context/PlaylistsContext";

export default function Home() {
  const [playlists, setPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const [error, setError] = useState("");
  const { playTrack } = usePlayer();
  const { user } = useAuth();
  const { renamePlaylist } = usePlaylists();

  useEffect(() => {
    api.get("/playlists/public").then(async (res) => {
      const detailed = await Promise.all(res.playlists.map((p) => api.get(`/playlists/${p.id}`)));
      setPlaylists(detailed.map((d) => ({ ...d.playlist, tracks: d.tracks })));
    });
    api.get("/albums").then((res) => setAlbums(res.albums));
    api.get("/tracks?limit=8").then((res) => setTracks(res.tracks));
  }, []);

  const playAlbum = useCallback(
    async (id) => {
      const res = await api.get(`/albums/${id}`);
      if (res.tracks.length) playTrack(res.tracks[0], res.tracks);
    },
    [playTrack]
  );

  const handleDeleteAlbum = async (album) => {
    if (!window.confirm(`Delete "${album.title}" and all of its songs?`)) return;
    try {
      await api.delete(`/albums/${album.id}`);
      setAlbums((previous) => previous.filter((item) => item.id !== album.id));
      setTracks((previous) => previous.filter((track) => track.albumId !== album.id));
    } catch (err) {
      setError(err.message || "Failed to delete album");
    }
  };

  const handleRenamePlaylist = async (playlist) => {
    const name = window.prompt("Enter a new playlist name", playlist.name);
    if (name === null || !name.trim()) return;
    try {
      const updatedPlaylist = await renamePlaylist(playlist.id, name);
      setPlaylists((previous) => previous.map((item) =>
        item.id === playlist.id ? { ...item, ...updatedPlaylist } : item
      ));
    } catch (err) {
      setError(err.message || "Failed to rename playlist");
    }
  };

  const handleRenameAlbum = async (album) => {
    const title = window.prompt("Enter a new album name", album.title);
    if (title === null || !title.trim()) return;
    try {
      const { album: updatedAlbum } = await api.patch(`/albums/${album.id}`, { title });
      setAlbums((previous) => previous.map((item) => item.id === album.id ? updatedAlbum : item));
      setTracks((previous) => previous.map((track) =>
        track.albumId === album.id ? { ...track, albumTitle: updatedAlbum.title } : track
      ));
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

  return (
    <div className="flex flex-col gap-10 pb-10">
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div>
        <h1 className="font-display text-3xl">Good listening.</h1>
        <p className="text-muted">Editorial picks and new arrivals, for tonight.</p>
      </div>

      {playlists.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Tonight's Rotation</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {playlists.map((p) => (
              <Card
                key={p.id}
                to={`/playlists/${p.id}`}
                image={p.tracks[0]?.coverUrl}
                title={p.name}
                subtitle={p.description}
                onPlay={() => p.tracks.length && playTrack(p.tracks[0], p.tracks)}
                onRename={user && user.id === p.userId ? () => handleRenamePlaylist(p) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">New Releases</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {albums.map((a) => (
              <Card
                key={a.id}
                to={`/albums/${a.id}`}
                image={a.coverUrl}
                title={a.title}
                subtitle={a.artistName}
                onPlay={() => playAlbum(a.id)}
                onDelete={user ? () => handleDeleteAlbum(a) : undefined}
                onRename={user ? () => handleRenameAlbum(a) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Fresh Tracks</h2>
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
        </section>
      )}

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
    </div>
  );
}
