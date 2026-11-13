import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Music, Loader2, Plus, CheckCircle, UploadCloud, Radio } from "lucide-react";
import { api } from "../api";
import { usePlaylists } from "../context/PlaylistsContext";
import { formatTime } from "../format";
import {
  beginSpotifyAuthorization,
  finishSpotifyAuthorization,
  getSpotifyAccessToken,
  hasSpotifySession,
  isSpotifyConfigured,
} from "../spotifyAuth";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  "aac",
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "ogg",
  "opus",
  "wav",
  "webm",
]);
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
]);

function isSupportedAudioFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.has(extension) || SUPPORTED_AUDIO_TYPES.has(file.type);
}

function getFileAlbumName(file) {
  const pathParts = file.webkitRelativePath?.split("/").filter(Boolean) || [];
  return pathParts.length > 1 ? pathParts[pathParts.length - 2] : pathParts[0] || "";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Could not read "${file.name}".`));
        return;
      }
      const base64Data = reader.result.split(",")[1];
      if (!base64Data) {
        reject(new Error(`"${file.name}" is empty or invalid.`));
        return;
      }
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export default function ImportSpotifyModal({
  onClose,
  onAlbumsChanged,
  defaultPlaylistId,
  initialTab = "spotify",
}) {
  const navigate = useNavigate();
  const { playlists, refresh } = usePlaylists();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [url, setUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [customName, setCustomName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [spotifyConnected, setSpotifyConnected] = useState(hasSpotifySession());
  const [connectingSpotify, setConnectingSpotify] = useState(false);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileTitle, setFileTitle] = useState("");
  const [fileArtist, setFileArtist] = useState("");
  const [fileAlbum, setFileAlbum] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectionNotice, setSelectionNotice] = useState("");

  // Custom song form state
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customAlbum, setCustomAlbum] = useState("");
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [targetPlaylistId, setTargetPlaylistId] = useState(defaultPlaylistId || "");

  const handlePreview = async (inputUrl, connectedToken) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) {
      setError("Please paste a Spotify URL or URI");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoadingPreview(true);

    try {
      const spotifyToken = connectedToken || await getSpotifyAccessToken();
      const options = spotifyToken
        ? { headers: { "X-Spotify-Access-Token": spotifyToken } }
        : {};
      const res = await api.post("/spotify/preview", { url: targetUrl.trim() }, options);
      setPreview(res);
      setCustomName(res.name || res.title || "");
    } catch (err) {
      setError(err.message || "Could not fetch Spotify preview. Please check the URL.");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConnectSpotify = async () => {
    setError("");
    setConnectingSpotify(true);
    let popup;
    let pollId;
    let timeoutId;

    try {
      popup = await beginSpotifyAuthorization();
      const spotifyToken = await new Promise((resolve, reject) => {
        let finished = false;
        const cleanup = () => {
          window.removeEventListener("message", handleMessage);
          window.clearInterval(pollId);
          window.clearTimeout(timeoutId);
        };
        const finish = (callback, value) => {
          if (finished) return;
          finished = true;
          cleanup();
          callback(value);
        };
        const handleMessage = async (event) => {
          if (
            event.origin !== window.location.origin ||
            event.source !== popup ||
            event.data?.type !== "musicflow-spotify-oauth"
          ) {
            return;
          }
          try {
            finish(resolve, await finishSpotifyAuthorization(event.data));
          } catch (error) {
            finish(reject, error);
          }
        };

        window.addEventListener("message", handleMessage);
        pollId = window.setInterval(() => {
          if (popup.closed) finish(reject, new Error("Spotify sign-in was closed before it finished."));
        }, 500);
        timeoutId = window.setTimeout(
          () => finish(reject, new Error("Spotify sign-in timed out. Please try again.")),
          5 * 60 * 1000
        );
      });

      setSpotifyConnected(true);
      if (url.trim()) await handlePreview(url.trim(), spotifyToken);
    } catch (err) {
      if (popup && !popup.closed) popup.close();
      setError(err.message || "Could not connect to Spotify.");
    } finally {
      setConnectingSpotify(false);
    }
  };

  const handleImportSpotify = async () => {
    if (!preview) return;
    setError("");
    setImporting(true);

    try {
      if (preview.type === "playlist" || preview.type === "album") {
        const spotifyToken = preview.type === "playlist" ? await getSpotifyAccessToken() : null;
        const options = spotifyToken
          ? { headers: { "X-Spotify-Access-Token": spotifyToken } }
          : {};
        const res = await api.post("/spotify/import-playlist", {
          url: url.trim(),
          name: customName.trim() || preview.name,
          isPublic,
        }, options);
        await refresh();
        await onAlbumsChanged?.();
        setSuccessMsg(`Successfully imported "${res.playlist.name}". Spotify playback uses previews.`);
        setTimeout(() => {
          onClose();
          navigate(`/playlists/${res.playlist.id}`);
        }, 1000);
      } else if (preview.type === "track") {
        const res = await api.post("/spotify/import-track", {
          url: url.trim(),
          playlistId: targetPlaylistId || undefined,
        });
        await refresh();
        await onAlbumsChanged?.();
        setSuccessMsg(`Added "${res.track.title}". Spotify playback uses previews.`);
        setTimeout(() => {
          onClose();
          if (targetPlaylistId) navigate(`/playlists/${targetPlaylistId}`);
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Failed to import from Spotify");
    } finally {
      setImporting(false);
    }
  };

  const selectAudioFiles = (fileList, input) => {
    const files = Array.from(fileList || []);
    if (input) input.value = "";
    if (!files.length) return;

    const supportedFiles = files.filter(isSupportedAudioFile);
    const selected = supportedFiles.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const skippedCount = files.length - selected.length;
    if (!selected.length) {
      setSelectedFiles([]);
      setSelectionNotice("");
      setError(
        supportedFiles.length
          ? "Audio files must be 3 MB or smaller."
          : "No supported audio files were found in that selection."
      );
      return;
    }

    setError("");
    setSelectedFiles(selected);
    setFileTitle(selected.length === 1 ? selected[0].name.replace(/\.[^/.]+$/, "") : "");
    setSelectionNotice(
      skippedCount ? `Skipped ${skippedCount} unsupported or over-size file(s).` : ""
    );
    if (!fileArtist) setFileArtist("Local Artist");
  };

  const handleFileSelect = (e) => {
    selectAudioFiles(e.target.files, e.target);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    selectAudioFiles(e.dataTransfer.files);
  };

  const handleUploadFiles = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length || (selectedFiles.length === 1 && !fileTitle.trim())) {
      setError("Select audio files before uploading.");
      return;
    }

    const filesToUpload = [...selectedFiles];
    const failedFiles = [];
    const albumPlaylists = new Map();
    let uploadedCount = 0;
    setError("");
    setSuccessMsg("");
    setImporting(true);

    try {
      for (const [index, file] of filesToUpload.entries()) {
        setUploadProgress({ completed: index, total: filesToUpload.length, fileName: file.name });
        try {
          const base64Data = await readFileAsBase64(file);
          const albumTitle = fileAlbum.trim() || getFileAlbumName(file) || "Local Files";
          const albumKey = albumTitle.toLowerCase();
          const albumPlaylistId = albumPlaylists.get(albumKey);
          const result = await api.post("/tracks/upload", {
            title: filesToUpload.length === 1
              ? fileTitle.trim()
              : file.name.replace(/\.[^/.]+$/, ""),
            artistName: fileArtist.trim() || "Local Artist",
            albumTitle,
            fileName: file.name,
            contentType: file.type,
            base64Data,
            playlistId: albumPlaylistId,
            playlistIds: targetPlaylistId ? [targetPlaylistId] : undefined,
            createPlaylistName: albumPlaylistId ? undefined : albumTitle,
          });
          if (result.playlist) albumPlaylists.set(albumKey, result.playlist.id);
          uploadedCount += 1;
        } catch (err) {
          failedFiles.push({ file, message: err.message || "Upload failed" });
        }
      }

      await onAlbumsChanged?.();
      setSelectedFiles(failedFiles.map(({ file }) => file));
      try {
        await refresh();
      } catch (err) {
        setSuccessMsg(uploadedCount ? `Uploaded ${uploadedCount} song(s).` : "");
        setError(`Uploaded files could not be refreshed in the library: ${err.message}`);
        return;
      }

      if (failedFiles.length) {
        const failedNames = failedFiles
          .slice(0, 3)
          .map(({ file, message }) => `${file.name} (${message})`)
          .join(", ");
        const remainingCount = failedFiles.length - 3;
        setSuccessMsg(uploadedCount ? `Uploaded ${uploadedCount} song(s).` : "");
        setError(
          `Could not upload ${failedFiles.length} file(s): ${failedNames}` +
          (remainingCount > 0 ? ` and ${remainingCount} more` : "") +
          `. Retry will include only the failed files.`
        );
        if (failedFiles.length === 1) {
          setFileTitle(failedFiles[0].file.name.replace(/\.[^/.]+$/, ""));
        }
        return;
      }

      setSuccessMsg(`Uploaded ${uploadedCount} song(s).`);
      setTimeout(() => {
        onClose();
        if (targetPlaylistId) navigate(`/playlists/${targetPlaylistId}`);
      }, 1000);
    } finally {
      setImporting(false);
      setUploadProgress(null);
    }
  };

  const handleAddCustomSong = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      setError("Song title is required");
      return;
    }
    setError("");
    setImporting(true);

    try {
      const res = await api.post("/spotify/custom-track", {
        title: customTitle.trim(),
        artistName: customArtist.trim() || "Independent Artist",
        albumTitle: customAlbum.trim() || "Single",
        audioUrl: customAudioUrl.trim() || "/audio/neon-tide.wav",
        coverUrl: customCoverUrl.trim() || "/covers/neon-tide.png",
        playlistId: targetPlaylistId || undefined,
      });
      await refresh();
      await onAlbumsChanged?.();
      setSuccessMsg(`Added "${res.track.title}"!`);
      setTimeout(() => {
        onClose();
        if (targetPlaylistId) navigate(`/playlists/${targetPlaylistId}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to add song");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Add Music</h2>
              <p className="text-xs text-muted">Spotify previews & local audio uploads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mb-5 flex rounded-lg bg-surface2 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("spotify");
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 transition ${
              activeTab === "spotify" ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Spotify Playlist
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 transition ${
              activeTab === "upload" ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Upload from device
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("custom");
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 transition ${
              activeTab === "custom" ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Custom Link
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        {/* Spotify Tab */}
        {activeTab === "spotify" && (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Spotify Playlist / Track Link
                </label>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  Full Songs Enabled
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (preview) setPreview(null);
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    setUrl(pasted);
                    handlePreview(pasted);
                  }}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="flex-1 rounded-xl bg-surface2 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => handlePreview()}
                  disabled={loadingPreview || !url.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-surface2 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-line disabled:opacity-50"
                >
                  {loadingPreview ? <Loader2 size={16} className="animate-spin" /> : "Preview"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2/60 p-3">
              <p className="text-xs text-muted">
                {spotifyConnected
                  ? "Spotify connected for this browser session."
                  : isSpotifyConfigured()
                    ? "Connect Spotify to import playlists with more than 100 tracks."
                    : "Spotify API setup is required to import more than 100 tracks."}
              </p>
              <button
                type="button"
                onClick={handleConnectSpotify}
                disabled={!isSpotifyConfigured() || connectingSpotify}
                className="shrink-0 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connectingSpotify ? "Connecting..." : spotifyConnected ? "Reconnect" : "Connect Spotify"}
              </button>
            </div>

            {/* Preview Box */}
            {preview && (
              <div className="rounded-xl border border-line bg-surface2/60 p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={preview.coverUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      {preview.type}
                    </span>
                    <h3 className="mt-1 truncate font-display text-base font-semibold text-ink">
                      {preview.name || preview.title}
                    </h3>
                    <p className="truncate text-xs text-muted">
                      {preview.artistName || preview.description || `${preview.trackCount} tracks`}
                    </p>
                    {preview.trackCount !== undefined && (
                      <p className="mt-1 text-xs font-medium text-emerald-400">
                        {preview.tracksTruncated
                          ? `First ${preview.trackCount} of ${preview.sourceTrackCount} items ready (200-track maximum)`
                          : `${preview.trackCount} tracks ready to import`}
                      </p>
                    )}
                  </div>
                </div>

                {(preview.type === "playlist" || preview.type === "album") && (
                  <div className="mt-4 space-y-3 border-t border-line/60 pt-3">
                    <div>
                      <label className="block text-xs text-muted">Playlist title in MusicFlow</label>
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded border-line"
                      />
                      Make this playlist public on Home page
                    </label>

                    {preview.tracks && preview.tracks.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                          Tracks ({preview.tracks.length}):
                        </p>
                        <div className="max-h-28 overflow-y-auto rounded-lg bg-surface/80 p-2 text-xs divide-y divide-line/40">
                          {preview.tracks.slice(0, 10).map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 px-1">
                              <div className="truncate pr-2">
                                <span className="font-medium text-ink">{t.title}</span>
                                <span className="text-muted"> — {t.artistName}</span>
                              </div>
                              <span className="shrink-0 text-[11px] text-muted">{formatTime(t.duration)}</span>
                            </div>
                          ))}
                          {preview.tracks.length > 10 && (
                            <div className="py-1 text-center text-[11px] text-muted">
                              + {preview.tracks.length - 10} more tracks
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleImportSpotify}
                  disabled={importing}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing {preview.trackCount || 1} tracks...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Import to My Library (Full Audio)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload from device */}
        {activeTab === "upload" && (
          <form onSubmit={handleUploadFiles} className="space-y-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line p-6 text-center transition hover:border-accent"
            >
              <UploadCloud size={32} className="mb-2 text-accent" />
              <p className="text-sm font-semibold text-ink">
                {selectedFiles.length
                  ? `${selectedFiles.length} audio file(s) selected`
                  : "Drop audio files here or choose a folder"}
              </p>
              <p className="text-xs text-muted">
                MP3, WAV, M4A, MP4 audio, FLAC, AAC, OGG, OPUS, or WEBM · max 3 MB per file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp4"
              multiple
              onChange={handleFileSelect}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
              disabled={importing}
            />
            <input
              ref={folderInputRef}
              type="file"
              accept="audio/*,.mp4"
              multiple
              webkitdirectory=""
              directory=""
              onChange={handleFileSelect}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
              disabled={importing}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded-lg bg-surface2 px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Choose files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={importing}
                className="rounded-lg bg-surface2 px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Choose folder
              </button>
            </div>
            {selectionNotice && <p role="status" className="text-xs text-muted">{selectionNotice}</p>}
            {uploadProgress && (
              <p role="status" className="text-xs text-muted">
                Uploading {Math.min(uploadProgress.completed + 1, uploadProgress.total)} of {uploadProgress.total}: {uploadProgress.fileName}
              </p>
            )}

            {selectedFiles.length === 1 && (
              <div>
                <label className="block text-xs font-semibold text-muted">Song Title *</label>
                <input
                  required
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="Song Title"
                  disabled={importing}
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
            {selectedFiles.length > 1 && (
              <p className="text-xs text-muted">
                Song titles come from filenames. Folder names are used as album names unless you enter an album below.
              </p>
            )}
            <p className="text-xs text-muted">
              Each uploaded album also creates a playlist with the same name.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted">Artist</label>
                <input
                  value={fileArtist}
                  onChange={(e) => setFileArtist(e.target.value)}
                  placeholder="Artist"
                  disabled={importing}
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted">Album</label>
                <input
                  value={fileAlbum}
                  onChange={(e) => setFileAlbum(e.target.value)}
                  placeholder="Use folder names"
                  disabled={importing}
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {playlists.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-muted">Also add to an existing playlist (Optional)</label>
                <select
                  value={targetPlaylistId}
                  onChange={(e) => setTargetPlaylistId(e.target.value)}
                  disabled={importing}
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Do not add to another playlist</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={
                importing ||
                !selectedFiles.length ||
                (selectedFiles.length === 1 && !fileTitle.trim())
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={18} />}
              {importing
                ? "Uploading folder..."
                : selectedFiles.length
                  ? `Upload ${selectedFiles.length} song(s)`
                  : "Upload songs"}
            </button>
          </form>
        )}

        {/* Custom Link Tab */}
        {activeTab === "custom" && (
          <form onSubmit={handleAddCustomSong} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted">Song Title *</label>
              <input
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Midnight Drive"
                className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted">Artist Name</label>
                <input
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="e.g. Solar Wave"
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted">Album Name</label>
                <input
                  value={customAlbum}
                  onChange={(e) => setCustomAlbum(e.target.value)}
                  placeholder="Single / Album"
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted">Audio Stream URL (Optional)</label>
              <input
                value={customAudioUrl}
                onChange={(e) => setCustomAudioUrl(e.target.value)}
                placeholder="https://... (Direct MP3 or audio stream)"
                className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted">Cover Artwork URL (Optional)</label>
              <input
                value={customCoverUrl}
                onChange={(e) => setCustomCoverUrl(e.target.value)}
                placeholder="https://... (Image URL)"
                className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {playlists.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-muted">Add to Playlist (Optional)</label>
                <select
                  value={targetPlaylistId}
                  onChange={(e) => setTargetPlaylistId(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-surface2 px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Do not add to a playlist</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={importing || !customTitle.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
              Add Song to MusicFlow
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
