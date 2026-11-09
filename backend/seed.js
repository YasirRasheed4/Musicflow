const bcrypt = require("bcryptjs");
const db = require("./db");

const tags = (arr) => JSON.stringify(arr);

db.exec(`
  DELETE FROM playback_history;
  DELETE FROM favorites;
  DELETE FROM playlist_tracks;
  DELETE FROM playlists;
  DELETE FROM tracks;
  DELETE FROM albums;
  DELETE FROM artists;
  DELETE FROM users;
`);

const insertArtist = db.prepare("INSERT INTO artists (name, bio, genre_tags) VALUES (?, ?, ?)");
const artists = {
  novaEmber: insertArtist.run(
    "Nova Ember",
    "Synth-driven soundscapes for night drives and neon skylines.",
    tags(["synthwave", "electronic"])
  ).lastInsertRowid,
  cedarVine: insertArtist.run(
    "Cedar & Vine",
    "Warm, fingerpicked folk for quiet mornings and old porches.",
    tags(["indie folk", "acoustic"])
  ).lastInsertRowid,
  midnightTransit: insertArtist.run(
    "Midnight Transit",
    "Lo-fi loops for late trains and half-finished thoughts.",
    tags(["lo-fi", "hip hop"])
  ).lastInsertRowid,
  paperCranes: insertArtist.run(
    "The Paper Cranes",
    "Bright, hook-driven indie pop about small joys.",
    tags(["indie pop", "rock"])
  ).lastInsertRowid,
};

const insertAlbum = db.prepare(
  "INSERT INTO albums (title, artist_id, release_date, cover_url, label) VALUES (?, ?, ?, ?, ?)"
);
const albums = {
  neonTide: insertAlbum.run(
    "Neon Tide", artists.novaEmber, "2025-03-14", "/covers/neon-tide.png", "Afterglow Records"
  ).lastInsertRowid,
  afterglow: insertAlbum.run(
    "Afterglow", artists.novaEmber, "2025-09-02", "/covers/afterglow.png", "Afterglow Records"
  ).lastInsertRowid,
  quietHollow: insertAlbum.run(
    "Quiet Hollow", artists.cedarVine, "2024-11-08", "/covers/quiet-hollow.png", "Little Porch Records"
  ).lastInsertRowid,
  threeAmStatic: insertAlbum.run(
    "3AM Static", artists.midnightTransit, "2026-01-19", "/covers/3am-static.png", "Static Hour"
  ).lastInsertRowid,
  paperWeather: insertAlbum.run(
    "Paper Weather", artists.paperCranes, "2025-05-23", "/covers/paper-weather.png", "Origami Sound"
  ).lastInsertRowid,
};

const insertTrack = db.prepare(`
  INSERT INTO tracks
    (title, artist_id, album_id, duration, audio_url, cover_url, genre_tags, mood_tags, is_downloadable, is_explicit, release_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`);

const trackDefs = [
  ["Neon Tide", artists.novaEmber, albums.neonTide, 16, "neon-tide.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive", "neon"], 1, "2025-03-14"],
  ["Chrome Horizon", artists.novaEmber, albums.neonTide, 15, "chrome-horizon.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive"], 1, "2025-03-14"],
  ["Night Drive", artists.novaEmber, albums.neonTide, 17, "night-drive.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive", "late night"], 0, "2025-03-14"],
  ["Afterglow", artists.novaEmber, albums.afterglow, 14, "afterglow.wav", "afterglow.png", ["synthwave"], ["late night", "warm"], 1, "2025-09-02"],
  ["Static Bloom", artists.novaEmber, albums.afterglow, 15, "static-bloom.wav", "afterglow.png", ["synthwave"], ["late night"], 1, "2025-09-02"],
  ["Quiet Hollow", artists.cedarVine, albums.quietHollow, 16, "quiet-hollow.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning"], 1, "2024-11-08"],
  ["Pine and Ash", artists.cedarVine, albums.quietHollow, 14, "pine-and-ash.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning"], 1, "2024-11-08"],
  ["Slow River", artists.cedarVine, albums.quietHollow, 18, "slow-river.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning", "calm"], 0, "2024-11-08"],
  ["3AM Static", artists.midnightTransit, albums.threeAmStatic, 16, "3am-static.wav", "3am-static.png", ["lo-fi", "hip hop"], ["late night", "static"], 1, "2026-01-19"],
  ["Dial Tone Dreams", artists.midnightTransit, albums.threeAmStatic, 15, "dial-tone-dreams.wav", "3am-static.png", ["lo-fi", "hip hop"], ["late night"], 0, "2026-01-19"],
  ["Paper Weather", artists.paperCranes, albums.paperWeather, 14, "paper-weather.wav", "paper-weather.png", ["indie pop"], ["sunny", "upbeat"], 1, "2025-05-23"],
  ["Umbrella Song", artists.paperCranes, albums.paperWeather, 13, "umbrella-song.wav", "paper-weather.png", ["indie pop"], ["rainy day"], 1, "2025-05-23"],
  ["Static Skyline", artists.paperCranes, albums.paperWeather, 15, "static-skyline.wav", "paper-weather.png", ["indie pop"], ["upbeat"], 1, "2025-05-23"],
];

const trackIds = {};
for (const [title, artistId, albumId, duration, audioFile, coverFile, genreTags, moodTags, isDownloadable, releaseDate] of trackDefs) {
  const result = insertTrack.run(
    title,
    artistId,
    albumId,
    duration,
    `/audio/${audioFile}`,
    `/covers/${coverFile}`,
    tags(genreTags),
    tags(moodTags),
    isDownloadable,
    releaseDate
  );
  trackIds[title] = result.lastInsertRowid;
}

const passwordHash = bcrypt.hashSync("demo1234", 10);
const demoUserId = db
  .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
  .run("Demo Listener", "demo@musicflow.app", passwordHash).lastInsertRowid;

const insertPlaylist = db.prepare(
  "INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, 1)"
);
const insertPlaylistTrack = db.prepare(
  "INSERT INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
);

const lateNightId = insertPlaylist.run(
  demoUserId, "Late Night Drive", "For when the city's asleep and you're not."
).lastInsertRowid;
["Neon Tide", "Chrome Horizon", "Night Drive", "3AM Static", "Static Bloom"].forEach((title, i) =>
  insertPlaylistTrack.run(lateNightId, trackIds[title], i)
);

const quietMorningsId = insertPlaylist.run(
  demoUserId, "Quiet Mornings", "Slow coffee, soft light."
).lastInsertRowid;
["Quiet Hollow", "Pine and Ash", "Slow River", "Umbrella Song"].forEach((title, i) =>
  insertPlaylistTrack.run(quietMorningsId, trackIds[title], i)
);

const insertFavorite = db.prepare("INSERT INTO favorites (user_id, track_id) VALUES (?, ?)");
["Afterglow", "Paper Weather", "Dial Tone Dreams"].forEach((title) =>
  insertFavorite.run(demoUserId, trackIds[title])
);

console.log("Seeded 4 artists, 5 albums, 13 tracks, 2 playlists, 3 favorites.");
console.log("Demo login -> email: demo@musicflow.app  password: demo1234");
