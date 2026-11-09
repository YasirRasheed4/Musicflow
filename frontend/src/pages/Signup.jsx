import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Moon, Sun, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MusicFlowIcon from "../components/MusicFlowIcon";

export default function Signup() {
  const { signup } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
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

      <div
        className="w-full max-w-md rounded-3xl border p-8 shadow-2xl"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-line)" }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "var(--color-accent)" }}
          >
            <MusicFlowIcon size={44} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-xs text-muted">Join MusicFlow — build playlists, import Spotify, stream full songs</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500 bg-red-500 bg-opacity-10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full rounded-xl bg-surface2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                style={{ border: "1px solid var(--color-line)" }}
              />
              <User size={15} className="absolute right-3.5 top-3 text-muted" />
            </div>
          </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-bold hover:underline" style={{ color: "var(--color-accent)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
