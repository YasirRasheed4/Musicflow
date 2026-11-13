/**
 * Service to fetch and parse public Spotify metadata (playlists, albums, tracks).
 * Uses Spotify's public embed payloads without requiring OAuth credentials.
 */

function parseSpotifyUrl(input) {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // Match URI format (e.g. spotify:playlist:37i9dQZF1DXcBWIGoYBM5M)
  const uriMatch = str.match(/^spotify:(playlist|track|album):([a-zA-Z0-9]+)$/);
  if (uriMatch) {
    return { type: uriMatch[1], id: uriMatch[2] };
  }

  // Match Web URL format (e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...)
  const urlMatch = str.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return { type: urlMatch[1], id: urlMatch[2] };
  }

  // If just a raw ID of 22 chars
  if (/^[a-zA-Z0-9]{22}$/.test(str)) {
    return { type: "playlist", id: str };
  }

  return null;
}

const DEFAULT_AUDIO_FALLBACKS = [
  "/audio/neon-tide.wav",
  "/audio/afterglow.wav",
  "/audio/3am-static.wav",
  "/audio/night-drive.wav",
  "/audio/paper-weather.wav",
  "/audio/quiet-hollow.wav",
  "/audio/slow-river.wav",
];
const MAX_PLAYLIST_TRACKS = 200;
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

function getRandomFallbackAudio() {
  const index = Math.floor(Math.random() * DEFAULT_AUDIO_FALLBACKS.length);
  return DEFAULT_AUDIO_FALLBACKS[index];
}

async function fetchEmbedData(type, id) {
  const url = `https://open.spotify.com/embed/${type}/${id}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load Spotify embed page (${res.status})`);
  }

  const html = await res.text();
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const startIndex = html.indexOf(marker);

  if (startIndex === -1) {
    throw new Error("Could not extract Spotify data from embed page");
  }

  const jsonStart = startIndex + marker.length;
  const jsonEnd = html.indexOf("</script>", jsonStart);
  const jsonStr = html.substring(jsonStart, jsonEnd);
  return JSON.parse(jsonStr);
}

async function fetchSpotifyApi(url, accessToken) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Spotify API returned an invalid response (${response.status})`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your Spotify connection expired. Reconnect Spotify and try again.");
    }
    if (response.status === 403) {
      throw new Error("Spotify only allows the playlist owner or a collaborator to import its tracks.");
    }
    throw new Error(data.error?.message || `Spotify API request failed (${response.status})`);
  }
  return data;
}

async function fetchAuthorizedPlaylistTracks(id, accessToken, playlistName, coverUrl) {
  const tracks = [];
  let offset = 0;
  let total = 0;

  while (offset < MAX_PLAYLIST_TRACKS && (offset === 0 || offset < total)) {
    const params = new URLSearchParams({
      limit: "50",
      offset: String(offset),
      additional_types: "track",
    });
    const page = await fetchSpotifyApi(
      `${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(id)}/items?${params}`,
      accessToken
    );
    const items = Array.isArray(page.items) ? page.items : [];
    total = Number.isFinite(page.total) ? page.total : offset + items.length;
    if (!items.length) break;

    for (const entry of items) {
      const track = entry.item || entry.track;
      if (!track || track.type !== "track") continue;
      const album = track.album || {};
      const artistName =
        (track.artists || []).map((artist) => artist.name).filter(Boolean).join(", ") ||
        "Unknown Artist";
      const trackCoverUrl = album.images?.[0]?.url || coverUrl || "/covers/neon-tide.png";
      tracks.push({
        title: track.name || "Untitled Track",
        artistName,
        albumTitle: album.name || `${playlistName} (Compilation)`,
        duration: track.duration_ms ? Math.round(track.duration_ms / 1000) : 180,
        audioUrl: track.preview_url || getRandomFallbackAudio(),
        coverUrl: trackCoverUrl,
        isExplicit: Boolean(track.explicit),
        releaseDate: album.release_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      });
    }

    offset += items.length;
  }

  return { tracks, total };
}

async function getSpotifyPlaylist(id, accessToken) {
  const data = await fetchEmbedData("playlist", id);
  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity) {
    throw new Error("Playlist not found or is private");
  }

  const name = entity.name || "Imported Spotify Playlist";
  const description = entity.subtitle || entity.description || "";
  const coverUrl =
    entity.coverArt?.sources?.[0]?.url ||
    entity.visualIdentity?.image?.[0]?.url ||
    "/covers/neon-tide.png";

  if (accessToken) {
    const { tracks, total } = await fetchAuthorizedPlaylistTracks(id, accessToken, name, coverUrl);
    return {
      type: "playlist",
      id,
      name,
      description,
      coverUrl,
      trackCount: tracks.length,
      sourceTrackCount: total,
      tracksTruncated: total > MAX_PLAYLIST_TRACKS,
      tracks,
    };
  }

  const rawTracks = entity.trackList || [];
  const tracks = rawTracks.map((t, i) => {
    const title = t.title || t.name || `Track ${i + 1}`;
    const artistName = t.subtitle || (t.artists && t.artists.map((a) => a.name).join(", ")) || "Unknown Artist";
    const durationSeconds = t.duration ? Math.round(t.duration / 1000) : 180;
    const audioUrl = t.audioPreview?.url || getRandomFallbackAudio();
    const trackCoverUrl =
      t.coverArt?.sources?.[0]?.url ||
      coverUrl ||
      "/covers/neon-tide.png";

    return {
      title,
      artistName,
      albumTitle: t.album?.name || `${name} (Compilation)`,
      duration: durationSeconds,
      audioUrl,
      coverUrl: trackCoverUrl,
      isExplicit: Boolean(t.isExplicit),
      releaseDate: t.releaseDate?.isoString?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    };
  });

  return {
    type: "playlist",
    id,
    name,
    description,
    coverUrl,
    trackCount: tracks.length,
    tracks,
  };
}

async function getSpotifyTrack(id) {
  const data = await fetchEmbedData("track", id);
  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity) {
    throw new Error("Track not found or is unavailable");
  }

  const title = entity.title || entity.name || "Untitled Track";
  const artistName =
    (entity.artists && entity.artists.map((a) => a.name).join(", ")) ||
    entity.subtitle ||
    "Unknown Artist";
  const albumTitle = entity.album?.name || "Single";
  const durationSeconds = entity.duration ? Math.round(entity.duration / 1000) : 180;
  const audioUrl = entity.audioPreview?.url || getRandomFallbackAudio();
  const coverUrl =
    entity.visualIdentity?.image?.[2]?.url ||
    entity.visualIdentity?.image?.[0]?.url ||
    entity.coverArt?.sources?.[0]?.url ||
    "/covers/neon-tide.png";

  return {
    type: "track",
    id,
    title,
    artistName,
    albumTitle,
    duration: durationSeconds,
    audioUrl,
    coverUrl,
    isExplicit: Boolean(entity.isExplicit),
    releaseDate: entity.releaseDate?.isoString?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  };
}

async function getSpotifyAlbum(id) {
  const data = await fetchEmbedData("album", id);
  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity) {
    throw new Error("Album not found or is unavailable");
  }

  const name = entity.name || "Imported Album";
  const artistName =
    entity.subtitle || (entity.artists && entity.artists.map((a) => a.name).join(", ")) || "Unknown Artist";
  const coverUrl =
    entity.coverArt?.sources?.[0]?.url ||
    entity.visualIdentity?.image?.[0]?.url ||
    "/covers/afterglow.png";

  const rawTracks = entity.trackList || [];
  const tracks = rawTracks.map((t, i) => {
    const title = t.title || t.name || `Track ${i + 1}`;
    const durationSeconds = t.duration ? Math.round(t.duration / 1000) : 180;
    const audioUrl = t.audioPreview?.url || getRandomFallbackAudio();
    return {
      title,
      artistName,
      albumTitle: name,
      duration: durationSeconds,
      audioUrl,
      coverUrl,
      isExplicit: Boolean(t.isExplicit),
      releaseDate: entity.releaseDate?.isoString?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    };
  });

  return {
    type: "album",
    id,
    name,
    artistName,
    coverUrl,
    trackCount: tracks.length,
    tracks,
  };
}

async function resolveSpotify(input, options = {}) {
  const parsed = parseSpotifyUrl(input);
  if (!parsed) {
    throw new Error("Invalid Spotify URL or URI. Please provide a valid Spotify playlist, album, or track link.");
  }

  if (parsed.type === "playlist") {
    return await getSpotifyPlaylist(parsed.id, options.accessToken);
  } else if (parsed.type === "track") {
    return await getSpotifyTrack(parsed.id);
  } else if (parsed.type === "album") {
    return await getSpotifyAlbum(parsed.id);
  }

  throw new Error(`Unsupported Spotify entity type: ${parsed.type}`);
}

module.exports = {
  parseSpotifyUrl,
  resolveSpotify,
  getSpotifyPlaylist,
  getSpotifyTrack,
  getSpotifyAlbum,
};

