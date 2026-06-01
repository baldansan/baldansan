/**
 * Minimal service worker — offline navigation fallback only.
 * Does NOT cache Supabase API, admin routes, or authenticated responses.
 */
const CACHE_NAME = "buunduu-surtsgaay-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("buunduu-surtsgaay-offline-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function shouldBypass(url) {
  if (url.pathname.startsWith("/admin")) return true;
  if (url.pathname.startsWith("/api")) return true;
  if (url.hostname.includes("supabase")) return true;
  if (url.pathname.includes("_next/webpack-hmr")) return true;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
  return false;
}

function isLikelyOfflineFetchFailure(error) {
  return (
    error instanceof TypeError ||
    (error && typeof error.message === "string" && /failed to fetch|network/i.test(error.message))
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async (error) => {
        const browserOffline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (!browserOffline || !isLikelyOfflineFetchFailure(error)) {
          return Response.error();
        }

        const cached = await caches.match(OFFLINE_URL);
        return cached ?? Response.error();
      })
    );
  }
});
