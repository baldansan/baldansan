/**
 * Minimal service worker — offline navigation fallback only.
 * Does NOT cache Supabase API, admin routes, or authenticated responses.
 */
const CACHE_NAME = "buunduu-surtsgaay-offline-v2";
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

function shouldBypass(url) {
  if (url.pathname.startsWith("/admin")) return true;
  if (url.pathname.startsWith("/debug")) return true;
  if (url.pathname.startsWith("/api")) return true;
  if (url.hostname.includes("supabase")) return true;
  if (url.pathname.includes("_next/webpack-hmr")) return true;
  if (isPrivateNetworkHost(url.hostname)) return true;
  return false;
}

function isLikelyOfflineFetchFailure(error) {
  return (
    error instanceof TypeError ||
    (error && typeof error.message === "string" && /failed to fetch|network/i.test(error.message))
  );
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
      <p>Энэ нь офлайн fallback биш. Сервер эсвэл сүлжээний алдааг шалгана уу.</p>
      <button type="button" class="primary" onclick="location.reload()">Try again</button>
      <a href="/" class="secondary">Home</a>
    </div>
  </body>
</html>`;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async (error) => {
        const browserOffline =
          typeof navigator !== "undefined" && navigator.onLine === false;

        if (browserOffline && isLikelyOfflineFetchFailure(error)) {
          const cached = await caches.match(OFFLINE_URL);
          if (cached) return cached;
        }

        return new Response(buildNavigationErrorPage(error?.message), {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })
    );
  }
});
