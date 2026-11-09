const fs = require("fs");
const path = require("path");
const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

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
  if (limit) sql += ` LIMIT ${Math.max(1, Math.min(100, Number(limit) || 20))}`;

  const rows = await db.prepare(sql).all(...params);
  res.json({ tracks: rows.map(serialize.track) });
}));

router.get("/tracks/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Track not found" });
  res.json({ track: serialize.track(row) });
}));

router.get("/search", asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ tracks: [], albums: [], artists: [] });
  const like = `%${q}%`;

  const tracks = (await db
    .prepare(`${TRACK_SELECT} WHERE tracks.title LIKE ? OR artists.name LIKE ? ORDER BY tracks.id LIMIT 25`)
    .all(like, like))
    .map(serialize.track);

  const albums = (await db
    .prepare(
      `SELECT albums.*, artists.name AS artist_name FROM albums
       JOIN artists ON artists.id = albums.artist_id
       WHERE albums.title LIKE ? OR artists.name LIKE ? ORDER BY albums.id LIMIT 15`
    )
    .all(like, like))
    .map(serialize.album);

  const artists = (await db
    .prepare("SELECT * FROM artists WHERE name LIKE ? ORDER BY id LIMIT 15")
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

// Upload local audio file (MP3/WAV)
router.post("/tracks/upload", asyncHandler(async (req, res) => {
  const { title, artistName, albumTitle, fileName, base64Data, duration, playlistId } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Song title is required" });
  if (!base64Data) return res.status(400).json({ error: "Audio file data is required" });

  try {
    const cleanFileName = `${Date.now()}-${(fileName || "track.mp3").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(__dirname, "../audio", cleanFileName);
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    const audioUrl = `/audio/${cleanFileName}`;

    let artist = await db
      .prepare("SELECT * FROM artists WHERE LOWER(name) = LOWER(?)")
      .get((artistName || "Local Artist").trim());
    if (!artist) {
      const aRes = await db
        .prepare("INSERT INTO artists (name, bio) VALUES (?, ?)")
        .run((artistName || "Local Artist").trim(), "Uploaded music");
      artist = await db.prepare("SELECT * FROM artists WHERE id = ?").get(aRes.lastInsertRowid);
    }

    let album = await db
      .prepare("SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
      .get((albumTitle || "Local Library").trim(), artist.id);
    if (!album) {
      const albRes = await db
        .prepare("INSERT INTO albums (title, artist_id, cover_url) VALUES (?, ?, ?)")
        .run((albumTitle || "Local Library").trim(), artist.id, "/covers/afterglow.png");
      album = await db.prepare("SELECT * FROM albums WHERE id = ?").get(albRes.lastInsertRowid);
    }

    const tRes = await db
      .prepare(
        `
      INSERT INTO tracks (title, artist_id, album_id, duration, audio_url, cover_url, is_downloadable, release_date)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `
      )
      .run(
        title.trim(),
        artist.id,
        album.id,
        Number(duration) || 180,
        audioUrl,
        "/covers/afterglow.png",
        new Date().toISOString().slice(0, 10)
      );

    const trackId = tRes.lastInsertRowid;
    if (playlistId) {
      const { maxOrder } = await db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
        .get(playlistId);
      await db.prepare("INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)").run(
        playlistId,
        trackId,
        maxOrder + 1
      );
    }

    const fullTrack = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(trackId);
    res.status(201).json({ track: serialize.track(fullTrack), message: "Track uploaded successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save audio file" });
  }
}));

// Delete a track
router.delete("/tracks/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const track = await db.prepare("SELECT * FROM tracks WHERE id = ?").get(id);
  if (!track) return res.status(404).json({ error: "Track not found" });

  await db.prepare("DELETE FROM favorites WHERE track_id = ?").run(id);
  await db.prepare("DELETE FROM playlist_tracks WHERE track_id = ?").run(id);
  await db.prepare("DELETE FROM playback_history WHERE track_id = ?").run(id);
  await db.prepare("DELETE FROM tracks WHERE id = ?").run(id);

  res.json({ ok: true, message: `Deleted track ${track.title}` });
}));

module.exports = router;
