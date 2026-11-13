function parseTags(text) {
  try {
    return JSON.parse(text || "[]");
  } catch {
    return [];
  }
}

function track(row) {
  if (!row) return null;
  const genreTags = parseTags(row.genre_tags);
  return {
    id: row.id,
    title: row.title,
    artistId: row.artist_id,
    artistName: row.artist_name,
    albumId: row.album_id,
    albumTitle: row.album_title,
    duration: row.duration,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url,
    genreTags,
    moodTags: parseTags(row.mood_tags),
    isDownloadable: !!row.is_downloadable && !genreTags.includes("spotify"),
    isExplicit: !!row.is_explicit,
    releaseDate: row.release_date,
  };
}

function album(row) {
  if (!row) return null;
  const coverUrl = typeof row.cover_url === "string" && row.cover_url.startsWith("data:image/")
    ? `/api/albums/${row.id}/cover`
    : row.cover_url;
  return {
    id: row.id,
    title: row.title,
    artistId: row.artist_id,
    artistName: row.artist_name,
    releaseDate: row.release_date,
    coverUrl,
    label: row.label,
  };
}

function artist(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    genreTags: parseTags(row.genre_tags),
  };
}

function playlist(row) {
  if (!row) return null;
  const coverUrl = row.cover_url || row.track_cover_url || null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    coverUrl: typeof coverUrl === "string" && coverUrl.startsWith("data:image/")
      ? `/api/playlists/${row.id}/cover`
      : coverUrl,
    trackCount: row.track_count !== undefined ? Number(row.track_count) : undefined,
    isPublic: !!row.is_public,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
  };
}

module.exports = { track, album, artist, playlist, parseTags };
