import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { formatTime } from "../format";
import Waveform from "./Waveform";

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3 md:px-8"
      style={{ borderTopColor: "var(--color-line)", background: "var(--color-surface)" }}
    >
      {/* Left — Track info */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:w-56 sm:flex-none">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface2 shadow">
          {currentTrack.coverUrl && (
            <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
              <Waveform />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{currentTrack.title}</p>
          <p className="truncate text-xs text-muted">{currentTrack.artistName}</p>
        </div>
      </div>

      {/* Center — Controls + Seek bar */}
      <div className="hidden flex-1 flex-col items-center gap-1.5 sm:flex" style={{ maxWidth: "480px" }}>
        <div className="flex items-center gap-5">
          <button
            onClick={prev}
            className="text-muted transition hover:text-ink"
            aria-label="Previous"
          >
            <SkipBack size={19} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full shadow-md transition hover:scale-105 active:scale-95"
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying
              ? <Pause size={19} fill="currentColor" />
              : <Play size={19} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={next}
            className="text-muted transition hover:text-ink"
            aria-label="Next"
          >
            <SkipForward size={19} fill="currentColor" />
          </button>
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="w-10 text-right font-mono text-[11px] text-muted">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 180}
            value={Math.min(progress, duration || 180)}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 cursor-pointer"
            aria-label="Seek"
          />
          <span className="w-10 font-mono text-[11px] text-muted">{formatTime(duration || 180)}</span>
        </div>
      </div>

      {/* Mobile play button */}
      <button
        onClick={togglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full shadow sm:hidden"
        style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying
          ? <Pause size={18} fill="currentColor" />
          : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Right — Volume */}
      <div className="hidden items-center gap-2 sm:flex sm:w-36">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="text-muted transition hover:text-ink"
          aria-label={volume > 0 ? "Mute" : "Unmute"}
        >
          {volume > 0 ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
