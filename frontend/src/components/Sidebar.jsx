import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Library,
  Settings,
  Sparkles,
  LogOut,
  Plus,
  Layers,
} from "lucide-react";
import MusicFlowIcon from "./MusicFlowIcon";
import { useAuth } from "../context/AuthContext";
import { usePlaylists } from "../context/PlaylistsContext";
import { usePlayer } from "../context/PlayerContext";
import ImportSpotifyModal from "./ImportSpotifyModal";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { playlists } = usePlaylists();
  const { stopPlayback } = usePlayer();
  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleLogout = () => {
    stopPlayback();
    logout();
    navigate("/login");
  };

  const navItemClass = ({ isActive }) =>
    `nav-active-glow group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? "bg-surface2 text-accent"
        : "text-muted hover:bg-surface2 hover:text-ink"
    }`;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex" style={{ borderRightColor: "var(--color-line)" }}>
      <div className="p-4 pb-0">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
            style={{ background: "var(--color-accent)" }}
          >
            <MusicFlowIcon size={30} />
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-tight text-ink">MusicFlow</span>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-accent)" }}>
              Pro Studio
            </p>
          </div>
        </div>

        {/* Main Nav */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">Navigation</p>
          <NavLink to="/" end className={navItemClass}>
            <Home size={17} /> Home
          </NavLink>
          <NavLink to="/search" className={navItemClass}>
            <Compass size={17} /> Discover
          </NavLink>
          <NavLink to="/library" className={navItemClass}>
            {({ isActive }) => (
              <>
                <Library size={17} />
                <span className="flex-1">Library</span>
                {user && playlists.length > 0 && (
                  <span className="rounded-full bg-surface text-xs px-1.5 py-0.5 text-muted font-bold">
                    {playlists.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
          <NavLink to="/settings" className={navItemClass}>
            <Settings size={17} /> Settings
          </NavLink>
        </div>
      </div>

      {/* Playlists */}
      {user && (
        <div className="mt-5 flex flex-1 flex-col overflow-hidden px-4">
          <div className="flex items-center justify-between pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Playlists</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition hover:bg-surface2"
              style={{ color: "var(--color-accent)" }}
              title="Add Music"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {playlists.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted">No playlists yet.</p>
            ) : (
              playlists.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/playlists/${p.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                      isActive ? "bg-surface2 text-accent font-semibold" : "text-muted hover:bg-surface2 hover:text-ink"
                    }`
                  }
                >
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded bg-surface2 flex items-center justify-center">
                    {p.coverUrl ? (
                      <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Layers size={11} className="text-muted" />
                    )}
                  </div>
                  <span className="truncate flex-1">{p.name}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      )}

      {showImportModal && <ImportSpotifyModal onClose={() => setShowImportModal(false)} />}

      {/* User Bottom Card */}
      <div className="mt-auto border-t p-4" style={{ borderTopColor: "var(--color-line)" }}>
        {user ? (
          <div className="flex items-center justify-between rounded-xl p-2.5 bg-surface2">
            <NavLink to="/settings" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted">Online</span>
                </div>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-red-400"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <NavLink
              to="/login"
              className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-bold transition hover:opacity-90"
              style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
            >
              Sign In
            </NavLink>
            <NavLink
              to="/signup"
              className="flex w-full items-center justify-center rounded-xl bg-surface2 py-1.5 text-xs font-semibold text-muted hover:text-ink transition"
            >
              Create Account
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
