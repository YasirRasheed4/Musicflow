const SHELL_CACHE = "musicflow-shell-v1";
const DATA_CACHE = "musicflow-public-data-v1";
const MEDIA_CACHE = "musicflow-offline-media";
const CURRENT_CACHES = new Set([SHELL_CACHE, DATA_CACHE, MEDIA_CACHE]);

function isPublicApiPath(pathname) {
  return (
    pathname === "/api/albums" ||
    /^\/api\/albums\/\d+$/.test(pathname) ||
    /^\/api\/albums\/\d+\/cover$/.test(pathname) ||
    pathname === "/api/tracks" ||
    /^\/api\/tracks\/\d+$/.test(pathname) ||
    pathname === "/api/search" ||
    pathname === "/api/playlists/public" ||
    /^\/api\/playlists\/\d+$/.test(pathname) ||
    pathname === "/api/rotation/albums"
  );
}

async function cachePublicData() {
  const cache = await caches.open(DATA_CACHE);
  const paths = [
    "/api/albums",
    "/api/tracks?limit=8",
    "/api/playlists/public",
    "/api/rotation/albums",
  ];

  const responses = await Promise.all(
    paths.map(async (path) => {
      try {
        const response = await fetch(path);
        if (!response.ok) return null;
        await cache.put(path, response.clone());
        return { path, response };
      } catch {
        return null;
      }
    })
  );

  const albumsResponse = responses.find((item) => item?.path === "/api/albums")?.response;
  const playlistsResponse = responses.find((item) => item?.path === "/api/playlists/public")?.response;
  const details = [];

  if (albumsResponse) {
    const { albums } = await albumsResponse.json();
    details.push(...albums.slice(0, 20).map((album) => `/api/albums/${album.id}`));
  }
  if (playlistsResponse) {
    const { playlists } = await playlistsResponse.json();
    details.push(...playlists.slice(0, 20).map((playlist) => `/api/playlists/${playlist.id}`));
  }

  await Promise.all(
    details.map(async (path) => {
      try {
        const response = await fetch(path);
        if (!response.ok) return;
        if (path.startsWith("/api/playlists/")) {
          const data = await response.clone().json();
          if (!data.playlist?.isPublic) return;
        }
        await cache.put(path, response);
      } catch {
        return;
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const response = await fetch("/");
      if (!response.ok) throw new Error("Unable to cache the MusicFlow app shell");
      await cache.put("/", response.clone());
      await cache.put("/index.html", response.clone());

      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((match) => match[1]);
      await cache.addAll(["/manifest.webmanifest", "/favicon.svg", ...assets]);
      await cachePublicData();
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("musicflow-") && !CURRENT_CACHES.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirstApi(request, url) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      if (/^\/api\/playlists\/\d+$/.test(url.pathname)) {
        const data = await response.clone().json();
        if (!data.playlist?.isPublic) return response;
      }
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return (
      cached ||
      new Response(JSON.stringify({ error: "This content is not available offline yet." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}

async function audioResponse(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const url = request.url;
  let response = await cache.match(url);

  if (!response) {
    try {
      const fullRequest = request.headers.has("Range")
        ? new Request(url, { credentials: "same-origin" })
        : request;
      response = await fetch(fullRequest);
      if (response.ok && response.status === 200) {
        await cache.put(url, response.clone());
      }
    } catch {
      return new Response("Audio is not saved for offline playback.", { status: 503 });
    }
  }

  const range = request.headers.get("Range");
  if (!range || response.status !== 200) return response;

  const bytes = await response.arrayBuffer();
  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) return new Response(null, { status: 416 });

  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[2] && match[1] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${bytes.byteLength}` },
    });
  }

  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
      "Content-Type": response.headers.get("Content-Type") || "audio/wav",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/audio/") || /^\/api\/tracks\/\d+\/audio$/.test(url.pathname)) {
    event.respondWith(audioResponse(request));
    return;
  }

  if (url.pathname.startsWith("/api/") && isPublicApiPath(url.pathname)) {
    event.respondWith(networkFirstApi(request, url));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match("/index.html")) || new Response("MusicFlow is unavailable offline.", { status: 503 });
      })
    );
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/covers/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.svg"
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
      )
    );
  }
});