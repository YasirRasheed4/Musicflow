import { Link } from "react-router-dom";
import { Play, Trash2 } from "lucide-react";
import MusicFlowIcon from "./MusicFlowIcon";

export default function Card({ to, image, title, subtitle, onPlay, onDelete }) {
  return (
    <Link to={to} className="group relative w-40 shrink-0">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface2 shadow-lg shadow-black/30">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface2 to-bg">
            <MusicFlowIcon size={42} />
          </div>
        )}
        {onPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2 right-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-accent text-bg opacity-0 shadow-lg transition duration-200 group-hover:translate-y-0 group-hover:opacity-100"
            aria-label={`Play ${title}`}
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-black/70 text-muted opacity-0 backdrop-blur-sm transition duration-200 hover:bg-rose-500 hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
            title={`Delete ${title}`}
            aria-label={`Delete ${title}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="mt-2 min-w-0">
        <p className="truncate font-medium text-ink">{title}</p>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
    </Link>
  );
}
