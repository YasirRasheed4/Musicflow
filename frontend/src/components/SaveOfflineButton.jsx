import { useEffect, useState } from "react";
import { Check, CloudDownload } from "lucide-react";
import {
  canSaveTrackOffline,
  isTrackSavedOffline,
  removeTrackOffline,
  saveTrackOffline,
} from "../offline";

export default function SaveOfflineButton({ track }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    isTrackSavedOffline(track)
      .then((isSaved) => {
        if (active) setSaved(isSaved);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not check offline status");
      });
    return () => {
      active = false;
    };
  }, [track]);

  if (!canSaveTrackOffline(track)) return null;

  const handleClick = async () => {
    setSaving(true);
    setError("");
    try {
      if (saved) {
        await removeTrackOffline(track);
        setSaved(false);
      } else {
        await saveTrackOffline(track);
        setSaved(true);
      }
    } catch (err) {
      setError(err.message || "Could not update offline track");
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="relative">
      <button
        onClick={handleClick}
        disabled={saving}
        className="flex h-8 w-8 items-center justify-center text-muted hover:text-accent disabled:opacity-50"
        title={error || (saved ? "Remove offline copy" : "Save for offline playback")}
        aria-label={error || (saved ? `Remove ${track.title} offline copy` : `Save ${track.title} for offline playback`)}
      >
        {saved ? <Check size={16} /> : <CloudDownload size={16} />}
      </button>
      {error && <span role="alert" className="sr-only">{error}</span>}
    </span>
  );
}