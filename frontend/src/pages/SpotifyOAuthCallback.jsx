import { useEffect, useState } from "react";

export default function SpotifyOAuthCallback() {
  const [message, setMessage] = useState("Finishing Spotify sign-in...");

  useEffect(() => {
    if (!window.opener || window.opener.closed) {
      setMessage("Return to MusicFlow and start Spotify sign-in again.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    window.opener.postMessage(
      {
        type: "musicflow-spotify-oauth",
        code: params.get("code"),
        state: params.get("state"),
        error: params.get("error"),
      },
      window.location.origin
    );
    window.close();
  }, []);

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl bg-surface p-8 text-center">
      <h1 className="font-display text-xl font-bold text-ink">Spotify sign-in</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}
