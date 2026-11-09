import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Palette,
  User,
  Volume2,
  Database,
  Check,
  LogOut,
  Sparkles,
  Shield,
  Radio,
  Sliders,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePlayer } from "../context/PlayerContext";

const EQ_PRESETS = {
  flat: { name: "Flat", bass: 0, mids: 0, treble: 0 },
  bass: { name: "Bass Boost", bass: 12, mids: 0, treble: -2 },
  treble: { name: "Treble Boost", bass: -2, mids: 0, treble: 12 },
  vocal: { name: "Vocal", bass: -3, mids: 8, treble: 5 },
  classical: { name: "Classical", bass: 5, mids: 0, treble: 8 },
  hiphop: { name: "Hip-Hop", bass: 10, mids: 5, treble: 0 },
};

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const { stopPlayback } = usePlayer();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("appearance"); // appearance | account | audio | data
  const [autoplay, setAutoplay] = useState(true);
  const [audioQuality, setAudioQuality] = useState("high");
  const [cacheCleared, setCacheCleared] = useState(false);
  
  // Equalizer state
  const [bass, setBass] = useState(0);
  const [mids, setMids] = useState(0);
  const [treble, setTreble] = useState(0);
  const [eqEnabled, setEqEnabled] = useState(true);

  // Load equalizer settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("musicflow_eq_settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setBass(settings.bass || 0);
      setMids(settings.mids || 0);
      setTreble(settings.treble || 0);
      setEqEnabled(settings.enabled !== false);
    }
  }, []);

  // Save equalizer settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "musicflow_eq_settings",
      JSON.stringify({ bass, mids, treble, enabled: eqEnabled })
    );
    // Dispatch custom event for other components to listen
    window.dispatchEvent(
      new CustomEvent("eqSettingsChanged", {
        detail: { bass, mids, treble, enabled: eqEnabled },
      })
    );
  }, [bass, mids, treble, eqEnabled]);

  const applyPreset = (presetKey) => {
    const preset = EQ_PRESETS[presetKey];
    setBass(preset.bass);
    setMids(preset.mids);
    setTreble(preset.treble);
  };

  const resetEQ = () => {
    setBass(0);
    setMids(0);
    setTreble(0);
  };

  const handleLogout = () => {
    stopPlayback();
    logout();
    navigate("/login");
  };

  const handleClearCache = () => {
    localStorage.removeItem("musicflow_search_history");
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Settings & Preferences
        </h1>
        <p className="mt-1 text-sm text-muted">
          Customize your themes, account profile, and playback settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Navigation Tabs */}
        <nav className="flex flex-row gap-1.5 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveSection("appearance")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSection === "appearance"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            <Palette size={18} /> Appearance
          </button>
          <button
            onClick={() => setActiveSection("account")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSection === "account"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            <User size={18} /> Account
          </button>
          <button
            onClick={() => setActiveSection("audio")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSection === "audio"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            <Volume2 size={18} /> Playback
          </button>
          <button
            onClick={() => setActiveSection("data")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSection === "data"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            <Database size={18} /> Data & Session
          </button>
        </nav>

        {/* Content Area */}
        <div className="md:col-span-3">
          {/* Appearance Section */}
          {activeSection === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Theme Selector</h2>
                <p className="text-xs text-muted">
                  Choose a visual theme designed for your listening mood.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-accent ring-2 ring-accent/30 bg-surface shadow-xl"
                          : "border-line bg-surface/60 hover:border-accent/40 hover:bg-surface"
                      }`}
                    >
                      {/* Theme Preview Card Graphic */}
                      <div
                        className="relative mb-3 h-24 w-full overflow-hidden rounded-xl border border-white/10 p-3 shadow-inner"
                        style={{ backgroundColor: t.bgPreview }}
                      >
                        <div
                          className="flex h-6 w-full items-center justify-between rounded-lg px-2"
                          style={{ backgroundColor: t.cardPreview }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.accentColor }} />
                            <span className="h-1.5 w-12 rounded bg-white/20" />
                          </div>
                          <span className="text-xs">{t.icon}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <div className="h-10 w-10 shrink-0 rounded-md" style={{ backgroundColor: t.cardPreview }} />
                          <div className="flex-1 space-y-1 py-1">
                            <div className="h-2 w-3/4 rounded" style={{ backgroundColor: t.accentColor }} />
                            <div className="h-1.5 w-1/2 rounded bg-white/20" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-ink">{t.name}</span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">{t.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Section */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Account Details</h2>
                <p className="text-xs text-muted">Manage your profile and subscription info.</p>
              </div>

              {user ? (
                <div className="rounded-2xl border border-line bg-surface p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-bg shadow-lg">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">{user.name}</h3>
                      <p className="text-sm text-muted">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                          Active Listener
                        </span>
                        <span className="rounded-full bg-surface2 px-2.5 py-0.5 text-[11px] font-medium text-muted capitalize">
                          {user.role || "Standard User"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2 text-sm">
                    <div className="rounded-xl bg-surface2 p-3">
                      <p className="text-xs text-muted">Subscription</p>
                      <p className="font-semibold text-ink capitalize">{user.subscriptionStatus || "Free Tier (Unlimited)"}</p>
                    </div>
                    <div className="rounded-xl bg-surface2 p-3">
                      <p className="text-xs text-muted">Audio Stream Engine</p>
                      <p className="font-semibold text-emerald-400">Full Songs Enabled</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line p-8 text-center bg-surface/50">
                  <p className="text-muted mb-4">You are currently browsing as a guest.</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-bg"
                  >
                    Log In to Your Account
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Audio & Playback Section */}
          {activeSection === "audio" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Playback & Audio Settings</h2>
                <p className="text-xs text-muted">Configure streaming fidelity and playback behaviors.</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Continuous Autoplay</p>
                    <p className="text-xs text-muted">Automatically play the next song in queue or playlist</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                    className="h-5 w-5 rounded border-line text-accent focus:ring-accent"
                  />
                </div>

                <div className="border-t border-line pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Streaming Fidelity</p>
                    <p className="text-xs text-muted">High-quality full duration streaming</p>
                  </div>
                  <select
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(e.target.value)}
                    className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="high">High (320kbps Lossless)</option>
                    <option value="normal">Normal (160kbps)</option>
                    <option value="data-saver">Data Saver (96kbps)</option>
                  </select>
                </div>

                <div className="border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <Radio size={14} className="animate-pulse" />
                    <span>YouTube Full-Song & HTML5 Audio Engine Online</span>
                  </div>
                </div>
              </div>

              {/* Equalizer Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-accent" />
                  <h3 className="font-display text-lg font-bold text-ink">Equalizer</h3>
                </div>
                
                <div className="rounded-2xl border border-line bg-surface p-6 space-y-6">
                  {/* EQ Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Enable Equalizer</p>
                      <p className="text-xs text-muted">Customize audio frequency response</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={eqEnabled}
                      onChange={(e) => setEqEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-line text-accent focus:ring-accent"
                    />
                  </div>

                  {eqEnabled && (
                    <>
                      {/* Preset Buttons */}
                      <div className="border-t border-line pt-4">
                        <p className="mb-3 text-xs font-semibold text-muted uppercase">Presets</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {Object.entries(EQ_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              onClick={() => applyPreset(key)}
                              className="rounded-lg bg-surface2 px-3 py-2 text-xs font-semibold text-ink hover:bg-accent/20 hover:text-accent transition"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Equalizer Sliders */}
                      <div className="border-t border-line pt-4 space-y-4">
                        {/* Bass */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-ink">Bass</label>
                            <span className="text-xs font-mono text-accent">{bass > 0 ? "+" : ""}{bass}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={bass}
                            onChange={(e) => setBass(Number(e.target.value))}
                            className="w-full h-2 bg-surface2 rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                          <div className="flex justify-between text-[10px] text-muted mt-1">
                            <span>-20dB</span>
                            <span>0dB</span>
                            <span>+20dB</span>
                          </div>
                        </div>

                        {/* Mids */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-ink">Mids</label>
                            <span className="text-xs font-mono text-accent">{mids > 0 ? "+" : ""}{mids}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={mids}
                            onChange={(e) => setMids(Number(e.target.value))}
                            className="w-full h-2 bg-surface2 rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                          <div className="flex justify-between text-[10px] text-muted mt-1">
                            <span>-20dB</span>
                            <span>0dB</span>
                            <span>+20dB</span>
                          </div>
                        </div>

                        {/* Treble */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-ink">Treble</label>
                            <span className="text-xs font-mono text-accent">{treble > 0 ? "+" : ""}{treble}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={treble}
                            onChange={(e) => setTreble(Number(e.target.value))}
                            className="w-full h-2 bg-surface2 rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                          <div className="flex justify-between text-[10px] text-muted mt-1">
                            <span>-20dB</span>
                            <span>0dB</span>
                            <span>+20dB</span>
                          </div>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="border-t border-line pt-4">
                        <button
                          onClick={resetEQ}
                          className="flex items-center gap-2 rounded-lg bg-surface2 px-4 py-2 text-xs font-semibold text-ink hover:bg-line transition"
                        >
                          <RotateCcw size={14} /> Reset to Flat
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data & Session Section */}
          {activeSection === "data" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Data & Privacy</h2>
                <p className="text-xs text-muted">Manage cached audio, search history, and session data.</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Clear Cache & Search History</p>
                    <p className="text-xs text-muted">Reset temporary storage and local search terms</p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-2 rounded-xl bg-surface2 px-4 py-2 text-xs font-semibold text-ink hover:bg-line transition"
                  >
                    <Trash2 size={14} /> Clear Cache
                  </button>
                </div>

                {cacheCleared && (
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                    Search history and temporary storage cleared!
                  </div>
                )}

                {user && (
                  <div className="border-t border-line pt-4">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      <LogOut size={16} /> Log Out of MusicFlow
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
