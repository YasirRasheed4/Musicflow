const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

router.get("/top", requireAuth, asyncHandler(async (req, res) => {
  const rows = await db.prepare(`
    WITH top_tracks AS (
      SELECT track_id, COUNT(*) AS play_count, MAX(played_at) AS last_played_at
      FROM playback_history
      WHERE user_id = ?
      GROUP BY track_id
    )
    SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title,
      top_tracks.play_count
    FROM top_tracks
    JOIN tracks ON tracks.id = top_tracks.track_id
    JOIN artists ON artists.id = tracks.artist_id
    LEFT JOIN albums ON albums.id = tracks.album_id
    ORDER BY top_tracks.play_count DESC, top_tracks.last_played_at DESC, tracks.id
    LIMIT 8
  `).all(req.user.id);

  res.json({
    tracks: rows.map((row) => ({
      ...serialize.track(row),
      playCount: Number(row.play_count),
    })),
  });
}));

router.post("/plays", requireAuth, asyncHandler(async (req, res) => {
  const trackId = Number(req.body?.trackId);
  if (!Number.isInteger(trackId) || trackId < 1) {
    return res.status(400).json({ error: "A valid track ID is required" });
  }

  const track = await db.prepare("SELECT id FROM tracks WHERE id = ?").get(trackId);
  if (!track) return res.status(404).json({ error: "Track not found" });

  await db.prepare(
    "INSERT INTO playback_history (user_id, track_id, duration_listened) VALUES (?, ?, 0)"
  ).run(req.user.id, trackId);
  res.status(201).json({ ok: true });
}));

module.exports = router;
