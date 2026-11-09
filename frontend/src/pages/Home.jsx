import { useEffect, useState, useCallback } from "react";
import Card from "../components/Card";
import TrackRow from "../components/TrackRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";
import { usePlayer } from "../context/PlayerContext";

export default function Home() {
  const [playlists, setPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [addTrack, setAddTrack] = useState(null);
  const { playTrack } = usePlayer();

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

  return (
    <div className="flex flex-col gap-10 pb-10">
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
              <TrackRow key={t.id} track={t} index={i + 1} queue={tracks} onAddToPlaylist={setAddTrack} />
            ))}
          </div>
        </section>
      )}

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
    </div>
  );
}
