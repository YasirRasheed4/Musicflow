const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth } = require("../middleware/auth");
const { resolveSpotify } = require("../services/spotify");

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

function findOrCreateArtist(name) {
  const cleanName = (name || "Unknown Artist").trim();
  let artist = db.prepare("SELECT * FROM artists WHERE LOWER(name) = LOWER(?)").get(cleanName);
  if (!artist) {
    const result = db
      .prepare("INSERT INTO artists (name, bio, genre_tags) VALUES (?, ?, ?)")
      .run(cleanName, `Artist imported from Spotify`, JSON.stringify(["imported"]));
    artist = db.prepare("SELECT * FROM artists WHERE id = ?").get(result.lastInsertRowid);
  }
  return artist;
}

function findOrCreateAlbum(title, artistId, coverUrl, releaseDate) {
  const cleanTitle = (title || "Single").trim();
  let album = db
    .prepare("SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
    .get(cleanTitle, artistId);
  if (!album) {
    const result = db
      .prepare("INSERT INTO albums (title, artist_id, release_date, cover_url, label) VALUES (?, ?, ?, ?, ?)")
      .run(cleanTitle, artistId, releaseDate || new Date().toISOString().slice(0, 10), coverUrl, "Spotify");
    album = db.prepare("SELECT * FROM albums WHERE id = ?").get(result.lastInsertRowid);
  }
  return album;
}

function findOrCreateTrack({ title, artistId, albumId, duration, audioUrl, coverUrl, isExplicit, releaseDate }) {
  const cleanTitle = (title || "Untitled Track").trim();
  let track = db
    .prepare("SELECT * FROM tracks WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
    .get(cleanTitle, artistId);

  if (!track) {
    const result = db
      .prepare(`
        INSERT INTO tracks
          (title, artist_id, album_id, duration, audio_url, cover_url, genre_tags, mood_tags, is_downloadable, is_explicit, release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        cleanTitle,
        artistId,
        albumId,
        duration || 180,
        audioUrl,
        coverUrl,
        JSON.stringify(["spotify"]),
        JSON.stringify(["imported"]),
        1,
        isExplicit ? 1 : 0,
        releaseDate || new Date().toISOString().slice(0, 10)
      );
    track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(result.lastInsertRowid);
  }
  return track;
}

// Preview a Spotify playlist, album, or track before importing
router.post("/preview", async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify URL or URI" });
  }

  try {
    const preview = await resolveSpotify(url);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to preview Spotify item" });
  }
});

// Import an entire Spotify playlist
router.post("/import-playlist", requireAuth, async (req, res) => {
  const { url, name, isPublic } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify playlist URL" });
  }

  try {
    const spotifyData = await resolveSpotify(url);
    if (spotifyData.type !== "playlist" && spotifyData.type !== "album") {
      return res.status(400).json({ error: "Provided link is not a playlist or album" });
    }

    const playlistName = (name && name.trim()) || spotifyData.name || "Imported Spotify Playlist";
    const description = spotifyData.description || `Imported from Spotify (${spotifyData.trackCount} tracks)`;

    const playlistResult = db
      .prepare("INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)")
      .run(req.user.id, playlistName, description, isPublic ? 1 : 0);
    const playlistId = playlistResult.lastInsertRowid;

    const insertPlaylistTrack = db.prepare(
      "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
    );

    const importTransaction = db.transaction((tracks) => {
      tracks.forEach((t, i) => {
        const artist = findOrCreateArtist(t.artistName);
        const album = findOrCreateAlbum(t.albumTitle, artist.id, t.coverUrl, t.releaseDate);
        const track = findOrCreateTrack({
          title: t.title,
          artistId: artist.id,
          albumId: album.id,
          duration: t.duration,
          audioUrl: t.audioUrl,
          coverUrl: t.coverUrl,
          isExplicit: t.isExplicit,
          releaseDate: t.releaseDate,
        });
        insertPlaylistTrack.run(playlistId, track.id, i);
      });
    });

    importTransaction(spotifyData.tracks);

    const row = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId);
    res.status(201).json({
      playlist: serialize.playlist(row),
      tracks: tracksForPlaylist(playlistId),
      message: `Successfully imported ${spotifyData.tracks.length} tracks!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to import Spotify playlist" });
  }
});

// Import a single Spotify track
router.post("/import-track", requireAuth, async (req, res) => {
  const { url, playlistId } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify track URL" });
  }

  try {
    const spotifyData = await resolveSpotify(url);
    if (spotifyData.type !== "track") {
      return res.status(400).json({ error: "Provided link is not a single track" });
    }

    const artist = findOrCreateArtist(spotifyData.artistName);
    const album = findOrCreateAlbum(spotifyData.albumTitle, artist.id, spotifyData.coverUrl, spotifyData.releaseDate);
    const track = findOrCreateTrack({
      title: spotifyData.title,
      artistId: artist.id,
      albumId: album.id,
      duration: spotifyData.duration,
      audioUrl: spotifyData.audioUrl,
      coverUrl: spotifyData.coverUrl,
      isExplicit: spotifyData.isExplicit,
      releaseDate: spotifyData.releaseDate,
    });

    if (playlistId) {
      const playlist = db.prepare("SELECT * FROM playlists WHERE id = ? AND user_id = ?").get(playlistId, req.user.id);
      if (playlist) {
        const { maxOrder } = db
          .prepare("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM playlist_tracks WHERE playlist_id = ?")
          .get(playlistId);
        db.prepare(
          "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
        ).run(playlistId, track.id, maxOrder + 1);
      }
    }

    const fullTrack = db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(track.id);
    res.status(201).json({
      track: serialize.track(fullTrack),
      message: `Successfully added ${spotifyData.title}!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to import Spotify track" });
  }
});

// Add a custom song manually
router.post("/custom-track", requireAuth, (req, res) => {
  const { title, artistName, albumTitle, audioUrl, coverUrl, duration, playlistId } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Song title is required" });
  }

  try {
    const artist = findOrCreateArtist(artistName || "Independent Artist");
    const album = findOrCreateAlbum(albumTitle || "Single", artist.id, coverUrl || "/covers/neon-tide.png");
    const track = findOrCreateTrack({
      title: title.trim(),
      artistId: artist.id,
      albumId: album.id,
      duration: Number(duration) || 180,
      audioUrl: (audioUrl && audioUrl.trim()) || "/audio/neon-tide.wav",
      coverUrl: (coverUrl && coverUrl.trim()) || "/covers/neon-tide.png",
      isExplicit: false,
    });

    if (playlistId) {
      const playlist = db.prepare("SELECT * FROM playlists WHERE id = ? AND user_id = ?").get(playlistId, req.user.id);
      if (playlist) {
        const { maxOrder } = db
          .prepare("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM playlist_tracks WHERE playlist_id = ?")
          .get(playlistId);
        db.prepare(
          "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
        ).run(playlistId, track.id, maxOrder + 1);
      }
    }

    const fullTrack = db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(track.id);
    res.status(201).json({
      track: serialize.track(fullTrack),
      message: `Successfully added ${track.title}!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to add custom track" });
  }
});

module.exports = router;

