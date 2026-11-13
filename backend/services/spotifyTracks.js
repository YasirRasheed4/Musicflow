async function findOrCreateSpotifyTrack(connection, {
  title,
  artistId,
  albumId,
  duration,
  audioUrl,
  coverUrl,
  isExplicit,
  releaseDate,
}, occurrenceIndex = 0) {
  const cleanTitle = String(title || "Untitled Track").trim();
  const existingTracks = await connection
    .prepare(`
      SELECT * FROM tracks
      WHERE LOWER(title) = LOWER(?) AND artist_id = ? AND album_id = ?
        AND LOWER(COALESCE(genre_tags, '')) LIKE '%spotify%'
      ORDER BY id
    `)
    .all(cleanTitle, artistId, albumId);
  if (existingTracks[occurrenceIndex]) return existingTracks[occurrenceIndex];

  const result = await connection
    .prepare(`
      INSERT INTO tracks
        (title, artist_id, album_id, duration, audio_url, cover_url, genre_tags, mood_tags, is_downloadable, is_explicit, release_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      cleanTitle,
      artistId,
      albumId,
      duration || 180,
      audioUrl,
      coverUrl,
      JSON.stringify(["spotify"]),
      JSON.stringify(["imported"]),
      1,
      isExplicit ? 1 : 0,
      releaseDate || new Date().toISOString().slice(0, 10)
    );
  return connection.prepare("SELECT * FROM tracks WHERE id = ?").get(result.lastInsertRowid);
}

module.exports = { findOrCreateSpotifyTrack };
