const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

async function tracksForPlaylist(playlistId) {
  const rows = await db
    .prepare(
      `${TRACK_SELECT}
       JOIN playlist_tracks ON playlist_tracks.track_id = tracks.id
       WHERE playlist_tracks.playlist_id = ?
       ORDER BY playlist_tracks.sort_order`
    )
    .all(playlistId);
  return rows.map(serialize.track);
}

const PLAYLIST_QUERY = `
  SELECT playlists.*,
    (SELECT tracks.cover_url FROM playlist_tracks
     JOIN tracks ON tracks.id = playlist_tracks.track_id
     WHERE playlist_tracks.playlist_id = playlists.id
     ORDER BY playlist_tracks.sort_order LIMIT 1) AS cover_url,
    (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_tracks.playlist_id = playlists.id) AS track_count
  FROM playlists
`;

router.get("/public", asyncHandler(async (_req, res) => {
  const rows = await db.prepare(`${PLAYLIST_QUERY} WHERE is_public = 1 ORDER BY id`).all();
  res.json({ playlists: rows.map(serialize.playlist) });
}));

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(`${PLAYLIST_QUERY} WHERE user_id = ? ORDER BY created_at DESC`)
    .all(req.user.id);
  res.json({ playlists: rows.map(serialize.playlist) });
}));

router.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const row = await db.prepare(`${PLAYLIST_QUERY} WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Playlist not found" });
  const isOwner = req.user && req.user.id === row.user_id;
  if (!row.is_public && !isOwner) {
    return res.status(403).json({ error: "This playlist is private" });
  }
  res.json({ playlist: serialize.playlist(row), tracks: await tracksForPlaylist(row.id) });
}));

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Playlist name is required" });
  const result = await db
    .prepare("INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)")
    .run(req.user.id, name.trim(), description || null, isPublic ? 1 : 0);
  const row = await db.prepare("SELECT * FROM playlists WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ playlist: serialize.playlist(row), tracks: [] });
}));

async function loadPlaylist(req, res, next, allowDefault = false) {
  try {
    const row = await db.prepare("SELECT * FROM playlists WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Playlist not found" });
    if (row.user_id !== req.user.id && !(allowDefault && row.is_default)) {
      return res.status(403).json({ error: "You don't own this playlist" });
    }
    req.playlist = row;
    next();
  } catch (error) {
    next(error);
  }
}

const loadOwnedPlaylist = (req, res, next) => loadPlaylist(req, res, next);
const loadManageablePlaylist = (req, res, next) => loadPlaylist(req, res, next, true);

router.patch("/:id", requireAuth, loadManageablePlaylist, asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body || {};
  const next = {
    name: name !== undefined && name.trim() ? name.trim() : req.playlist.name,
    description: description !== undefined ? description : req.playlist.description,
    is_public: isPublic !== undefined ? (isPublic ? 1 : 0) : req.playlist.is_public,
  };
  await db.prepare("UPDATE playlists SET name = ?, description = ?, is_public = ? WHERE id = ?").run(
    next.name,
    next.description,
    next.is_public,
    req.playlist.id
  );
  const row = await db.prepare("SELECT * FROM playlists WHERE id = ?").get(req.playlist.id);
  res.json({ playlist: serialize.playlist(row), tracks: await tracksForPlaylist(row.id) });
}));

router.delete("/:id", requireAuth, loadManageablePlaylist, asyncHandler(async (req, res) => {
  await db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ?").run(req.playlist.id);
  await db.prepare("DELETE FROM playlists WHERE id = ?").run(req.playlist.id);
  res.json({ ok: true });
}));

router.post("/:id/tracks", requireAuth, loadOwnedPlaylist, asyncHandler(async (req, res) => {
  const { trackId } = req.body || {};
  const track = await db.prepare("SELECT id FROM tracks WHERE id = ?").get(trackId);
  if (!track) return res.status(404).json({ error: "Track not found" });
  const { maxOrder } = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
    .get(req.playlist.id);
  await db.prepare(
    "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
  ).run(req.playlist.id, trackId, maxOrder + 1);
  res.status(201).json({ tracks: await tracksForPlaylist(req.playlist.id) });
}));

router.delete("/:id/tracks/:trackId", requireAuth, loadOwnedPlaylist, asyncHandler(async (req, res) => {
  await db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?").run(
    req.playlist.id,
    req.params.trackId
  );
  res.json({ tracks: await tracksForPlaylist(req.playlist.id) });
}));

module.exports = router;
