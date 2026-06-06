# Бөөндөө Сурцгаая — Дизайн систем (аппаа гоё болгох)

Энэ багц нь аппыг мокап шиг харагдуулна: **ногоон #1FB85A, Onest фонт, цэвэр, зөөлөн.**

## Файлууд
```
app/buunduu-theme.css            ← дизайн систем (токен + классууд)
components/BottomNav.tsx         ← шинэ доод цэс (Нүүр·Давтах·Бичлэг·Тоглоом·Профайл, SVG дүрстэй)
```

## 1. Фонт нэмэх (заавал)
`app/layout.tsx`-ийн `<head>`-д:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet" />
```

## 2. Дизайн системээ импортлох (нэг л удаа)
`app/layout.tsx` (эсвэл global CSS)-д:
```ts
import "./buunduu-theme.css";
```

## 3. Хамгийн чухал — улбар шар → ногоон
Чиний апп одоо **улбар шар** өнгөтэй. Үүнийг ногоон болгох нь хамгийн том өөрчлөлт.
Энэ нь чиний апп өнгөө хаанаас авдгаас хамаарна (Tailwind тохиргоо эсвэл шууд бичсэн).
Доорх Cursor промпт үүнийг олж сольж өгнө.

---

## Cursor-т өгөх промпт (бүтнээр нь хуул)

```
Apply a new design system to my Next.js 16 + Tailwind 4 app to match my green brand
look. I added two files: app/buunduu-theme.css and components/BottomNav.tsx.

Do these steps and show me a PLAN first; wait for my "go" before editing:

1. FONTS: in app/layout.tsx <head>, add the Google Fonts links for "Onest" and
   "Noto Sans SC" (if not already there). Set the app's base font-family to Onest.

2. IMPORT THEME: import "./buunduu-theme.css" once in app/layout.tsx.

3. ACCENT COLOR SWAP (most important): my app currently uses an ORANGE accent.
   Find where that orange comes from and replace it with green #1FB85A:
   - If there is a Tailwind theme color / CSS variable for the brand/primary/accent,
     change its value to #1FB85A (and a darker shade #149247 for hover/active).
   - If orange is used via hardcoded Tailwind classes (e.g. bg-orange-500, text-orange-600,
     from-orange-*, border-orange-*) or hex like #f97316 / #ea580c, find ALL of them and
     replace with the green equivalents (bg-[#1FB85A], text-[#149247], etc.) or a shared
     token. List every file you changed.
   First SHOW me everywhere orange is used, then propose the replacement.

4. BASE LOOK: ensure the page background uses the theme (soft off-white) and cards use
   rounded corners + soft shadows. Don't fight the theme css; prefer the .bs-* classes
   or the CSS variables (--bs-green, --bs-card, --bs-line, --bs-shadow) where helpful.

5. BOTTOM NAV: replace the current bottom navigation with <BottomNav active="home" /> from
   components/BottomNav.tsx (set the correct `active` per page: home/review/clips/games/profile).
   Note the tabs changed: "Үсэг" is removed; "Бичлэг" (short videos) is added.
   Move the old "Үсэг" (character practice) entry point into the Давтах (review) section.

Keep all existing functionality, routes, and data untouched — this is a visual restyle only.
Work one step at a time and tell me how to check each step in the browser.
```

## Юу болох вэ
- Бүх апп **ногоон + Onest + цэвэр** болно (улбар шар алга).
- Доод цэс шинэ бүтэц + гоё SVG дүрстэй болно.
- Бүтэц, өгөгдөл, ажиллагаа **хэвээр** — зөвхөн харагдах байдал.

## Шударга тэмдэглэл
- Энэ нь "нэг товч дараад бүх апп төгс мокап болно" гэсэн шидэт засвар биш.
  Өнгө сольсноор 80% нь шууд гоё болно; үлдсэн нарийн зай/байрлалыг хэсэг хэсгээр
  тохируулна. Аль дэлгэц яаж харагдаж байгааг надад үзүүлбэл, тэр бүрийг нь
  bs- классаар нарийвчилж гоё болгоё.
- Хэрэв Cursor "хаана улбар шар байна" гэдгийг олоход хүндрэвэл, надад тэр хариуг
  үзүүлээрэй — би яг аль классыг юу болгохыг хэлж өгье.
