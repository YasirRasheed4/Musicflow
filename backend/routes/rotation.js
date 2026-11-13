const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

const ROTATION_ALBUM_SELECT = `
  SELECT albums.*, artists.name AS artist_name
  FROM rotation_albums
  JOIN albums ON albums.id = rotation_albums.album_id
  JOIN artists ON artists.id = albums.artist_id
`;

router.get("/albums", asyncHandler(async (_req, res) => {
  const rows = await db
    .prepare(`${ROTATION_ALBUM_SELECT} ORDER BY rotation_albums.sort_order, albums.id`)
    .all();
  res.json({ albums: rows.map(serialize.album) });
}));

router.post("/albums", requireAuth, asyncHandler(async (req, res) => {
  const albumId = Number(req.body?.albumId);
  if (!Number.isInteger(albumId) || albumId < 1) {
    return res.status(400).json({ error: "A valid album ID is required" });
  }

  const album = await db.prepare(`${ROTATION_ALBUM_SELECT} WHERE albums.id = ?`).get(albumId);
  if (!album) return res.status(404).json({ error: "Album not found" });

  const { maxOrder } = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS \"maxOrder\" FROM rotation_albums")
    .get();
  await db.prepare("INSERT IGNORE INTO rotation_albums (album_id, sort_order) VALUES (?, ?)").run(
    albumId,
    maxOrder + 1
  );

  const row = await db.prepare(`${ROTATION_ALBUM_SELECT} WHERE albums.id = ?`).get(albumId);
  res.status(201).json({ album: serialize.album(row) });
}));

router.delete("/albums/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await db.prepare("DELETE FROM rotation_albums WHERE album_id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Album is not in Tonight's Rotation" });
  res.json({ ok: true });
}));

module.exports = router;
