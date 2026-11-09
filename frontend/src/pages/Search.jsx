import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import TrackRow from "../components/TrackRow";
import Card from "../components/Card";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { api } from "../api";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [results, setResults] = useState({ tracks: [], albums: [], artists: [] });
  const [addTrack, setAddTrack] = useState(null);

  useEffect(() => {
    const q = query.trim();
    const timeout = setTimeout(() => {
      setParams(q ? { q } : {}, { replace: true });
      if (!q) {
        setResults({ tracks: [], albums: [], artists: [] });
        return;
      }
      api.get(`/search?q=${encodeURIComponent(q)}`).then(setResults);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasResults = results.tracks.length || results.albums.length || results.artists.length;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="relative max-w-lg">
        <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, albums, artists"
          className="w-full rounded-full bg-surface2 py-3 pl-10 pr-4 text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      {query.trim() && !hasResults && <p className="text-muted">Nothing matching "{query}" — try a different search.</p>}

      {results.tracks.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-xl">Songs</h2>
          <div className="flex flex-col">
            {results.tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i + 1} queue={results.tracks} onAddToPlaylist={setAddTrack} />
            ))}
          </div>
        </section>
      )}

      {results.albums.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Albums</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {results.albums.map((a) => (
              <Card key={a.id} to={`/albums/${a.id}`} image={a.coverUrl} title={a.title} subtitle={a.artistName} />
            ))}
          </div>
        </section>
      )}

      {results.artists.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Artists</h2>
          <div className="flex flex-col gap-2">
            {results.artists.map((a) => (
              <div key={a.id} className="rounded-lg bg-surface px-4 py-3">
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-muted">{a.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {addTrack && <AddToPlaylistModal track={addTrack} onClose={() => setAddTrack(null)} />}
    </div>
  );
}
