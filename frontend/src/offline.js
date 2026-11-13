const MEDIA_CACHE = "musicflow-offline-media";

function getLocalAudioUrl(track) {
  if (!track?.audioUrl || track.genreTags?.includes("spotify")) return null;
  const url = new URL(track.audioUrl, window.location.origin);
  return url.origin === window.location.origin && url.pathname.startsWith("/audio/") ? url.href : null;
}

export async function registerOfflineSupport() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function isTrackSavedOffline(track) {
  const url = getLocalAudioUrl(track);
  if (!url || !("caches" in window)) return false;
  const cache = await caches.open(MEDIA_CACHE);
  return Boolean(await cache.match(url));
}

export async function saveTrackOffline(track) {
  const url = getLocalAudioUrl(track);
  if (!url) throw new Error("Only MusicFlow local audio can be saved for offline playback.");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not save this track (${response.status}).`);
  const cache = await caches.open(MEDIA_CACHE);
  await cache.put(url, response);
}

export async function removeTrackOffline(track) {
  const url = getLocalAudioUrl(track);
  if (!url) return;
  const cache = await caches.open(MEDIA_CACHE);
  await cache.delete(url);
}

export function canSaveTrackOffline(track) {
  return Boolean(getLocalAudioUrl(track));
}