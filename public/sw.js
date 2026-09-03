/**
 * Service worker — offline study support.
 * - Navigations: network-first, successful pages cached → work offline after first visit.
 * - Static assets (/_next/static, icons, covers, temee): cache-first.
 * - Supabase Storage PUBLIC objects (lesson audio/covers): cache-first.
 * Never caches Supabase REST/auth, /api, /admin.
 */
const VERSION = "v3";
const OFFLINE_CACHE = `buunduu-surtsgaay-offline-${VERSION}`;
const PAGES_CACHE = `buunduu-pages-${VERSION}`;
const STATIC_CACHE = `buunduu-static-${VERSION}`;
const MEDIA_CACHE = `buunduu-media-${VERSION}`;
const KEEP = new Set([OFFLINE_CACHE, PAGES_CACHE, STATIC_CACHE, MEDIA_CACHE]);
const OFFLINE_URL = "/offline.html";
const PAGES_MAX_ENTRIES = 120;
const MEDIA_MAX_ENTRIES = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith("buunduu-surtsgaay-offline-") ||
                key.startsWith("buunduu-pages-") ||
                key.startsWith("buunduu-static-") ||
                key.startsWith("buunduu-media-")) &&
              !KEEP.has(key)
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isPrivateNetworkHost(hostname) {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    return true;
  }
  if (hostname.endsWith(".local")) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

/** Public Supabase Storage object (lesson audio / covers) — safe to cache. */
function isPublicStorageUrl(url) {
  return (
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/storage/v1/object/public/")
  );
}

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/_next/image")) return true;
  if (url.pathname.startsWith("/icons/")) return true;
  if (url.pathname.startsWith("/covers/")) return true;
  if (url.pathname.startsWith("/temee/")) return true;
  if (url.pathname.startsWith("/vendor/")) return true;
  if (url.pathname === "/logo.png") return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|mp3|m4a|ogg|css|js)$/.test(url.pathname)) {
    return true;
  }
  return false;
}

function shouldBypass(url) {
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/admin")) return true;
    if (url.pathname.startsWith("/debug")) return true;
    if (url.pathname.startsWith("/api")) return true;
    if (url.pathname.includes("_next/webpack-hmr")) return true;
    if (isPrivateNetworkHost(url.hostname)) return true;
    return false;
  }
  // Cross-origin: only public Supabase Storage objects are handled.
  return !isPublicStorageUrl(url);
}

function isLikelyOfflineFetchFailure(error) {
  return (
    error instanceof TypeError ||
    (error && typeof error.message === "string" && /failed to fetch|network/i.test(error.message))
  );
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const excess = keys.length - maxEntries;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  } catch {
    // ignore
  }
}

function cacheableCopy(response) {
  if (!response) return null;
  if (response.type === "opaque") return response.clone();
  if (response.ok) return response.clone();
  return null;
}

/** Cache-first with background-less network fallback. */
async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  const copy = cacheableCopy(response);
  if (copy) {
    cache.put(request, copy).then(() => trimCache(cacheName, maxEntries));
  }
  return response;
}

function buildNavigationErrorPage(message) {
  const safeMessage = String(message || "Navigation failed while online.");
  return `<!DOCTYPE html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Холболтын алдаа</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; padding: 1.5rem; }
      .card { max-width: 28rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
      h1 { font-size: 1.125rem; margin: 0 0 0.75rem; }
      p { font-size: 0.875rem; line-height: 1.6; color: #475569; margin: 0 0 1rem; }
      a, button { display: inline-block; border: 0; border-radius: 9999px; padding: 0.65rem 1rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; cursor: pointer; }
      .primary { background: #059669; color: #fff; }
      .secondary { background: #fff; color: #334155; border: 1px solid #e2e8f0; margin-left: 0.5rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Холболтын алдаа</h1>
      <p>${safeMessage}</p>
      <button type="button" class="primary" onclick="location.reload()">Try again</button>
      <a href="/" class="secondary">Home</a>
    </div>
  </body>
</html>`;
}

/** Network-first navigation; successful pages cached for offline reuse. */
async function handleNavigation(event) {
  const request = event.request;
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache
        .put(request, response.clone())
        .then(() => trimCache(PAGES_CACHE, PAGES_MAX_ENTRIES));
    }
    return response;
  } catch (error) {
    const cachedPage = await cache.match(request, { ignoreVary: true });
    if (cachedPage) return cachedPage;

    if (isLikelyOfflineFetchFailure(error)) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    return new Response(buildNavigationErrorPage(error && error.message), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (shouldBypass(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isPublicStorageUrl(url)) {
    event.respondWith(cacheFirst(event.request, MEDIA_CACHE, MEDIA_MAX_ENTRIES));
    return;
  }

  if (url.origin === self.location.origin) {
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirst(event.request, STATIC_CACHE, 1500));
      return;
    }
    // Other same-origin GETs (RSC payloads etc.): network-first with cache fallback.
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES_CACHE);
        try {
          const response = await fetch(event.request);
          if (response && response.ok) {
            cache
              .put(event.request, response.clone())
              .then(() => trimCache(PAGES_CACHE, PAGES_MAX_ENTRIES));
          }
          return response;
        } catch (error) {
          const cached = await cache.match(event.request, { ignoreVary: true });
          if (cached) return cached;
          throw error;
        }
      })()
    );
  }
});
