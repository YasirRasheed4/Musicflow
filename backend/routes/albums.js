const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = Router();

const ALBUM_SELECT = `
  SELECT albums.*, artists.name AS artist_name
  FROM albums
  JOIN artists ON artists.id = albums.artist_id
`;

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

router.get("/albums", asyncHandler(async (req, res) => {
  const rows = await db.prepare(`${ALBUM_SELECT} ORDER BY albums.id`).all();
  res.json({ albums: rows.map(serialize.album) });
}));

router.get("/albums/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare(`${ALBUM_SELECT} WHERE albums.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Album not found" });
  const tracks = (await db
    .prepare(`${TRACK_SELECT} WHERE tracks.album_id = ? ORDER BY tracks.id`)
    .all(req.params.id))
    .map(serialize.track);
  res.json({ album: serialize.album(row), tracks });
}));

router.patch("/albums/:id", requireAuth, asyncHandler(async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) return res.status(400).json({ error: "Album name is required" });

  const result = await db.prepare("UPDATE albums SET title = ? WHERE id = ?").run(title, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Album not found" });

  const row = await db.prepare(`${ALBUM_SELECT} WHERE albums.id = ?`).get(req.params.id);
  res.json({ album: serialize.album(row) });
}));

router.delete("/albums/:id", requireAuth, asyncHandler(async (req, res) => {
  const album = await db.prepare("SELECT * FROM albums WHERE id = ?").get(req.params.id);
  if (!album) return res.status(404).json({ error: "Album not found" });

  await db.transaction(async (connection) => {
    const trackIds = "(SELECT id FROM tracks WHERE album_id = ?)";
    await connection.prepare(`DELETE FROM favorites WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare(`DELETE FROM playlist_tracks WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare(`DELETE FROM playback_history WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare("DELETE FROM tracks WHERE album_id = ?").run(req.params.id);
    await connection.prepare("DELETE FROM albums WHERE id = ?").run(req.params.id);
  });

  res.json({ ok: true, message: `Deleted album ${album.title}` });
}));

module.exports = router;
