const crypto = require("node:crypto");
const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = Router();
const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_SINGLE_REQUEST_UPLOAD_BYTES = 3 * 1024 * 1024;
const UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
const UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
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
  mp4: "audio/mp4",
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

function getAudioContentType(fileName, requestedContentType) {
  const normalizedContentType = typeof requestedContentType === "string"
    ? requestedContentType.split(";")[0].trim().toLowerCase()
    : "";
  const extension = typeof fileName === "string" ? fileName.split(".").pop().toLowerCase() : "";
  return AUDIO_TYPES.has(normalizedContentType)
    ? normalizedContentType
    : AUDIO_TYPE_BY_EXTENSION[extension] || null;
}

function parseUploadMetadata(body = {}) {
  const {
    title,
    artistName,
    albumTitle,
    fileName,
    contentType,
    duration,
    playlistId,
    playlistIds: requestedPlaylistIds,
    createPlaylistName: requestedPlaylistName,
  } = body;
  if (typeof title !== "string" || !title.trim()) {
    return { status: 400, error: "Song title is required" };
  }
  if (requestedPlaylistIds !== undefined && !Array.isArray(requestedPlaylistIds)) {
    return { status: 400, error: "Playlist IDs must be provided as a list" };
  }

  const contentTypeValue = getAudioContentType(fileName, contentType);
  if (!contentTypeValue) {
    return { status: 415, error: "Choose an MP3, WAV, M4A, FLAC, AAC, OGG, OPUS, or WEBM audio file" };
  }

  const playlistIds = [];
  for (const value of [
    ...(requestedPlaylistIds || []),
    ...(playlistId === undefined || playlistId === null || playlistId === "" ? [] : [playlistId]),
  ]) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
      return { status: 400, error: "A valid playlist ID is required" };
    }
    if (!playlistIds.includes(id)) playlistIds.push(id);
  }

  const createPlaylistName = requestedPlaylistName === undefined
    ? null
    : typeof requestedPlaylistName === "string" && requestedPlaylistName.trim()
      ? requestedPlaylistName.trim()
      : null;
  if (requestedPlaylistName !== undefined && !createPlaylistName) {
    return { status: 400, error: "Playlist name is required" };
  }

  return {
    metadata: {
      title: title.trim(),
      artistName: typeof artistName === "string" && artistName.trim() ? artistName.trim() : "Local Artist",
      albumTitle: typeof albumTitle === "string" && albumTitle.trim() ? albumTitle.trim() : "Local Library",
      fileName,
      contentType: contentTypeValue,
      duration: Number(duration) || 180,
      playlistIds,
      createPlaylistName,
    },
  };
}

function decodeBase64Data(base64Data) {
  if (typeof base64Data !== "string" || !base64Data) return null;
  const audioData = Buffer.from(base64Data, "base64");
  return audioData.length && audioData.toString("base64") === base64Data ? audioData : null;
}

async function canAddToPlaylists(userId, playlistIds) {
  for (const id of playlistIds) {
    const playlist = await db
      .prepare("SELECT id FROM playlists WHERE id = ? AND (user_id = ? OR is_default = 1)")
      .get(id, userId);
    if (!playlist) return false;
  }
  return true;
}

async function uploadSessionExpired(upload, userId) {
  const createdAt = Date.parse(upload.created_at);
  if (Number.isFinite(createdAt) && Date.now() - createdAt <= UPLOAD_SESSION_TTL_MS) {
    return false;
  }
  await db.prepare("DELETE FROM track_uploads WHERE id = ? AND user_id = ?")
    .run(upload.id, userId);
  return true;
}

async function saveUploadedTrack(userId, metadata, audioData, uploadId = null) {
  const {
    title,
    artistName,
    albumTitle,
    contentType,
    duration,
    playlistIds,
    createPlaylistName,
  } = metadata;
  const uploadResult = await db.transaction(async (connection) => {
    let artist = await connection
      .prepare("SELECT * FROM artists WHERE LOWER(name) = LOWER(?)")
      .get(artistName);
    if (!artist) {
      const aRes = await connection
        .prepare("INSERT INTO artists (name, bio) VALUES (?, ?)")
        .run(artistName, "Uploaded music");
      artist = await connection.prepare("SELECT * FROM artists WHERE id = ?").get(aRes.lastInsertRowid);
    }

    let album = await connection
      .prepare("SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
      .get(albumTitle, artist.id);
    if (!album) {
      const albRes = await connection
        .prepare("INSERT INTO albums (title, artist_id, cover_url) VALUES (?, ?, ?)")
        .run(albumTitle, artist.id, "/covers/afterglow.png");
      album = await connection.prepare("SELECT * FROM albums WHERE id = ?").get(albRes.lastInsertRowid);
    }

    let createdPlaylistId = null;
    if (createPlaylistName) {
      const playlistResult = await connection
        .prepare("INSERT INTO playlists (user_id, name) VALUES (?, ?)")
        .run(userId, createPlaylistName);
      createdPlaylistId = playlistResult.lastInsertRowid;
    }

    const tRes = await connection
      .prepare(`
        INSERT INTO tracks
          (title, artist_id, album_id, duration, audio_url, cover_url, is_downloadable, release_date)
        VALUES (?, ?, ?, ?, NULL, ?, 1, ?)
      `)
      .run(
        title,
        artist.id,
        album.id,
        duration,
        "/covers/afterglow.png",
        new Date().toISOString().slice(0, 10)
      );

    const trackId = tRes.lastInsertRowid;
    await connection.prepare("INSERT INTO track_audio (track_id, content_type, audio_data) VALUES (?, ?, ?)")
      .run(trackId, contentType, audioData);
    await connection.prepare("UPDATE tracks SET audio_url = ? WHERE id = ?")
      .run(`/api/tracks/${trackId}/audio`, trackId);

    for (const id of [...playlistIds, ...(createdPlaylistId ? [createdPlaylistId] : [])]) {
      const { maxOrder } = await connection
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
        .get(id);
      await connection.prepare("INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)")
        .run(id, trackId, maxOrder + 1);
    }

    if (uploadId) {
      await connection.prepare("DELETE FROM track_uploads WHERE id = ? AND user_id = ?")
        .run(uploadId, userId);
    }
    return { trackId, createdPlaylistId };
  });

  const fullTrack = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(uploadResult.trackId);
  const createdPlaylist = uploadResult.createdPlaylistId
    ? await db.prepare("SELECT * FROM playlists WHERE id = ?").get(uploadResult.createdPlaylistId)
    : null;
  return {
    track: serialize.track(fullTrack),
    ...(createdPlaylist ? { playlist: serialize.playlist(createdPlaylist) } : {}),
    message: "Track uploaded successfully!",
  };
}

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
router.post("/tracks/upload/start", requireAuth, asyncHandler(async (req, res) => {
  const parsed = parseUploadMetadata(req.body);
  if (parsed.error) return res.status(parsed.status).json({ error: parsed.error });

  const fileSize = Number(req.body?.fileSize);
  if (!Number.isInteger(fileSize) || fileSize < 1 || fileSize > MAX_AUDIO_UPLOAD_BYTES) {
    return res.status(413).json({ error: "Audio files must be larger than 0 bytes and 25 MB or smaller" });
  }
  if (!await canAddToPlaylists(req.user.id, parsed.metadata.playlistIds)) {
    return res.status(403).json({ error: "You don't have permission to add songs to this playlist" });
  }

  const uploadId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresBefore = new Date(Date.now() - UPLOAD_SESSION_TTL_MS).toISOString();
  await db.prepare("DELETE FROM track_uploads WHERE created_at < ?").run(expiresBefore);
  await db.prepare(`
    INSERT INTO track_uploads (id, user_id, file_size, chunk_count, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uploadId,
    req.user.id,
    fileSize,
    Math.ceil(fileSize / UPLOAD_CHUNK_BYTES),
    JSON.stringify(parsed.metadata),
    createdAt
  );
  res.status(201).json({ uploadId, chunkSize: UPLOAD_CHUNK_BYTES });
}));

router.post("/tracks/upload/chunk", requireAuth, asyncHandler(async (req, res) => {
  const { uploadId, index, base64Data } = req.body || {};
  const chunkIndex = Number(index);
  if (typeof uploadId !== "string" || !/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return res.status(400).json({ error: "A valid upload ID is required" });
  }
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return res.status(400).json({ error: "A valid chunk index is required" });
  }

  const upload = await db.prepare(
    "SELECT * FROM track_uploads WHERE id = ? AND user_id = ?"
  ).get(uploadId, req.user.id);
  if (!upload) return res.status(404).json({ error: "Upload session not found or expired" });
  if (await uploadSessionExpired(upload, req.user.id)) {
    return res.status(404).json({ error: "Upload session not found or expired" });
  }
  if (chunkIndex >= upload.chunk_count) {
    return res.status(400).json({ error: "Chunk index is outside this upload" });
  }
  if (typeof base64Data !== "string" || base64Data.length > Math.ceil(UPLOAD_CHUNK_BYTES / 3) * 4) {
    return res.status(413).json({ error: "Each upload chunk must be 2 MB or smaller" });
  }

  const chunkData = decodeBase64Data(base64Data);
  const expectedSize = Math.min(
    UPLOAD_CHUNK_BYTES,
    upload.file_size - chunkIndex * UPLOAD_CHUNK_BYTES
  );
  if (!chunkData || chunkData.length !== expectedSize) {
    return res.status(400).json({ error: "The uploaded chunk has an invalid size or encoding" });
  }

  await db.transaction(async (connection) => {
    await connection.prepare("DELETE FROM track_upload_chunks WHERE upload_id = ? AND chunk_index = ?")
      .run(uploadId, chunkIndex);
    await connection.prepare(
      "INSERT INTO track_upload_chunks (upload_id, chunk_index, chunk_data) VALUES (?, ?, ?)"
    ).run(uploadId, chunkIndex, chunkData);
  });
  res.json({ ok: true, index: chunkIndex });
}));

router.post("/tracks/upload/complete", requireAuth, asyncHandler(async (req, res) => {
  const { uploadId } = req.body || {};
  if (typeof uploadId !== "string" || !/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return res.status(400).json({ error: "A valid upload ID is required" });
  }
  const upload = await db.prepare(
    "SELECT * FROM track_uploads WHERE id = ? AND user_id = ?"
  ).get(uploadId, req.user.id);
  if (!upload) return res.status(404).json({ error: "Upload session not found or expired" });
  if (await uploadSessionExpired(upload, req.user.id)) {
    return res.status(404).json({ error: "Upload session not found or expired" });
  }

  const chunks = await db.prepare(
    "SELECT chunk_index, chunk_data FROM track_upload_chunks WHERE upload_id = ? ORDER BY chunk_index"
  ).all(uploadId);
  if (chunks.length !== upload.chunk_count) {
    return res.status(400).json({ error: "Some audio chunks are missing; retry the upload" });
  }
  const fileSize = Number(upload.file_size);
  let receivedSize = 0;
  for (const [index, chunk] of chunks.entries()) {
    const expectedSize = Math.min(
      UPLOAD_CHUNK_BYTES,
      fileSize - index * UPLOAD_CHUNK_BYTES
    );
    if (chunk.chunk_index !== index || chunk.chunk_data.length !== expectedSize) {
      return res.status(400).json({ error: "The uploaded audio chunks are incomplete or out of order" });
    }
    receivedSize += chunk.chunk_data.length;
  }
  if (receivedSize !== fileSize) {
    return res.status(400).json({ error: "The uploaded audio size does not match the selected file" });
  }

  const metadata = JSON.parse(upload.metadata);
  if (!await canAddToPlaylists(req.user.id, metadata.playlistIds)) {
    return res.status(403).json({ error: "You don't have permission to add songs to this playlist" });
  }
  const audioData = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.chunk_data)));
  const result = await saveUploadedTrack(req.user.id, metadata, audioData, uploadId);
  res.status(201).json(result);
}));

router.post("/tracks/upload", requireAuth, asyncHandler(async (req, res) => {
  const parsed = parseUploadMetadata(req.body);
  if (parsed.error) return res.status(parsed.status).json({ error: parsed.error });
  if (typeof req.body?.base64Data !== "string" || !req.body.base64Data) {
    return res.status(400).json({ error: "Audio file data is required" });
  }
  if (req.body.base64Data.length > Math.ceil(MAX_SINGLE_REQUEST_UPLOAD_BYTES / 3) * 4) {
    return res.status(413).json({ error: "Use chunked upload for files over 3 MB" });
  }

  const audioData = decodeBase64Data(req.body.base64Data);
  if (!audioData) return res.status(400).json({ error: "The audio file data is invalid" });
  if (audioData.length > MAX_SINGLE_REQUEST_UPLOAD_BYTES) {
    return res.status(413).json({ error: "Use chunked upload for files over 3 MB" });
  }
  if (!await canAddToPlaylists(req.user.id, parsed.metadata.playlistIds)) {
    return res.status(403).json({ error: "You don't have permission to add songs to this playlist" });
  }

  res.status(201).json(await saveUploadedTrack(req.user.id, parsed.metadata, audioData));
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
