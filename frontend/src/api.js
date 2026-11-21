import { supabase } from "./lib/supabase";

const TOKEN_KEY = "musicflow_token";
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function getAuthToken() {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  return getToken();
}

async function request(path, options = {}) {
  const token = await getAuthToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch {
          // The local session is cleared even if Supabase cannot be reached.
        }
      }
    }
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data, options = {}) =>
    request(path, { ...options, method: "POST", body: JSON.stringify(data || {}) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data || {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
