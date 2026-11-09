require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const trackRoutes = require("./routes/tracks");
const albumRoutes = require("./routes/albums");
const artistRoutes = require("./routes/artists");
const playlistRoutes = require("./routes/playlists");
const favoritesRoutes = require("./routes/favorites");
const spotifyRoutes = require("./routes/spotify");

const PORT = process.env.PORT || 4000;
const app = express();

const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
app.use(express.json({ limit: "50mb" }));

// Placeholder audio + cover art generated for this starter (see generate_assets.py).
// Swap for signed URLs to real licensed audio/S3 storage per the PRD when available.
app.use("/audio", express.static(path.join(__dirname, "audio")));
app.use("/covers", express.static(path.join(__dirname, "covers")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api", trackRoutes);
app.use("/api", albumRoutes);
app.use("/api", artistRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`MusicFlow API listening on http://localhost:${PORT}`);
});
