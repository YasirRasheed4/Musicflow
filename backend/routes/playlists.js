const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = Router();

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

function tracksForPlaylist(playlistId) {
  return db
    .prepare(
      `${TRACK_SELECT}
       JOIN playlist_tracks ON playlist_tracks.track_id = tracks.id
       WHERE playlist_tracks.playlist_id = ?
       ORDER BY playlist_tracks.sort_order`
    )
    .all(playlistId)
    .map(serialize.track);
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

// Public/editorial playlists — no login required. Good for a Home page.
router.get("/public", (req, res) => {
  const rows = db.prepare(`${PLAYLIST_QUERY} WHERE is_public = 1 ORDER BY id`).all();
  res.json({ playlists: rows.map(serialize.playlist) });
});

// Current user's own playlists.
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(`${PLAYLIST_QUERY} WHERE user_id = ? ORDER BY created_at DESC`)
    .all(req.user.id);
  res.json({ playlists: rows.map(serialize.playlist) });
});

router.get("/:id", optionalAuth, (req, res) => {
  const row = db.prepare(`${PLAYLIST_QUERY} WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Playlist not found" });
  const isOwner = req.user && req.user.id === row.user_id;
  if (!row.is_public && !isOwner) {
    return res.status(403).json({ error: "This playlist is private" });
  }
  res.json({ playlist: serialize.playlist(row), tracks: tracksForPlaylist(row.id) });
});

router.post("/", requireAuth, (req, res) => {
  const { name, description, isPublic } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Playlist name is required" });
  const result = db
    .prepare("INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)")
    .run(req.user.id, name.trim(), description || null, isPublic ? 1 : 0);
  const row = db.prepare("SELECT * FROM playlists WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ playlist: serialize.playlist(row), tracks: [] });
});

function loadOwnedPlaylist(req, res, next) {
  const row = db.prepare("SELECT * FROM playlists WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Playlist not found" });
  if (row.user_id !== req.user.id) return res.status(403).json({ error: "You don't own this playlist" });
  req.playlist = row;
  next();
}

router.patch("/:id", requireAuth, loadOwnedPlaylist, (req, res) => {
  const { name, description, isPublic } = req.body || {};
  const next = {
    name: name !== undefined && name.trim() ? name.trim() : req.playlist.name,
    description: description !== undefined ? description : req.playlist.description,
    is_public: isPublic !== undefined ? (isPublic ? 1 : 0) : req.playlist.is_public,
  };
  db.prepare("UPDATE playlists SET name = ?, description = ?, is_public = ? WHERE id = ?").run(
    next.name,
    next.description,
    next.is_public,
    req.playlist.id
  );
  const row = db.prepare("SELECT * FROM playlists WHERE id = ?").get(req.playlist.id);
  res.json({ playlist: serialize.playlist(row), tracks: tracksForPlaylist(row.id) });
});

router.delete("/:id", requireAuth, loadOwnedPlaylist, (req, res) => {
  db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ?").run(req.playlist.id);
  db.prepare("DELETE FROM playlists WHERE id = ?").run(req.playlist.id);
  res.json({ ok: true });
});

router.post("/:id/tracks", requireAuth, loadOwnedPlaylist, (req, res) => {
  const { trackId } = req.body || {};
  const track = db.prepare("SELECT id FROM tracks WHERE id = ?").get(trackId);
  if (!track) return res.status(404).json({ error: "Track not found" });
  const { maxOrder } = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM playlist_tracks WHERE playlist_id = ?")
    .get(req.playlist.id);
  db.prepare(
    "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
  ).run(req.playlist.id, trackId, maxOrder + 1);
  res.status(201).json({ tracks: tracksForPlaylist(req.playlist.id) });
});

router.delete("/:id/tracks/:trackId", requireAuth, loadOwnedPlaylist, (req, res) => {
  db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?").run(
    req.playlist.id,
    req.params.trackId
  );
  res.json({ tracks: tracksForPlaylist(req.playlist.id) });
});

module.exports = router;
