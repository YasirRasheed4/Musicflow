const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");

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

router.get("/albums", (req, res) => {
  const rows = db.prepare(`${ALBUM_SELECT} ORDER BY albums.id`).all();
  res.json({ albums: rows.map(serialize.album) });
});

router.get("/albums/:id", (req, res) => {
  const row = db.prepare(`${ALBUM_SELECT} WHERE albums.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Album not found" });
  const tracks = db
    .prepare(`${TRACK_SELECT} WHERE tracks.album_id = ? ORDER BY tracks.id`)
    .all(req.params.id)
    .map(serialize.track);
  res.json({ album: serialize.album(row), tracks });
});

module.exports = router;
