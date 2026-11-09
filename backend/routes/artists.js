const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");

const router = Router();

router.get("/artists", (req, res) => {
  const rows = db.prepare("SELECT * FROM artists ORDER BY id").all();
  res.json({ artists: rows.map(serialize.artist) });
});

router.get("/artists/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM artists WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Artist not found" });

  const albums = db
    .prepare(
      `SELECT albums.*, artists.name AS artist_name FROM albums
       JOIN artists ON artists.id = albums.artist_id
       WHERE albums.artist_id = ? ORDER BY albums.release_date DESC`
    )
    .all(req.params.id)
    .map(serialize.album);

  const tracks = db
    .prepare(
      `SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title FROM tracks
       JOIN artists ON artists.id = tracks.artist_id
       LEFT JOIN albums ON albums.id = tracks.album_id
       WHERE tracks.artist_id = ? ORDER BY tracks.id`
    )
    .all(req.params.id)
    .map(serialize.track);

  res.json({ artist: serialize.artist(row), albums, tracks });
});

module.exports = router;
