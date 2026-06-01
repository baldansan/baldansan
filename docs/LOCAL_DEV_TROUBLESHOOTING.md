# Local development troubleshooting

Buunduu Surtsgaay local dev guide for localhost, LAN testing, admin import, and offline/PWA issues.

## Start the dev server

```bash
npm.cmd install
npm.cmd run dev
```

Default dev script binds to all interfaces (`0.0.0.0`) so you can test from another device on the same Wi‑Fi:

- **Local:** http://localhost:3000
- **LAN:** http://YOUR_IP:3000 (terminal shows `Network: http://10.x.x.x:3000`)

For localhost-only binding:

```bash
npm.cmd run dev:localhost
```

## Required environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Restart the dev server after changing env vars.

## Quick health check

Open:

http://localhost:3000/debug/local-health

This page reports:

- app loaded
- current URL
- `navigator.onLine`
- service worker registered (should be **no** in development)
- Supabase env presence
- whether a `lessons` query succeeds

## Test URLs

| Purpose | URL |
|---------|-----|
| Admin dashboard | http://localhost:3000/admin |
| Chinese ZIP import | http://localhost:3000/admin/import/chinese |
| Lesson watch (admin preview) | http://localhost:3000/lessons/hsk1-l01-nihao/watch?preview=admin |
| Lesson quiz (admin preview) | http://localhost:3000/lessons/hsk1-l01-nihao/quiz?preview=admin |
| Local health | http://localhost:3000/debug/local-health |

Admin preview routes require an admin login when Supabase is configured.

## Clear Next.js cache

If routes behave oddly or show stale content:

```bash
# Windows PowerShell — stop dev server first
Remove-Item -Recurse -Force .next
npm.cmd run dev
```

## Clear browser service worker and cache

Service workers are **disabled in development** and on localhost/LAN IPs. If you previously visited production on the same origin, a stale worker may still exist.

### Chrome / Edge

1. Open DevTools (F12)
2. **Application** → **Service Workers** → **Unregister**
3. **Application** → **Storage** → **Clear site data**
4. Hard reload: Ctrl+Shift+R

### Firefox

1. DevTools → **Storage** → **Service Workers** → unregister
2. Clear site data for localhost
3. Hard reload

After clearing, visit `/debug/local-health` and confirm **service worker registered: no**.

## When you see “Интернэт холболтгүй байна”

That message is the **real offline fallback**. It should appear only when:

- `navigator.onLine === false`, and
- a navigation fetch fails (production PWA with service worker)

It should **not** appear for:

- missing Supabase env → admin/login or lesson error card with env hints
- Supabase fetch failure → specific lesson/admin error
- lesson not found → “Хичээл олдсонгүй”
- permission/RLS → “Хандах эрхгүй” or permission message
- server/runtime errors → admin error boundary or Next error UI

In **development**, lesson and admin pages show a **Dev debug** panel with route, lessonId, fetch source, error message, and env presence.

If offline fallback appears while online:

1. Clear service worker (above)
2. Open `/debug/local-health`
3. Confirm SW is not registered
4. Retry the target URL

## Admin importer without dashboard

`/admin/import/chinese` does **not** depend on dashboard metrics. If `/admin` fails to load metrics, use the error card links or go directly to:

http://localhost:3000/admin/import/chinese

## Test from another device (same Wi‑Fi)

1. Run `npm.cmd run dev` (binds `0.0.0.0`)
2. Note the **Network** URL from the terminal (e.g. `http://10.74.16.160:3000`)
3. On the other device, open that URL
4. Allow Windows Firewall inbound for Node/port 3000 if prompted
5. Use `/debug/local-health` on the device to verify connectivity

LAN hosts skip service worker registration, same as localhost.

## Production vs development

| Behavior | Development | Production |
|----------|-------------|------------|
| Service worker | Unregistered + caches cleared | Registered on public learner pages |
| Offline fallback | Next.js routes only | SW may serve `/offline.html` when truly offline |
| Debug panels | Shown on errors | Hidden |
| Admin routes | Never SW-cached | Bypassed by SW |

Production deployment on Vercel is unchanged.

## Build verification

```bash
npm.cmd run build
npm.cmd start
```

Use `npm.cmd run dev:localhost` or `npm.cmd start` for local production-mode smoke tests.
