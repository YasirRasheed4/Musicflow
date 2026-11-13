import { Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { PlaylistsProvider } from "./context/PlaylistsContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import MobileNav from "./components/MobileNav";
import PlayerBar from "./components/PlayerBar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AlbumDetail from "./pages/AlbumDetail";
import PlaylistDetail from "./pages/PlaylistDetail";
import SpotifyOAuthCallback from "./pages/SpotifyOAuthCallback";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <PlaylistsProvider>
            <PlayerProvider>
              <div className="flex h-screen flex-col bg-bg font-sans text-ink selection:bg-accent selection:text-bg">
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/albums/:id" element={<AlbumDetail />} />
                        <Route path="/playlists/:id" element={<PlaylistDetail />} />
                        <Route path="/spotify/callback" element={<SpotifyOAuthCallback />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                      </Routes>
                    </main>
                  </div>
                </div>
                <PlayerBar />
                <MobileNav />
                <SpeedInsights />
              </div>
            </PlayerProvider>
          </PlaylistsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
