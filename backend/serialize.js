function parseTags(text) {
  try {
    return JSON.parse(text || "[]");
  } catch {
    return [];
  }
}

function track(row) {
  if (!row) return null;
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
    genreTags: parseTags(row.genre_tags),
    moodTags: parseTags(row.mood_tags),
    isDownloadable: !!row.is_downloadable,
    isExplicit: !!row.is_explicit,
    releaseDate: row.release_date,
  };
}

function album(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    artistId: row.artist_id,
    artistName: row.artist_name,
    releaseDate: row.release_date,
    coverUrl: row.cover_url,
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
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    coverUrl: row.cover_url || null,
    trackCount: row.track_count !== undefined ? Number(row.track_count) : undefined,
    isPublic: !!row.is_public,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
  };
}

module.exports = { track, album, artist, playlist, parseTags };
