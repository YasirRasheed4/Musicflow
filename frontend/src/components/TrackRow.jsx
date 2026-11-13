import { Heart, Play, Plus, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import Waveform from "./Waveform";
import { formatTime } from "../format";

export default function TrackRow({ track, index, queue, onAddToPlaylist, onRemove, onDelete }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isActive = currentTrack?.id === track.id;
  const favorited = isFavorited(track.id);

  const handlePlayClick = () => {
    if (isActive) togglePlay();
    else playTrack(track, queue && queue.length ? queue : [track]);
  };

  const handleHeart = () => {
    if (!user) return navigate("/login");
    toggleFavorite(track);
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface2 ${
        isActive ? "text-accent" : "text-ink"
      }`}
    >
      <button
        onClick={handlePlayClick}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-muted group-hover:text-ink"
        aria-label={isActive && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {isActive && isPlaying ? (
          <Waveform />
        ) : (
          <>
            <span className="text-sm group-hover:hidden">{index}</span>
            <Play size={16} className="hidden group-hover:block" />
          </>
        )}
      </button>

      <button onClick={handlePlayClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <img src={track.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
        <span className="min-w-0">
          <span className="block truncate font-medium leading-tight">{track.title}</span>
          <span className="block truncate text-sm text-muted leading-tight">{track.artistName}</span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={handleHeart}
          className={favorited ? "flex h-8 w-8 items-center justify-center text-accent" : "flex h-8 w-8 items-center justify-center text-muted hover:text-ink"}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={16} fill={favorited ? "currentColor" : "none"} />
        </button>

        {onAddToPlaylist && user && (
          <button
            onClick={() => onAddToPlaylist(track)}
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
            aria-label="Add to playlist"
          >
            <Plus size={16} />
          </button>
        )}

        {track.isDownloadable ? (
          <a
            href={track.audioUrl}
            download
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
            aria-label="Download"
          >
            <Download size={16} />
          </a>
        ) : (
          <span className="block w-8" />
        )}

        <span className="w-12 text-right font-mono text-sm text-muted">{formatTime(track.duration)}</span>

        {onRemove && (
          <button
            onClick={() => onRemove(track)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400 transition"
            title={`Remove "${track.title}" from this playlist`}
            aria-label={`Remove ${track.title} from this playlist`}
          >
            <Trash2 size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(track)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400 transition"
            title={`Delete "${track.title}"`}
            aria-label={`Delete ${track.title}`}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
