# Mobile UX Checklist — Buunduu Surtsgaay

Use on real phone (375px width) and tablet. Production: https://baldansan.vercel.app

---

## Home

- [ ] Hero readable without horizontal scroll
- [ ] CTAs tappable (44px min height)
- [ ] Bottom nav visible; no overlap with content
- [ ] PWA install card or hint visible
- [ ] Continue learning bar appears when progress exists

## Courses

- [ ] Course cards stack on mobile
- [ ] HSK5 progress readable
- [ ] Onboarding link in help section

## Lesson detail

- [ ] Lesson path cards tappable
- [ ] Progress badges visible
- [ ] Back to course works

## Watch

- [ ] Video/placeholder not clipped
- [ ] Subtitle mode buttons fit screen
- [ ] Step bar: Watch → Vocab → Quiz
- [ ] Next: Vocabulary CTA

## Vocabulary

- [ ] Search + HSK chips scroll/wrap
- [ ] Mark as learned buttons easy to tap
- [ ] Learned count summary visible

## Quiz

- [ ] Question options full width
- [ ] Results show score + wrong answers
- [ ] Next lesson CTA when available

## Dashboard

- [ ] Stats grid 2 columns on phone
- [ ] Quick review buttons wrap
- [ ] Streak card shows current streak + daily goal
- [ ] Today progress bar updates after lesson/vocab/quiz
- [ ] Login prompt for guests

## Profile

- [ ] Learning consistency card — week dots + longest streak
- [ ] Daily goal summary readable on mobile

## Review

- [ ] HSK filter chips work
- [ ] Lesson groups collapse/expand
- [ ] Empty state CTA to HSK5

## Login / Signup

- [ ] Forms usable on small screen
- [ ] No bottom nav overlap on inputs (if shown)

## Help / Onboarding / Offline

- [ ] `/help` FAQ readable
- [ ] `/onboarding` steps scroll
- [ ] `/offline` shows retry buttons

## Admin (secondary on mobile)

- [ ] Admin routes load (desktop preferred)
- [ ] No PWA install card on admin
- [ ] Service worker not registered on `/admin`

---

## PWA install smoke test

- [ ] `manifest.webmanifest` loads (200)
- [ ] Icons load (`/icons/icon-192.svg`)
- [ ] Theme color matches emerald UI
- [ ] Install prompt or manual install works on Chrome Android

---

## Related

- [PWA_MOBILE_APP_GUIDE.md](./PWA_MOBILE_APP_GUIDE.md)
