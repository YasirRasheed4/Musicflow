import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, Settings, ChevronLeft, ChevronRight, Search, LogOut, Palette, Sparkles } from "lucide-react";
import MusicFlowIcon from "./MusicFlowIcon";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePlayer } from "../context/PlayerContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, setTheme, cycleTheme, themes } = useTheme();
  const { stopPlayback } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    stopPlayback();
    logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/") return "Home";
    if (path === "/search") return "Discover & Search";
    if (path === "/library") return "Your Library";
    if (path === "/settings") return "Settings";
    if (path.startsWith("/albums/")) return "Album";
    if (path.startsWith("/playlists/")) return "Playlist";
    if (path === "/login") return "Sign In";
    if (path === "/signup") return "Create Account";
    return "MusicFlow";
  };

  const themeIcon = theme === "light" ? <Moon size={14} /> : theme === "cyberpunk" ? <Sparkles size={14} /> : <Sun size={14} />;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:px-8"
      style={{ borderBottomColor: "var(--color-line)", background: "var(--color-bg)" }}>
      {/* Left: Back/Forward + Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted transition hover:text-ink"
            aria-label="Go back"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted transition hover:text-ink"
            aria-label="Go forward"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <MusicFlowIcon size={30} />
          <span className="font-display text-sm font-bold tracking-tight text-ink">MusicFlow</span>
        </div>
        <span className="hidden text-sm font-bold text-muted sm:block">{getBreadcrumb()}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Search */}
        {location.pathname !== "/search" && (
          <NavLink
            to="/search"
            className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted hover:text-ink transition"
            style={{ borderColor: "var(--color-line)" }}
          >
            <Search size={13} />
            Search...
          </NavLink>
        )}

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink transition"
          style={{ borderColor: "var(--color-line)" }}
          title={`Theme: ${theme}. Click to switch`}
        >
          <span style={{ color: "var(--color-accent)" }}>{themeIcon}</span>
          <span className="hidden capitalize lg:inline">{theme}</span>
        </button>

        {/* Settings */}
        <NavLink
          to="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border text-muted transition hover:text-ink"
          style={{ borderColor: "var(--color-line)" }}
          title="Settings"
        >
          <Settings size={15} />
        </NavLink>

        {/* User dropdown or Login button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border px-1 pr-3 py-1 transition hover:bg-surface2"
              style={{ borderColor: "var(--color-line)" }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden text-xs font-semibold text-ink sm:block max-w-[90px] truncate">
                {user.name}
              </span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border shadow-2xl"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-line)" }}
              >
                {/* User Info */}
                <div className="border-b px-4 py-3" style={{ borderBottomColor: "var(--color-line)" }}>
                  <p className="font-bold text-sm text-ink truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>

                {/* Theme Grid */}
                <div className="border-b p-3" style={{ borderBottomColor: "var(--color-line)" }}>
                  <p className="flex items-center gap-1 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                    <Palette size={11} /> Theme
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t.id); setDropdownOpen(false); }}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition"
                        style={
                          theme === t.id
                            ? { background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: "700" }
                            : { color: "var(--color-muted)" }
                        }
                        onMouseEnter={e => { if (theme !== t.id) e.currentTarget.style.background = "var(--color-surface2)"; e.currentTarget.style.color = "var(--color-ink)"; }}
                        onMouseLeave={e => { if (theme !== t.id) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--color-muted)"; } }}
                      >
                        <span>{t.icon}</span>
                        <span className="truncate">{t.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <NavLink
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface2 hover:text-ink"
                  >
                    <Settings size={14} /> Full Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-surface2"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NavLink
            to="/login"
            className="rounded-full px-4 py-1.5 text-xs font-bold transition hover:opacity-90"
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            Sign In
          </NavLink>
        )}
      </div>
    </header>
  );
}
