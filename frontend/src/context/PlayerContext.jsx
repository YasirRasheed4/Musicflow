import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api";
import { Equalizer } from "../utils/equalizer";
import { useAuth } from "./AuthContext";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const eqRef = useRef(null);
  const audioContextRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const modeRef = useRef("audio"); // "audio" | "youtube"
  const userRef = useRef(user);
  const playbackSessionRef = useRef(0);
  const currentPlaybackTrackIdRef = useRef(null);
  const reportedPlaybackSessionRef = useRef(0);
  const youtubeVideoIdsRef = useRef(new Map());

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playbackHistoryVersion, setPlaybackHistoryVersion] = useState(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const recordPlayback = useCallback((session = playbackSessionRef.current, trackId = currentPlaybackTrackIdRef.current) => {
    if (
      !userRef.current ||
      !trackId ||
      session !== playbackSessionRef.current ||
      reportedPlaybackSessionRef.current === session
    ) {
      return;
    }

    reportedPlaybackSessionRef.current = session;
    api.post("/history/plays", { trackId })
      .then(() => setPlaybackHistoryVersion((version) => version + 1))
      .catch((error) => {
        if (playbackSessionRef.current === session) reportedPlaybackSessionRef.current = 0;
        console.error("Failed to record playback history:", error);
      });
  }, []);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Initialize YouTube Iframe Player in background
  useEffect(() => {
    const checkYT = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player("yt-player", {
            height: "1",
            width: "1",
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onStateChange: (event) => {
                // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
                if (event.data === 1) {
                  setIsPlaying(true);
                  recordPlayback();
                }
                else if (event.data === 2) setIsPlaying(false);
                else if (event.data === 0) {
                  const q = queueRef.current;
                  const i = indexRef.current;
                  if (i + 1 < q.length) playAt(i + 1);
                  else setIsPlaying(false);
                }
              },
              onReady: (event) => {
                event.target.setVolume(volume * 100);
              },
            },
          });
        } catch (e) {
          console.error("Failed to initialize YouTube player:", e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      checkYT();
    } else {
      const timer = setInterval(() => {
        if (window.YT && window.YT.Player) {
          checkYT();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [recordPlayback, volume]);

  // YouTube progress tracking timer
  useEffect(() => {
    let timer;
    if (isPlaying && modeRef.current === "youtube") {
      timer = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
          try {
            const time = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (typeof time === "number") setProgress(time);
            if (typeof dur === "number" && dur > 0) setDuration(dur);
          } catch (e) {}
        }
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const playAt = useCallback(
    async (index) => {
      const q = queueRef.current;
      const audio = audioRef.current;
      if (index < 0 || index >= q.length) return;

      const track = q[index];
      playbackSessionRef.current += 1;
      currentPlaybackTrackIdRef.current = track.id;
      const playbackSession = playbackSessionRef.current;
      setCurrentIndex(index);
      indexRef.current = index;
      setProgress(0);
      setDuration(track.duration || 180);

      const isLocalAudio =
        track.audioUrl &&
        (track.audioUrl.startsWith("/audio/") ||
          track.audioUrl.endsWith(".wav") ||
          track.audioUrl.endsWith(".mp3") ||
          track.audioUrl.startsWith("blob:"));

      if (isLocalAudio && !track.audioUrl.startsWith("youtube:")) {
        // Mode: HTML5 Audio
        modeRef.current = "audio";
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
        if (audio) {
          audio.src = track.audioUrl;
          audio.currentTime = 0;
          audio.play().then(() => recordPlayback(playbackSession, track.id)).catch(() => {});
        }
      } else {
        // Mode: YouTube Full Song Stream
        modeRef.current = "youtube";
        if (audio) audio.pause();

        let videoId = "";
        if (track.audioUrl && track.audioUrl.startsWith("youtube:")) {
          videoId = track.audioUrl.replace("youtube:", "");
        } else if (youtubeVideoIdsRef.current.has(track.id)) {
          videoId = youtubeVideoIdsRef.current.get(track.id);
        } else {
          // Resolve on-demand from backend
          setLoadingAudio(true);
          try {
            const res = await api.get(`/tracks/${track.id}/youtube`);
            if (res.videoId) {
              videoId = res.videoId;
              youtubeVideoIdsRef.current.set(track.id, videoId);
              if (res.duration) {
                track.duration = res.duration;
                setDuration(res.duration);
              }
            }
          } catch (err) {
            console.error("Failed to resolve track YouTube audio:", err);
          } finally {
            setLoadingAudio(false);
          }
        }

        if (videoId && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          try {
            ytPlayerRef.current.loadVideoById(videoId);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {
            console.error("YouTube play error:", e);
          }
        } else if (audio && track.audioUrl && !track.audioUrl.startsWith("youtube:")) {
          // Fallback to preview audio if YouTube player not yet ready
          modeRef.current = "audio";
          audio.src = track.audioUrl;
          audio.currentTime = 0;
          audio.play().then(() => recordPlayback(playbackSession, track.id)).catch(() => {});
        }
      }
    },
    [recordPlayback]
  );

  // Setup HTML5 Audio listeners
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => {
      if (modeRef.current === "audio") setProgress(audio.currentTime);
    };
    const onMeta = () => {
      if (modeRef.current === "audio") setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (modeRef.current === "audio") {
        const q = queueRef.current;
        const i = indexRef.current;
        if (i + 1 < q.length) playAt(i + 1);
        else setIsPlaying(false);
      }
    };
    const onPlay = () => {
      if (modeRef.current === "audio") {
        setIsPlaying(true);
        recordPlayback();
      }
    };
    const onPause = () => {
      if (modeRef.current === "audio") setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [playAt, recordPlayback, volume]);

  // Setup Equalizer
  useEffect(() => {
    const setupEqualizer = () => {
      if (audioRef.current && !eqRef.current) {
        try {
          // Create audio context if not exists
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          // Initialize equalizer with audio context and audio element
          eqRef.current = new Equalizer(audioContextRef.current, audioRef.current);
          
          // Load saved EQ settings
          const saved = localStorage.getItem("musicflow_eq_settings");
          if (saved) {
            const settings = JSON.parse(saved);
            if (settings.enabled) {
              eqRef.current.setEQ(settings);
            }
          }
        } catch (error) {
          console.error("Failed to setup equalizer:", error);
        }
      }
    };

    // Setup on first play
    const handlePlayAttempt = () => {
      setupEqualizer();
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("play", handlePlayAttempt);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("play", handlePlayAttempt);
        }
      };
    }
  }, []);

  // Listen for EQ settings changes
  useEffect(() => {
    const handleEQChange = (event) => {
      if (eqRef.current && event.detail.enabled) {
        eqRef.current.setEQ({
          bass: event.detail.bass,
          mids: event.detail.mids,
          treble: event.detail.treble,
        });
      } else if (eqRef.current) {
        eqRef.current.reset();
      }
    };

    window.addEventListener("eqSettingsChanged", handleEQChange);
    return () => {
      window.removeEventListener("eqSettingsChanged", handleEQChange);
    };
  }, []);

  const playTrack = useCallback(
    (track, list) => {
      const newQueue = list && list.length ? list : [track];
      const idx = Math.max(0, newQueue.findIndex((t) => t.id === track.id));
      setQueue(newQueue);
      queueRef.current = newQueue;
      playAt(idx);
    },
    [playAt]
  );

  const togglePlay = useCallback(() => {
    if (modeRef.current === "youtube" && ytPlayerRef.current) {
      try {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {}
    } else {
      const audio = audioRef.current;
      if (!audio || !audio.src) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    }
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (i + 1 < q.length) playAt(i + 1);
  }, [playAt]);

  const prev = useCallback(() => {
    if (modeRef.current === "youtube" && ytPlayerRef.current) {
      try {
        if (progress > 3) {
          ytPlayerRef.current.seekTo(0, true);
          setProgress(0);
          return;
        }
      } catch (e) {}
    } else {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
    }

    const i = indexRef.current;
    if (i - 1 >= 0) playAt(i - 1);
    else seek(0);
  }, [playAt, progress]);

  const seek = useCallback((time) => {
    setProgress(time);
    if (modeRef.current === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(time, true);
      } catch (e) {}
    } else {
      const audio = audioRef.current;
      if (audio) audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        ytPlayerRef.current.setVolume(v * 100);
      } catch (e) {}
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === "function") {
      try {
        ytPlayerRef.current.stopVideo();
      } catch (e) {}
    }
    currentPlaybackTrackIdRef.current = null;
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentTrack,
        currentIndex,
        isPlaying,
        loadingAudio,
        playbackHistoryVersion,
        progress,
        duration,
        volume,
        playTrack,
        togglePlay,
        stopPlayback,
        next,
        prev,
        seek,
        setVolume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
