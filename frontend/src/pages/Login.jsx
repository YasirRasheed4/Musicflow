import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, Moon, Sun, Settings, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MusicFlowIcon from "../components/MusicFlowIcon";

export default function Login() {
  const { login } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("demo@musicflow.app");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login("demo@musicflow.app", "demo1234");
      navigate("/");
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
      {/* Top action bar */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}
        >
          {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
          <span className="capitalize">{theme}</span>
        </button>
        <Link
          to="/settings"
          className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}
        >
          <Settings size={13} /> Settings
        </Link>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-md rounded-3xl border p-8 shadow-2xl"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-line)" }}
      >
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "var(--color-accent)" }}
          >
            <MusicFlowIcon size={44} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Welcome to MusicFlow</h1>
          <p className="mt-1 text-xs text-muted">Full-length music · Spotify import · Playlists</p>
        </div>

        {/* Demo login banner */}
        <div
          className="mb-5 rounded-2xl border p-4 text-center"
          style={{ background: "color-mix(in srgb, var(--color-accent) 10%, transparent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: "var(--color-accent)" }}>
            <Sparkles size={14} /> 1-Click Demo Access
          </div>
          <p className="mt-1 text-[11px] text-muted">Seeded playlists, full audio, and all features enabled</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            Sign in as Demo Listener <ArrowRight size={13} />
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t" style={{ borderColor: "var(--color-line)" }} />
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted" style={{ background: "var(--color-surface)" }}>
            or sign in
          </span>
          <div className="flex-1 border-t" style={{ borderColor: "var(--color-line)" }} />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500 bg-red-500 bg-opacity-10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-surface2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                style={{ border: "1px solid var(--color-line)" }}
              />
              <Mail size={15} className="absolute right-3.5 top-3 text-muted" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-surface2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                style={{ border: "1px solid var(--color-line)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-ink)", color: "var(--color-bg)" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          No account yet?{" "}
          <Link to="/signup" className="font-bold hover:underline" style={{ color: "var(--color-accent)" }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
