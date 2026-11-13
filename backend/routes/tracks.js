const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = Router();
const MAX_AUDIO_UPLOAD_BYTES = 3 * 1024 * 1024;
const AUDIO_TYPES = new Set([
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
const AUDIO_TYPE_BY_EXTENSION = {
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  opus: "audio/opus",
  wav: "audio/wav",
  webm: "audio/webm",
};

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

router.get("/tracks", asyncHandler(async (req, res) => {
  const { genre, mood, albumId, artistId, limit } = req.query;
  const clauses = [];
  const params = [];

  if (genre) {
    clauses.push("tracks.genre_tags LIKE ?");
    params.push(`%"${genre}"%`);
  }
  if (mood) {
    clauses.push("tracks.mood_tags LIKE ?");
    params.push(`%"${mood}"%`);
  }
  if (albumId) {
    clauses.push("tracks.album_id = ?");
    params.push(albumId);
  }
  if (artistId) {
    clauses.push("tracks.artist_id = ?");
    params.push(artistId);
  }

  let sql = TRACK_SELECT;
  if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY tracks.id";
  if (limit) sql += ` LIMIT ${Math.max(1, Math.min(200, Number(limit) || 20))}`;

  const rows = await db.prepare(sql).all(...params);
  res.json({ tracks: rows.map(serialize.track) });
}));

router.get("/tracks/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Track not found" });
  res.json({ track: serialize.track(row) });
}));

router.get("/tracks/:id/audio", asyncHandler(async (req, res) => {
  const row = await db
    .prepare("SELECT content_type, audio_data FROM track_audio WHERE track_id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Uploaded audio not found" });

  const audio = Buffer.from(row.audio_data);
  const size = audio.length;
  const headers = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": row.content_type,
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.get("Range");
  if (!range) {
    res.set({ ...headers, "Content-Length": String(size) });
    return res.send(audio);
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) {
    res.set({ ...headers, "Content-Range": `bytes */${size}` });
    return res.status(416).end();
  }

  const suffixLength = Number(match[2]);
  const start = match[1] ? Number(match[1]) : Math.max(0, size - suffixLength);
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    res.set({ ...headers, "Content-Range": `bytes */${size}` });
    return res.status(416).end();
  }

  res.set({
    ...headers,
    "Content-Length": String(end - start + 1),
    "Content-Range": `bytes ${start}-${end}/${size}`,
  });
  return res.status(206).send(audio.subarray(start, end + 1));
}));

router.get("/search", asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ tracks: [], albums: [], artists: [] });
  const like = `%${q}%`;

  const tracks = (await db
    .prepare(
      `${TRACK_SELECT}
       WHERE LOWER(tracks.title) LIKE LOWER(?) OR LOWER(artists.name) LIKE LOWER(?)
       ORDER BY tracks.id LIMIT 25`
    )
    .all(like, like))
    .map(serialize.track);

  const albums = (await db
    .prepare(
      `SELECT albums.*, artists.name AS artist_name FROM albums
       JOIN artists ON artists.id = albums.artist_id
       WHERE LOWER(albums.title) LIKE LOWER(?) OR LOWER(artists.name) LIKE LOWER(?)
       ORDER BY albums.id LIMIT 15`
    )
    .all(like, like))
    .map(serialize.album);

  const artists = (await db
    .prepare("SELECT * FROM artists WHERE LOWER(name) LIKE LOWER(?) ORDER BY id LIMIT 15")
    .all(like))
    .map(serialize.artist);

  res.json({ tracks, albums, artists });
}));

const yts = require("yt-search");

// Resolve full YouTube audio stream for any track
router.get("/tracks/:id/youtube", asyncHandler(async (req, res) => {
  const row = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Track not found" });

  if (row.audio_url && row.audio_url.startsWith("youtube:")) {
    const videoId = row.audio_url.replace("youtube:", "");
    return res.json({ videoId, duration: row.duration });
  }

  try {
    const query = `${row.title} ${row.artist_name} audio`;
    const search = await yts(query);
    const video = search.videos[0];
    if (video) {
      const youtubeUrl = `youtube:${video.videoId}`;
      const duration = video.seconds || row.duration;
      await db.prepare("UPDATE tracks SET audio_url = ?, duration = ? WHERE id = ?").run(
        youtubeUrl,
        duration,
        row.id
      );
      return res.json({ videoId: video.videoId, duration });
    }
  } catch (err) {
    console.error("YouTube search error:", err.message);
  }

  res.json({ videoId: null, audioUrl: row.audio_url, duration: row.duration });
}));

// Direct search query resolver
router.get("/youtube/search", asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Query required" });
  try {
    const search = await yts(q);
    const video = search.videos[0];
    if (video) {
      return res.json({ videoId: video.videoId, title: video.title, duration: video.seconds });
    }
  } catch (err) {
    console.error("YouTube search error:", err.message);
  }
  res.status(404).json({ error: "No matching video found" });
}));

// Uploaded audio is stored in the database so it persists on serverless deployments.
router.post("/tracks/upload", requireAuth, asyncHandler(async (req, res) => {
  const {
    title,
    artistName,
    albumTitle,
    fileName,
    contentType: requestedContentType,
    base64Data,
    duration,
    playlistId,
  } = req.body || {};
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Song title is required" });
  }
  if (typeof base64Data !== "string" || !base64Data) {
    return res.status(400).json({ error: "Audio file data is required" });
  }
  const normalizedContentType = typeof requestedContentType === "string"
    ? requestedContentType.split(";")[0].trim().toLowerCase()
    : "";
  const extension = typeof fileName === "string" ? fileName.split(".").pop().toLowerCase() : "";
  const contentType = AUDIO_TYPES.has(normalizedContentType)
    ? normalizedContentType
    : Object.prototype.hasOwnProperty.call(AUDIO_TYPE_BY_EXTENSION, extension)
      ? AUDIO_TYPE_BY_EXTENSION[extension]
      : null;
  if (!contentType) {
    return res.status(415).json({ error: "Choose an MP3, WAV, M4A, FLAC, AAC, OGG, OPUS, or WEBM audio file" });
  }
  if (base64Data.length > Math.ceil(MAX_AUDIO_UPLOAD_BYTES / 3) * 4) {
    return res.status(413).json({ error: "Audio files must be 3 MB or smaller" });
  }
  const audioData = Buffer.from(base64Data, "base64");
  if (!audioData.length || audioData.toString("base64") !== base64Data) {
    return res.status(400).json({ error: "The audio file data is invalid" });
  }
  if (audioData.length > MAX_AUDIO_UPLOAD_BYTES) {
    return res.status(413).json({ error: "Audio files must be 3 MB or smaller" });
  }
  if (playlistId) {
    const playlist = await db
      .prepare("SELECT id FROM playlists WHERE id = ? AND (user_id = ? OR is_default = 1)")
      .get(playlistId, req.user.id);
    if (!playlist) return res.status(403).json({ error: "You don't have permission to add songs to this playlist" });
  }

  const cleanArtistName = typeof artistName === "string" && artistName.trim()
    ? artistName.trim()
    : "Local Artist";
  const cleanAlbumTitle = typeof albumTitle === "string" && albumTitle.trim()
    ? albumTitle.trim()
    : "Local Library";
  const trackId = await db.transaction(async (connection) => {
    let artist = await connection
      .prepare("SELECT * FROM artists WHERE LOWER(name) = LOWER(?)")
      .get(cleanArtistName);
    if (!artist) {
      const aRes = await connection
        .prepare("INSERT INTO artists (name, bio) VALUES (?, ?)")
        .run(cleanArtistName, "Uploaded music");
      artist = await connection.prepare("SELECT * FROM artists WHERE id = ?").get(aRes.lastInsertRowid);
    }

    let album = await connection
      .prepare("SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
      .get(cleanAlbumTitle, artist.id);
    if (!album) {
      const albRes = await connection
        .prepare("INSERT INTO albums (title, artist_id, cover_url) VALUES (?, ?, ?)")
        .run(cleanAlbumTitle, artist.id, "/covers/afterglow.png");
      album = await connection.prepare("SELECT * FROM albums WHERE id = ?").get(albRes.lastInsertRowid);
    }

    const tRes = await connection
      .prepare(
        `
      INSERT INTO tracks (title, artist_id, album_id, duration, audio_url, cover_url, is_downloadable, release_date)
      VALUES (?, ?, ?, ?, NULL, ?, 1, ?)
    `
      )
      .run(
        title.trim(),
        artist.id,
        album.id,
        Number(duration) || 180,
        "/covers/afterglow.png",
        new Date().toISOString().slice(0, 10)
      );

    const newTrackId = tRes.lastInsertRowid;
    await connection.prepare("INSERT INTO track_audio (track_id, content_type, audio_data) VALUES (?, ?, ?)")
      .run(newTrackId, contentType, audioData);
    await connection.prepare("UPDATE tracks SET audio_url = ? WHERE id = ?")
      .run(`/api/tracks/${newTrackId}/audio`, newTrackId);

    if (playlistId) {
      const { maxOrder } = await connection
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
        .get(playlistId);
      await connection.prepare("INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)").run(
        playlistId,
        newTrackId,
        maxOrder + 1
      );
    }

    return newTrackId;
  });

  const fullTrack = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(trackId);
  res.status(201).json({ track: serialize.track(fullTrack), message: "Track uploaded successfully!" });
}));

// Delete a track
router.delete("/tracks/:id", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const track = await db.prepare("SELECT * FROM tracks WHERE id = ?").get(id);
  if (!track) return res.status(404).json({ error: "Track not found" });

  await db.transaction(async (connection) => {
    await connection.prepare("DELETE FROM favorites WHERE track_id = ?").run(id);
    await connection.prepare("DELETE FROM playlist_tracks WHERE track_id = ?").run(id);
    await connection.prepare("DELETE FROM playback_history WHERE track_id = ?").run(id);
    await connection.prepare("DELETE FROM tracks WHERE id = ?").run(id);
  });

  res.json({ ok: true, message: `Deleted track ${track.title}` });
}));

module.exports = router;
