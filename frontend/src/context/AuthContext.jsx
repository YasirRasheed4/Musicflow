import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "../api";
import { disconnectSpotify } from "../spotifyAuth";
import { supabase } from "../lib/supabase";
import { clearOfflineUserData } from "../offline";

const AuthContext = createContext(null);
const OFFLINE_USER_KEY = "musicflow-offline-user";

function rememberUser(user) {
  if (user) localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
}

function getRememberedUser() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function getOfflineFallbackUser() {
  return typeof navigator !== "undefined" && !navigator.onLine ? getRememberedUser() : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (supabase) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (active) setUser(null);
        } else if (data.session) {
          try {
            const res = await api.get("/auth/me");
            if (active) {
              rememberUser(res.user);
              setUser(res.user);
            }
          } catch {
            const rememberedUser = getOfflineFallbackUser();
            if (active && rememberedUser) setUser(rememberedUser);
            else {
              await supabase.auth.signOut();
              if (active) setUser(null);
            }
          }
        } else if (getToken()) {
          try {
            const res = await api.get("/auth/me");
            if (active) {
              rememberUser(res.user);
              setUser(res.user);
            }
          } catch {
            const rememberedUser = getOfflineFallbackUser();
            if (active && rememberedUser) setUser(rememberedUser);
            else setToken(null);
          }
        }
        if (active) setLoading(false);
        return;
      }

      if (!getToken()) {
        if (active) setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (active) {
          rememberUser(res.user);
          setUser(res.user);
        }
      } catch {
        const rememberedUser = getOfflineFallbackUser();
        if (active && rememberedUser) setUser(rememberedUser);
        else setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setUser(null);
        setLoading(false);
      }
    }).data.subscription;

    loadUser();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      try {
        const res = await api.get("/auth/me");
        rememberUser(res.user);
        setUser(res.user);
        return res.user;
      } catch (error) {
        await supabase.auth.signOut();
        throw error;
      }
    }

    const res = await api.post("/auth/login", { email, password });
    setToken(res.token);
    rememberUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        throw new Error("Account created. Check your email to confirm it, then sign in.");
      }
      const res = await api.get("/auth/me");
      rememberUser(res.user);
      setUser(res.user);
      return res.user;
    }

    const res = await api.post("/auth/signup", { name, email, password });
    setToken(res.token);
    rememberUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      setToken(null);
      disconnectSpotify();
      localStorage.removeItem(OFFLINE_USER_KEY);
      try {
        await clearOfflineUserData();
      } catch (error) {
        console.error("Could not clear offline user data:", error);
      }
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
