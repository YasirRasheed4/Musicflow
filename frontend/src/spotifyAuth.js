const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = `${window.location.origin}/spotify/callback`;
const PENDING_KEY = "musicflow_spotify_oauth_pending";
const TOKEN_KEY = "musicflow_spotify_session";
const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

function randomString(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function isSpotifyConfigured() {
  return Boolean(CLIENT_ID);
}

export function hasSpotifySession() {
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}

export async function beginSpotifyAuthorization() {
  if (!CLIENT_ID) {
    throw new Error("Spotify import is not configured yet. The site owner must add its Spotify Client ID in Vercel.");
  }

  const popup = window.open("about:blank", "musicflowSpotify", "popup,width=520,height=720");
  if (!popup) {
    throw new Error("Spotify sign-in was blocked by your browser. Allow pop-ups for MusicFlow and try again.");
  }

  try {
    const verifier = randomString(64);
    const state = randomString(32);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = base64UrlEncode(digest);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier, state }));

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: "playlist-read-private playlist-read-collaborative",
    });
    popup.location.replace(`${SPOTIFY_ACCOUNTS}/authorize?${params}`);
    return popup;
  } catch (error) {
    popup.close();
    throw error;
  }
}

export async function finishSpotifyAuthorization({ code, state, error }) {
  const pending = sessionStorage.getItem(PENDING_KEY);
  if (!pending) {
    throw new Error("Spotify sign-in expired. Close this window and connect again.");
  }

  const { verifier, state: expectedState } = JSON.parse(pending);
  if (!state || state !== expectedState) {
    sessionStorage.removeItem(PENDING_KEY);
    throw new Error("Spotify sign-in could not be verified. Please connect again.");
  }
  if (error) {
    sessionStorage.removeItem(PENDING_KEY);
    throw new Error(error === "access_denied" ? "Spotify access was canceled." : "Spotify authorization failed.");
  }
  if (!code) {
    throw new Error("Spotify did not return an authorization code.");
  }

  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Spotify returned an invalid token response.");
  }
  if (!response.ok) {
    throw new Error(data.error_description || "Spotify could not complete sign-in. Please connect again.");
  }

  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    })
  );
  sessionStorage.removeItem(PENDING_KEY);
  return data.access_token;
}

export async function getSpotifyAccessToken() {
  const session = sessionStorage.getItem(TOKEN_KEY);
  if (!session) return null;

  const tokens = JSON.parse(session);
  if (tokens.expiresAt > Date.now() + 30_000) return tokens.accessToken;
  if (!tokens.refreshToken) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error("Your Spotify connection expired. Connect Spotify again.");
  }

  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Spotify returned an invalid token response.");
  }
  if (!response.ok) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error("Your Spotify connection expired. Connect Spotify again.");
  }

  const refreshed = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(refreshed));
  return refreshed.accessToken;
}

export function disconnectSpotify() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PENDING_KEY);
}
