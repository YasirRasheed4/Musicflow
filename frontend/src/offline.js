const MEDIA_CACHE = "musicflow-offline-media-v2";
const OFFLINE_TRACKS_KEY = "musicflow-offline-tracks";

function isSpotifyPreviewUrl(url) {
  return Boolean(
    url &&
      url.protocol === "https:" &&
      /(^|\.)scdn\.co$/i.test(url.hostname) &&
      url.pathname.includes("/mp3-preview/")
  );
}

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
  const isSpotifyTrack = track.genreTags?.includes("spotify");
  if (isSpotifyTrack && !isSpotifyPreviewUrl(url)) return null;
  return (url.origin === window.location.origin && isHostedAudio) || isSpotifyPreviewUrl(url)
    ? url.href
    : null;
}

function readOfflineTracks() {
  try {
    const tracks = JSON.parse(localStorage.getItem(OFFLINE_TRACKS_KEY) || "[]");
    return Array.isArray(tracks) ? tracks : [];
  } catch {
    return [];
  }
}

function writeOfflineTracks(tracks) {
  localStorage.setItem(OFFLINE_TRACKS_KEY, JSON.stringify(tracks));
}

function rememberOfflineTrack(track) {
  const tracks = readOfflineTracks().filter((item) => item.id !== track.id);
  writeOfflineTracks([...tracks, track]);
  window.dispatchEvent(new Event("musicflow-offline-tracks-changed"));
}

function forgetOfflineTrack(track) {
  writeOfflineTracks(readOfflineTracks().filter((item) => item.id !== track.id));
  window.dispatchEvent(new Event("musicflow-offline-tracks-changed"));
}

export function getSavedOfflineTracks() {
  return readOfflineTracks();
}

export function isSpotifyPreviewTrack(track) {
  if (!track?.genreTags?.includes("spotify")) return false;
  try {
    return isSpotifyPreviewUrl(new URL(track.audioUrl));
  } catch {
    return false;
  }
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
  if (!url) throw new Error("This track does not have an offline-capable audio source.");
  if (!("caches" in window)) throw new Error("Offline storage is not available in this browser.");
  if (await isTrackSavedOffline(track)) {
    rememberOfflineTrack(track);
    return;
  }

  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
    if (!response.ok && response.type !== "opaque") throw new Error(`HTTP ${response.status}`);
  } catch {
    throw new Error(`Could not fetch "${track.title}" for offline playback.`);
  }
  const cache = await caches.open(MEDIA_CACHE);
  await cache.put(url, response.clone());
  rememberOfflineTrack(track);
}

export async function removeTrackOffline(track) {
  const url = getAudioCacheUrl(track);
  if (!url) return;
  const cache = await caches.open(MEDIA_CACHE);
  await cache.delete(url);
  forgetOfflineTrack(track);
}

export function canSaveTrackOffline(track) {
  return Boolean(getAudioCacheUrl(track));
}

export async function getOfflineAudioUrl(track) {
  const url = getAudioCacheUrl(track);
  if (!url || !("caches" in window)) return null;
  const cache = await caches.open(MEDIA_CACHE);
  const response = await cache.match(url);
  if (!response) return null;
  return URL.createObjectURL(await response.blob());
}

export async function clearOfflineUserData() {
  localStorage.removeItem(OFFLINE_TRACKS_KEY);
  window.dispatchEvent(new Event("musicflow-offline-tracks-changed"));
  if (!("caches" in window)) return;
  await Promise.all([
    caches.delete(MEDIA_CACHE),
    caches.delete("musicflow-public-data-v2"),
    caches.delete("musicflow-public-data-v1"),
  ]);
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
