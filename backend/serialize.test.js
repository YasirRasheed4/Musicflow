const assert = require("node:assert/strict");
const test = require("node:test");
const serialize = require("./serialize");

test("does not expose existing Spotify preview tracks as downloadable", () => {
  const track = serialize.track({
    id: 1,
    title: "Preview Track",
    genre_tags: '["spotify"]',
    is_downloadable: 1,
  });

  assert.equal(track.isDownloadable, false);
});

test("preserves downloads for uploaded tracks", () => {
  const track = serialize.track({
    id: 2,
    title: "Uploaded Track",
    genre_tags: '["uploaded"]',
    is_downloadable: 1,
  });

  assert.equal(track.isDownloadable, true);
});
