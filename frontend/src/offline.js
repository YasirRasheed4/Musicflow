const MEDIA_CACHE = "musicflow-offline-media";

function getAudioCacheUrl(track) {
  if (typeof track?.audioUrl !== "string" || track.audioUrl.startsWith("youtube:")) return null;
  let url;
  try {
    url = new URL(track.audioUrl, window.location.origin);
  } catch {
    return null;
  }
  const isHostedAudio =
    url.pathname.startsWith("/audio/") || /^\/api\/tracks\/\d+\/audio$/.test(url.pathname);
  return url.origin === window.location.origin && isHostedAudio
    ? url.href
    : null;
}

export async function registerOfflineSupport() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function isTrackSavedOffline(track) {
  const url = getAudioCacheUrl(track);
  if (!url || !("caches" in window)) return false;
  const cache = await caches.open(MEDIA_CACHE);
  return Boolean(await cache.match(url));
}

export async function saveTrackOffline(track) {
  const url = getAudioCacheUrl(track);
  if (!url) throw new Error("Only MusicFlow-hosted audio can be saved for offline playback.");
  if (!("caches" in window)) throw new Error("Offline storage is not available in this browser.");
  if (await isTrackSavedOffline(track)) return;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not fetch "${track.title}" for offline playback.`);
  }
  if (!response.ok) throw new Error(`Could not save this track (${response.status}).`);
  const cache = await caches.open(MEDIA_CACHE);
  await cache.put(url, response.clone());
}

export async function removeTrackOffline(track) {
  const url = getAudioCacheUrl(track);
  if (!url) return;
  const cache = await caches.open(MEDIA_CACHE);
  await cache.delete(url);
}

export function canSaveTrackOffline(track) {
  return Boolean(getAudioCacheUrl(track));
}

export async function getAlbumOfflineStatus(tracks) {
  const eligibleTracks = tracks.filter(canSaveTrackOffline);
  const savedStates = await Promise.all(eligibleTracks.map(isTrackSavedOffline));
  return {
    totalCount: tracks.length,
    availableCount: eligibleTracks.length,
    savedCount: savedStates.filter(Boolean).length,
  };
}

export async function saveAlbumOffline(tracks, onProgress = () => {}) {
  let savedCount = 0;
  let skippedCount = 0;
  const failures = [];

  for (const [index, track] of tracks.entries()) {
    if (!canSaveTrackOffline(track)) {
      skippedCount += 1;
    } else {
      try {
        await saveTrackOffline(track);
        savedCount += 1;
      } catch (error) {
        failures.push({ track, error });
      }
    }
    onProgress(index + 1, tracks.length);
  }

  return { savedCount, skippedCount, failures };
}