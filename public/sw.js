/**
 * Service worker — offline study support.
 * - Navigations: network-first, successful pages cached → work offline after first visit.
 * - Static assets (/_next/static, icons, covers, temee): cache-first.
 * - Supabase Storage PUBLIC objects (lesson audio/covers): cache-first.
 * Never caches Supabase REST/auth, /api, /admin.
 *
 * ДУУ, БИЧЛЭГИЙН ТУХАЙ (v4-т зассан):
 * <audio> нь файлын дунд рүү үсрэхдээ Range хүсэлт илгээдэг. Service worker
 * түүнийг таслан авч, кэшэнд хадгалсан opaque (type: "opaque", status: 0)
 * хариуг буцаавал хөтөч уг эх сурвалжийг ашиглаж чадахгүй —
 * MEDIA_ERR_SRC_NOT_SUPPORTED алдаа өгч, тоглуулагч зогсоно. Тиймээс:
 *   • Range хүсэлтийг service worker ОГТ хөндөхгүй (хөтөчид шууд үлдээнэ);
 *   • opaque хариуг кэшлэхгүй — уншиж болдоггүй, хэмжээ нь ч том;
 *   • 8МБ-аас том файлыг кэшлэхгүй (шалгалтын 35 минутын бичлэг).
 * Хичээлийн богино клипүүд урьдын адил кэшлэгдэж, офлайн ажиллана —
 * offline-lesson-prefetch нь тэднийг cors горимоор татдаг тул уншигдах
 * (opaque биш) хариу болж кэшэнд ордог.
 *
 * ОФФЛАЙН АУДИО (v6): lesson-media / hsk-audio storage-ийн mp3 файлууд тусдаа
 * buunduu-audio кэшэнд cache-first, нийт ~150МБ хязгаартай LRU (хамгийн удаан
 * ашиглагдаагүй нь устна). Индекс нь (url → size, сүүлд хэрэглэсэн цаг)
 * мөн кэшэнд /__bs-audio-index__ гэсэн synthetic хариунд хадгалагдана.
 * «Хичээл татах» товч /api/lessons/{id}/offline-manifest-оос жагсаалт аваад
 * файл бүрийг fetch хийхэд энэ SW тэднийг кэшэнд хийнэ.
 */
const VERSION = "v6";
const OFFLINE_CACHE = `buunduu-surtsgaay-offline-${VERSION}`;
const PAGES_CACHE = `buunduu-pages-${VERSION}`;
const STATIC_CACHE = `buunduu-static-${VERSION}`;
const MEDIA_CACHE = `buunduu-media-${VERSION}`;
const AUDIO_CACHE = `buunduu-audio-${VERSION}`;
const KEEP = new Set([OFFLINE_CACHE, PAGES_CACHE, STATIC_CACHE, MEDIA_CACHE, AUDIO_CACHE]);
const OFFLINE_URL = "/offline.html";
const PAGES_MAX_ENTRIES = 120;
const MEDIA_MAX_ENTRIES = 3000;
/** Аудио кэшийн дээд хэмжээ (байт) — ~150МБ, LRU. */
const AUDIO_MAX_BYTES = 150 * 1024 * 1024;
/** Нэг аудио файлын дээд хэмжээ — үүнээс том бол кэшлэхгүй (шалгалтын 35 минутын бичлэг). */
const AUDIO_MAX_FILE_BYTES = 20 * 1024 * 1024;
const AUDIO_INDEX_URL = "/__bs-audio-index__";
/** Индексийн «сүүлд хэрэглэсэн» цагийг хэт ойр ойрхон бичихгүй. */
const AUDIO_TOUCH_INTERVAL_MS = 60 * 1000;

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
                key.startsWith("buunduu-media-") ||
                key.startsWith("buunduu-audio-")) &&
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

/** Public storage дээрх аудио файл (хичээлийн mp3) — тусдаа LRU кэш. */
function isStorageAudioUrl(url) {
  return isPublicStorageUrl(url) && /\.(mp3|m4a|aac|ogg|wav|opus)$/i.test(url.pathname);
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

/**
 * Кэшлэж болох хариу мөн үү.
 *
 * opaque хариуг (өөр домэйнээс no-cors горимоор ирсэн) БИТГИЙ кэшил:
 * доторх агуулгыг нь уншиж чадахгүй, Range хүсэлтэд тохирохгүй, бас
 * квотаас хэдэн МБ-аар иддэг. 206 (хэсэгчилсэн) хариуг Cache API өөрөө
 * хүлээж авдаггүй.
 */
/** Кэшэнд хийхийг зөвшөөрөх хамгийн том файл (8МБ). */
const MAX_CACHEABLE_BYTES = 8 * 1024 * 1024;

function cacheableCopy(response, maxBytes = MAX_CACHEABLE_BYTES) {
  if (!response) return null;
  if (response.type === "opaque") return null;
  if (response.status === 206) return null;
  if (!response.ok) return null;
  // Шалгалтын бүтэн бичлэг 30–40МБ — офлайн хэрэгцээнд биш, квотыг иднэ.
  const length = Number(response.headers.get("content-length") || 0);
  if (length > maxBytes) return null;
  return response.clone();
}

/** Cache-first with background-less network fallback. */
async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  const copy = cacheableCopy(response);
  if (copy) {
    // Cache.put зарим хариуг (206, opaqueredirect) хүлээж авалгүй алдаа
    // шиднэ — тэр нь хариуг өөрийг нь унагаах ёсгүй.
    cache
      .put(request, copy)
      .then(() => trimCache(cacheName, maxEntries))
      .catch(() => {});
  }
  return response;
}

/* ------------------------------------------------------------------ */
/* Аудио кэш — cache-first + LRU (~150МБ)                               */
/* ------------------------------------------------------------------ */

let audioIndexPromise = null;
let audioIndexWriteChain = Promise.resolve();

async function readAudioIndex(cache) {
  try {
    const res = await cache.match(AUDIO_INDEX_URL);
    if (!res) return {};
    const data = await res.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function getAudioIndex(cache) {
  if (!audioIndexPromise) audioIndexPromise = readAudioIndex(cache);
  return audioIndexPromise;
}

function writeAudioIndex(cache, index) {
  audioIndexPromise = Promise.resolve(index);
  audioIndexWriteChain = audioIndexWriteChain
    .then(() =>
      cache.put(
        AUDIO_INDEX_URL,
        new Response(JSON.stringify(index), {
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    .catch(() => {});
  return audioIndexWriteChain;
}

async function responseByteLength(response) {
  const header = Number(response.headers.get("content-length") || 0);
  if (header > 0) return header;
  try {
    const buf = await response.clone().arrayBuffer();
    return buf.byteLength;
  } catch {
    return 0;
  }
}

/** Нийт хэмжээ хязгаараас хэтэрвэл хамгийн удаан ашиглагдаагүйг устгана. */
async function evictAudioIfNeeded(cache, index) {
  let total = 0;
  for (const key of Object.keys(index)) total += index[key].size || 0;
  if (total <= AUDIO_MAX_BYTES) return index;
  const entries = Object.entries(index).sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  for (const [url, meta] of entries) {
    if (total <= AUDIO_MAX_BYTES) break;
    try {
      await cache.delete(url);
    } catch {
      // ignore
    }
    delete index[url];
    total -= meta.size || 0;
  }
  return index;
}

async function putAudioInCache(cache, request, response) {
  const size = await responseByteLength(response);
  if (size > AUDIO_MAX_FILE_BYTES) return;
  await cache.put(request, response);
  const index = await getAudioIndex(cache);
  index[request.url] = { size, at: Date.now() };
  await evictAudioIfNeeded(cache, index);
  await writeAudioIndex(cache, index);
}

async function touchAudioIndex(cache, url) {
  const index = await getAudioIndex(cache);
  const entry = index[url];
  const now = Date.now();
  if (entry && now - (entry.at || 0) < AUDIO_TOUCH_INTERVAL_MS) return;
  index[url] = { size: entry ? entry.size : 0, at: now };
  await writeAudioIndex(cache, index);
}

/** Storage-ийн аудиог cors горимоор татна — уншигдах (opaque биш) хариу → кэшлэж болно. */
function corsAudioRequest(url) {
  return new Request(url, { mode: "cors", credentials: "omit" });
}

const audioInflight = new Map();

/** Бүтэн файлыг ард нь татаж кэшэнд хийнэ (Range хүсэлттэй анхны тоглуулалтад). */
function prefetchAudioFull(url) {
  if (audioInflight.has(url)) return audioInflight.get(url);
  const task = (async () => {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      if (await cache.match(url, { ignoreVary: true })) return;
      const response = await fetch(corsAudioRequest(url));
      const copy = cacheableCopy(response, AUDIO_MAX_FILE_BYTES);
      if (copy) await putAudioInCache(cache, corsAudioRequest(url), copy);
    } catch {
      // сүлжээгүй — дараагийн удаа
    } finally {
      audioInflight.delete(url);
    }
  })();
  audioInflight.set(url, task);
  return task;
}

/** Кэшэнд байгаа бүтэн файлаас Range (206) хариу угсарна — <audio> дунд нь үсрэхэд. */
async function rangeFromCached(cached, rangeHeader) {
  const buf = await cached.arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader || "");
  let start = 0;
  let end = total - 1;
  if (m) {
    if (m[1] === "" && m[2] !== "") {
      start = Math.max(0, total - Number(m[2]));
    } else {
      start = m[1] === "" ? 0 : Number(m[1]);
      end = m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
    }
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }
  const slice = buf.slice(start, end + 1);
  const headers = new Headers(cached.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(slice.byteLength));
  headers.set("Accept-Ranges", "bytes");
  return new Response(slice, { status: 206, statusText: "Partial Content", headers });
}

async function audioCacheFirst(event) {
  const request = event.request;
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request.url, { ignoreVary: true });
  const rangeHeader = request.headers.get("range");

  if (cached) {
    touchAudioIndex(cache, request.url).catch(() => {});
    if (rangeHeader) return rangeFromCached(cached, rangeHeader);
    return cached;
  }

  if (rangeHeader) {
    // Кэшэнд алга: Range хүсэлтийг хөтөчид (сүлжээнд) шууд өгнө, бүтнийг нь ард нь татаж кэшилнэ.
    event.waitUntil(prefetchAudioFull(request.url));
    return fetch(request);
  }

  const response = await fetch(corsAudioRequest(request.url));
  const copy = cacheableCopy(response, AUDIO_MAX_FILE_BYTES);
  if (copy) {
    putAudioInCache(cache, corsAudioRequest(request.url), copy).catch(() => {});
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

/**
 * Клиентээс: { type: "bs:audio-cache-stats" } → { type, bytes, files, maxBytes }
 * «Хичээл татах» товч татсаны дараа хэмжээг харуулахад.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "bs:audio-cache-stats") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(AUDIO_CACHE);
        const index = await getAudioIndex(cache);
        let bytes = 0;
        let files = 0;
        for (const key of Object.keys(index)) {
          bytes += index[key].size || 0;
          files += 1;
        }
        const reply = { type: "bs:audio-cache-stats", bytes, files, maxBytes: AUDIO_MAX_BYTES };
        if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
        else if (event.source) event.source.postMessage(reply);
      })()
    );
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (shouldBypass(url)) return;

  // Storage-ийн аудио: Range хүсэлтийг ч кэшнээс (206 зүсэж) өгнө — оффлайн тоглоно.
  if (isStorageAudioUrl(url)) {
    event.respondWith(audioCacheFirst(event));
    return;
  }

  // Бусад Range хүсэлт (видео г.м) — хөтөч өөрөө шийднэ. Service worker
  // оролцвол кэшнээс бүтэн/opaque хариу буцааж, тоглуулагчийг эвдэнэ.
  if (event.request.headers.has("range")) return;


  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isPublicStorageUrl(url)) {
    event.respondWith(cacheFirst(event.request, MEDIA_CACHE, MEDIA_MAX_ENTRIES));
    return;
  }

  // Ханзны зурлагын JSON (jsdelivr, hanzi-writer-data) — хэзээ ч өөрчлөгдөхгүй → cache-first.
  if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("/hanzi-writer-data@")) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE, 1500));
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
