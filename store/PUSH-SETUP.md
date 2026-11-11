# Аппын жинхэнэ мэдэгдэл (push) тохируулах — Билгүүнээд

Код бэлэн (`@capacitor/push-notifications`). Доорх тохиргоог хийж, аппыг ДАХИН build хийхэд л ажиллана.
Тохиргоо хийгээгүй үед апп хэвийн ажиллана — зүгээр л мэдэгдэл очихгүй.

## 1. Android (Firebase)
1. https://console.firebase.google.com → шинэ төсөл (жишээ: `buunduu-surtsgaay`).
2. Android апп нэмэх: package name `mn.buunduu.surtsgaay`.
3. `google-services.json` татаж `android/app/google-services.json` болгон хуулна (git-д оруулахгүй байж болно).
4. Firebase → Project settings → Service accounts → **Generate new private key** → JSON файл татна.
5. Vercel → Environment Variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = тэр JSON файлын БҮХ агуулга (нэг мөр болгож буулгана).
6. `npx cap sync android` → `./gradlew bundleRelease`.

## 2. iOS (Apple)
1. Apple Developer → Certificates, Identifiers & Profiles → Keys → **+** → «Apple Push Notifications service (APNs)» чагтлаад үүсгэнэ → `.p8` файл татна (ганц удаа татагдана!), Key ID-г тэмдэглэнэ.
2. Identifiers → `mn.buunduu.surtsgaay` → **Push Notifications** capability-г асаана.
3. Mac дээр: `npx cap sync ios` (pod install хийгдэнэ) → Xcode → App target → Signing & Capabilities → **+ Capability → Push Notifications**.
   (`App.entitlements`-д `aps-environment = production`, `AppDelegate.swift`-д token дамжуулах 2 функц аль хэдийн нэмэгдсэн.)
4. Vercel → Environment Variables:
   - `APNS_KEY_P8` = .p8 файлын бүх агуулга (`-----BEGIN PRIVATE KEY-----` … мөрүүдтэй нь)
   - `APNS_KEY_ID` = Key ID (10 тэмдэгт)
   - `APPLE_TEAM_ID` = Team ID (аль хэдийн нэмсэн бол хэвээр)
   - (TestFlight биш, Xcode-оос шууд суулгаж турших үед л) `APNS_SANDBOX` = `1`

## 3. Хоёуланд нь
- Vercel: `NEXT_PUBLIC_NATIVE_PUSH` = `1` → Redeploy. **Үүнийг google-services.json-тэй build гаргасны ДАРАА л асаана** — Firebase тохиргоогүй хуучин Android build дээр мэдэгдэл асаах товч дарвал апп унана.
- Vercel-д `SUPABASE_SERVICE_ROLE_KEY` байх ёстой (мэдэгдэл илгээхэд сурагчдын token-ийг уншина).
- Supabase SQL Editor: `supabase/migrations/092_native_push_tokens.sql`.

## 4. Турших
1. Утсан дээр аппаар нэвтэрнэ → Тохиргоо → «Сэргээх мэдэгдэл» → идэвхжүүлнэ (эсвэл нүүрний «мэдэгдэл авах» товч).
2. Supabase → Table editor → `native_push_tokens`-д мөр нэмэгдсэн эсэхийг харна.
3. Багшийн ажлын талбар → даалгаврын үр дүн → «🔔 Утсанд нь сануулга илгээх» → «N сурагчийн утсанд очлоо» гэж гарна.

## Store-ын бүртгэлд
- Play Console → Data safety: «Device or other IDs» (push token) — App functionality зорилгоор цуглуулна, хуваалцахгүй.
- App Store → App Privacy: Identifiers → Device ID — App Functionality, хэрэглэгчтэй холбогдоно, tracking биш.
