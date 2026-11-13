const assert = require("node:assert/strict");
const test = require("node:test");
const { findOrCreateSpotifyTrack } = require("./spotifyTracks");

function createTrackStore() {
  const tracks = [];
  let nextId = 1;
  return {
    tracks,
    prepare(sql) {
      if (sql.includes("WHERE LOWER(title)")) {
        return {
          all: async (title, artistId, albumId) =>
            tracks.filter((track) =>
              track.title.toLowerCase() === title.toLowerCase() &&
              track.artist_id === artistId &&
              track.album_id === albumId &&
              track.genre_tags.includes("spotify")
            ),
        };
      }
      if (sql.includes("INSERT INTO tracks")) {
        return {
          run: async (...values) => {
            const id = Math.max(nextId, ...tracks.map((track) => track.id + 1));
            nextId = id + 1;
            const track = {
              id,
              title: values[0],
              artist_id: values[1],
              album_id: values[2],
              genre_tags: '["spotify"]',
            };
            tracks.push(track);
            return { lastInsertRowid: track.id };
          },
        };
      }
      return {
        get: async (id) => tracks.find((track) => track.id === id),
      };
    },
  };
}

const baseTrack = {
  title: "Same Song",
  artistId: 7,
  albumId: 12,
  duration: 180,
  audioUrl: "/audio/sample.mp3",
  coverUrl: "/covers/sample.png",
};

test("keeps a matching song as a separate track for a different album", async () => {
  const store = createTrackStore();

  const first = await findOrCreateSpotifyTrack(store, baseTrack);
  const second = await findOrCreateSpotifyTrack(store, { ...baseTrack, albumId: 13 });

  assert.notEqual(first.id, second.id);
  assert.deepEqual(store.tracks.map((track) => track.album_id), [12, 13]);
});

test("preserves repeated occurrences in an album and reuses them on reimport", async () => {
  const store = createTrackStore();

  const first = await findOrCreateSpotifyTrack(store, baseTrack, 0);
  const repeated = await findOrCreateSpotifyTrack(store, baseTrack, 1);
  const reimportedFirst = await findOrCreateSpotifyTrack(store, baseTrack, 0);
  const reimportedRepeated = await findOrCreateSpotifyTrack(store, baseTrack, 1);

  assert.notEqual(first.id, repeated.id);
  assert.equal(reimportedFirst.id, first.id);
  assert.equal(reimportedRepeated.id, repeated.id);
  assert.equal(store.tracks.length, 2);
});

test("does not reuse a device-uploaded track with matching metadata", async () => {
  const store = createTrackStore();
  store.tracks.push({
    id: 1,
    title: baseTrack.title,
    artist_id: baseTrack.artistId,
    album_id: baseTrack.albumId,
    genre_tags: '["uploaded"]',
  });

  const imported = await findOrCreateSpotifyTrack(store, baseTrack);

  assert.notEqual(imported.id, 1);
});
