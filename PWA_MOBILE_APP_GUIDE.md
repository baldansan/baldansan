# PWA & Mobile App Guide — Buunduu Surtsgaay

**Production URL:** https://baldansan.vercel.app

---

## What is a PWA?

A **Progressive Web App (PWA)** is a website that can be installed on your phone or computer and opens in its own window — like a native app, but still a web app.

Buunduu Surtsgaay includes:

- `manifest.webmanifest` — app name, icons, theme color
- Install prompt (Chrome/Edge where supported)
- Minimal service worker — offline navigation fallback only
- Mobile bottom navigation and touch-friendly UI

---

## Install on Android (Chrome)

1. Open https://baldansan.vercel.app in Chrome
2. Tap **Install app** when the banner appears, or
3. Menu (⋮) → **Install app** / **Add to Home screen**
4. Confirm — app icon appears on home screen

---

## Install on iPhone (Safari)

1. Open the site in **Safari** (not in-app browsers)
2. Tap **Share** (□↑)
3. Tap **Add to Home Screen**
4. Name: **Сурцгаая** → Add

Note: iOS does not support `beforeinstallprompt`; manual Add to Home Screen is required.

---

## Install on desktop (Chrome / Edge)

1. Open the production URL
2. Look for install icon in address bar (⊕ or computer icon)
3. Click **Install**

Or use **PWA Install** card on home/dashboard when prompt is available.

---

## Offline limitations

| Works offline | Does not work offline |
|---------------|------------------------|
| Static `offline.html` fallback | Supabase lesson fetch |
| Previously cached browser pages (varies) | Login / account sync |
| | Quiz/vocab save to cloud |
| | Admin routes |

**Service worker policy:**

- Caches only `/offline.html`
- Does **not** cache `/admin`, `/api`, or Supabase requests
- Navigation failures show offline page

For full offline learning, a future native app (Expo) would sync content locally.

---

## Web app vs native app

| | PWA (now) | Native (Phase 8 plan) |
|---|-----------|------------------------|
| Install | Browser install | App Store / Play Store |
| Offline | Limited | Full lesson cache possible |
| Push notifications | Limited on iOS | Full support |
| Updates | Instant deploy | Store review |

---

## Related

- [MOBILE_UX_CHECKLIST.md](./MOBILE_UX_CHECKLIST.md)
- [PRODUCT_POLISH_PHASE_7.md](./PRODUCT_POLISH_PHASE_7.md)
- [USER_ONBOARDING.md](./USER_ONBOARDING.md)
