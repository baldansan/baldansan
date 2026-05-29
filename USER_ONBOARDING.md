# User Onboarding — Buunduu Surtsgaay

Learner journey for **Бөөндөө Сурцгаая**.

**Production URL:** https://baldansan.vercel.app

---

## Journey overview

1. **Choose course** — `/courses` → HSK5 (live)
2. **Watch lesson** — short video + subtitles
3. **Study vocabulary** — mark words as learned
4. **Take quiz** — score saved locally or to account
5. **Review** — `/review` for learned words
6. **Track progress** — `/dashboard` or `/profile` when logged in
7. **Set reminders & weekly report** — `/reminders`, `/weekly-report`

**Tip:** After signing up, open **Profile** to sync guest streak/daily activity to your account.

---

## Guest vs logged-in

| Feature | Guest | Logged-in |
|---------|-------|-----------|
| Watch / vocab / quiz | ✅ | ✅ |
| Progress storage | Device (localStorage) | Supabase + device |
| Sync local → account | — | Profile sync cards (progress + retention) |
| Streak / daily goal | Device only | Supabase sync across devices |
| Reminders / achievements | Device only | Supabase + notifications |
| Dashboard | Login prompt | Full stats |

---

## Key routes

| Route | Purpose |
|-------|---------|
| `/onboarding` | Step-by-step intro |
| `/courses` | Course catalog |
| `/courses/hsk5` | HSK5 roadmap + continue |
| `/dashboard` | Learner dashboard |
| `/help` | FAQ |
| `/feedback` | Copy-paste feedback template |
| `/study-plan` | Suggested weekly study flow |
| `/reminders` | In-app study reminders |
| `/notifications` | Notification center |
| `/weekly-report` | Weekly progress report |
| `/pricing` | Future plans (no payment yet) |

---

## Related

- [PRODUCT_POLISH_PHASE_7.md](./PRODUCT_POLISH_PHASE_7.md)
- [README.md](./README.md)
