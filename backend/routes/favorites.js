const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();
router.use(requireAuth);

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

router.get("/", asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `${TRACK_SELECT}
       JOIN favorites ON favorites.track_id = tracks.id
       WHERE favorites.user_id = ?
       ORDER BY favorites.created_at DESC`
    )
    .all(req.user.id);
  res.json({ tracks: rows.map(serialize.track) });
}));

router.post("/:trackId", asyncHandler(async (req, res) => {
  const track = await db.prepare("SELECT id FROM tracks WHERE id = ?").get(req.params.trackId);
  if (!track) return res.status(404).json({ error: "Track not found" });
  await db.prepare("INSERT IGNORE INTO favorites (user_id, track_id) VALUES (?, ?)").run(
    req.user.id,
    req.params.trackId
  );
  res.status(201).json({ ok: true });
}));

router.delete("/:trackId", asyncHandler(async (req, res) => {
  await db.prepare("DELETE FROM favorites WHERE user_id = ? AND track_id = ?").run(
    req.user.id,
    req.params.trackId
  );
  res.json({ ok: true });
}));

module.exports = router;
