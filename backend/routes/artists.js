const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

router.get("/artists", asyncHandler(async (req, res) => {
  const rows = await db.prepare("SELECT * FROM artists ORDER BY id").all();
  res.json({ artists: rows.map(serialize.artist) });
}));

router.get("/artists/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare("SELECT * FROM artists WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Artist not found" });

  const albums = (await db
    .prepare(
      `SELECT albums.*, artists.name AS artist_name FROM albums
       JOIN artists ON artists.id = albums.artist_id
       WHERE albums.artist_id = ? ORDER BY albums.release_date DESC`
    )
    .all(req.params.id))
    .map(serialize.album);

  const tracks = (await db
    .prepare(
      `SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title FROM tracks
       JOIN artists ON artists.id = tracks.artist_id
       LEFT JOIN albums ON albums.id = tracks.album_id
       WHERE tracks.artist_id = ? ORDER BY tracks.id`
    )
    .all(req.params.id))
    .map(serialize.track);

  res.json({ artist: serialize.artist(row), albums, tracks });
}));

module.exports = router;
