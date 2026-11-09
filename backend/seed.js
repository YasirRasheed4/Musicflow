require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./db");

const artistsData = [
  ["Nova Ember", "Synth-driven soundscapes for night drives and neon skylines.", ["synthwave", "electronic"]],
  ["Cedar & Vine", "Warm, fingerpicked folk for quiet mornings and old porches.", ["indie folk", "acoustic"]],
  ["Midnight Transit", "Lo-fi loops for late trains and half-finished thoughts.", ["lo-fi", "hip hop"]],
  ["The Paper Cranes", "Bright, hook-driven indie pop about small joys.", ["indie pop", "rock"]],
];

const albumsData = [
  ["Neon Tide", "novaEmber", "2025-03-14", "/covers/neon-tide.png", "Afterglow Records"],
  ["Afterglow", "novaEmber", "2025-09-02", "/covers/afterglow.png", "Afterglow Records"],
  ["Quiet Hollow", "cedarVine", "2024-11-08", "/covers/quiet-hollow.png", "Little Porch Records"],
  ["3AM Static", "midnightTransit", "2026-01-19", "/covers/3am-static.png", "Static Hour"],
  ["Paper Weather", "paperCranes", "2025-05-23", "/covers/paper-weather.png", "Origami Sound"],
];

const tracksData = [
  ["Neon Tide", "novaEmber", "neonTide", 16, "neon-tide.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive", "neon"], 1, "2025-03-14"],
  ["Chrome Horizon", "novaEmber", "neonTide", 15, "chrome-horizon.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive"], 1, "2025-03-14"],
  ["Night Drive", "novaEmber", "neonTide", 17, "night-drive.wav", "neon-tide.png", ["synthwave", "electronic"], ["night drive", "late night"], 0, "2025-03-14"],
  ["Afterglow", "novaEmber", "afterglow", 14, "afterglow.wav", "afterglow.png", ["synthwave"], ["late night", "warm"], 1, "2025-09-02"],
  ["Static Bloom", "novaEmber", "afterglow", 15, "static-bloom.wav", "afterglow.png", ["synthwave"], ["late night"], 1, "2025-09-02"],
  ["Quiet Hollow", "cedarVine", "quietHollow", 16, "quiet-hollow.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning"], 1, "2024-11-08"],
  ["Pine and Ash", "cedarVine", "quietHollow", 14, "pine-and-ash.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning"], 1, "2024-11-08"],
  ["Slow River", "cedarVine", "quietHollow", 18, "slow-river.wav", "quiet-hollow.png", ["indie folk"], ["quiet morning", "calm"], 0, "2024-11-08"],
  ["3AM Static", "midnightTransit", "threeAmStatic", 16, "3am-static.wav", "3am-static.png", ["lo-fi", "hip hop"], ["late night", "static"], 1, "2026-01-19"],
  ["Dial Tone Dreams", "midnightTransit", "threeAmStatic", 15, "dial-tone-dreams.wav", "3am-static.png", ["lo-fi", "hip hop"], ["late night"], 0, "2026-01-19"],
  ["Paper Weather", "paperCranes", "paperWeather", 14, "paper-weather.wav", "paper-weather.png", ["indie pop"], ["sunny", "upbeat"], 1, "2025-05-23"],
  ["Umbrella Song", "paperCranes", "paperWeather", 13, "umbrella-song.wav", "paper-weather.png", ["indie pop"], ["rainy day"], 1, "2025-05-23"],
  ["Static Skyline", "paperCranes", "paperWeather", 15, "static-skyline.wav", "paper-weather.png", ["indie pop"], ["upbeat"], 1, "2025-05-23"],
];

async function seedData() {
  const initialized = await db.transaction(async (connection) => {
    if (connection.lockSeed) await connection.lockSeed();
    const { count } = await connection.prepare("SELECT COUNT(*) AS count FROM artists").get();
    if (Number(count) > 0) return false;

    const artists = {};
    for (const [key, name, bio, genres] of [
      ["novaEmber", ...artistsData[0]],
      ["cedarVine", ...artistsData[1]],
      ["midnightTransit", ...artistsData[2]],
      ["paperCranes", ...artistsData[3]],
    ]) {
      const result = await connection
        .prepare("INSERT INTO artists (name, bio, genre_tags) VALUES (?, ?, ?)")
        .run(name, bio, JSON.stringify(genres));
      artists[key] = result.lastInsertRowid;
    }

    const albums = {};
    const albumKeys = ["neonTide", "afterglow", "quietHollow", "threeAmStatic", "paperWeather"];
    for (const [index, [title, artistKey, releaseDate, coverUrl, label]] of albumsData.entries()) {
      const result = await connection
        .prepare("INSERT INTO albums (title, artist_id, release_date, cover_url, label) VALUES (?, ?, ?, ?, ?)")
        .run(title, artists[artistKey], releaseDate, coverUrl, label);
      albums[albumKeys[index]] = result.lastInsertRowid;
    }

    const trackIds = {};
    const insertTrack = connection.prepare(`
      INSERT INTO tracks
        (title, artist_id, album_id, duration, audio_url, cover_url, genre_tags, mood_tags, is_downloadable, is_explicit, release_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);
    for (const [title, artistKey, albumKey, duration, audioFile, coverFile, genres, moods, downloadable, releaseDate] of tracksData) {
      const result = await insertTrack.run(
        title,
        artists[artistKey],
        albums[albumKey],
        duration,
        `/audio/${audioFile}`,
        `/covers/${coverFile}`,
        JSON.stringify(genres),
        JSON.stringify(moods),
        downloadable,
        releaseDate
      );
      trackIds[title] = result.lastInsertRowid;
    }

    const passwordHash = bcrypt.hashSync("demo1234", 10);
    const userResult = await connection
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run("Demo Listener", "demo@musicflow.app", passwordHash);
    const userId = userResult.lastInsertRowid;

    const addPlaylist = connection.prepare(
      "INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, 1)"
    );
    const addPlaylistTrack = connection.prepare(
      "INSERT INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
    );
    const lateNight = await addPlaylist.run(userId, "Late Night Drive", "For when the city's asleep and you're not.");
    for (const [index, title] of ["Neon Tide", "Chrome Horizon", "Night Drive", "3AM Static", "Static Bloom"].entries()) {
      await addPlaylistTrack.run(lateNight.lastInsertRowid, trackIds[title], index);
    }
    const quietMornings = await addPlaylist.run(userId, "Quiet Mornings", "Slow coffee, soft light.");
    for (const [index, title] of ["Quiet Hollow", "Pine and Ash", "Slow River", "Umbrella Song"].entries()) {
      await addPlaylistTrack.run(quietMornings.lastInsertRowid, trackIds[title], index);
    }

    const addFavorite = connection.prepare("INSERT INTO favorites (user_id, track_id) VALUES (?, ?)");
    for (const title of ["Afterglow", "Paper Weather", "Dial Tone Dreams"]) {
      await addFavorite.run(userId, trackIds[title]);
    }
    return true;
  });

  if (initialized) console.log("Seeded MusicFlow demo data.");
}

let seedPromise;
async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedData().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}

if (require.main === module) {
  db.initialize()
    .then(ensureSeeded)
    .then(() => db.close && db.close())
    .catch((error) => {
      console.error("Failed to seed MusicFlow:", error);
      process.exitCode = 1;
    });
}

module.exports = ensureSeeded;
