# Билгүүнээд — Бөөндөө Сурцгаая аппыг store-д оруулах дараалал

Апп нь Capacitor wrapper: утсан дээрх апп **https://surtsgaay.buunduu.mn** вэбийг нээнэ. Бүх код, icon, splash, screenshot, текст бэлэн — чи зөвхөн build хийж, store-д оруулна. Package / Bundle ID: `mn.buunduu.surtsgaay`. Хувилбар: `1.0.0 (1)`.

Хэрэглэх материал бүгд репо-гийн `store/` хавтаст: `LISTING.md` (бүх текст, Data safety хариулт), `graphics/`, `screenshots/`.

---

## 0. DNS (хамгийн түрүүнд, 5 минут)
buunduu.mn-ийн DNS (dns.mn) дээр нэмнэ:

| Type | Name | Value |
|---|---|---|
| CNAME | `surtsgaay` | `8c294680cb0534b9.vercel-dns-017.com.` |

Шалгах: https://vercel.com → baldansan → Settings → Domains → `surtsgaay.buunduu.mn` "Valid Configuration" ногоон болно. Дараа нь хөтчөөр https://surtsgaay.buunduu.mn/home нээгдэнэ.

## 1. Mac бэлтгэх (нэг удаа)
```bash
# Xcode (App Store), Android Studio, Homebrew суусан байх
brew install node cocoapods
brew install --cask temurin@17
git clone https://github.com/baldansan/baldansan.git && cd baldansan
npm install
npx cap sync
```

## 2. Android → Google Play

### 2.1 Upload keystore (нэг удаа, репо-оос ГАДНА)
```bash
mkdir -p ~/buunduu-keys && cd ~/buunduu-keys
keytool -genkey -v -keystore buunduu-upload.keystore -alias buunduu -keyalg RSA -keysize 2048 -validity 10000
```
Нууц үг + файлыг 2 газар хадгал (Балдансанд ч хуулбар өг). Git-д оруулахгүй.

Репо дотор `android/keystore.properties` үүсгэ (gitignore-д орсон):
```
storeFile=/Users/<name>/buunduu-keys/buunduu-upload.keystore
storePassword=...
keyAlias=buunduu
keyPassword=...
```

### 2.2 AAB
```bash
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab (гарын үсэгтэй)
```
(Эсвэл Android Studio: Build → Generate Signed Bundle.) Дараагийн хувилбар бүрт `android/app/build.gradle` → `versionCode` +1, `versionName` шинэчил.

### 2.3 Play Console (Буундуу Каргогийн хөгжүүлэгчийн данс)
1. **Create app** — нэр `Бөөндөө Сурцгаая`, Default language: Mongolian, App, Free.
2. **App content** (Policy → App content) бүгдийг бөглө — хариултууд `LISTING.md`-д:
   - Privacy policy: `https://surtsgaay.buunduu.mn/privacy`
   - App access: "All functionality is available without special access" — ҮГҮЙ, нэвтрэлт шаардлагатай хэсэг бий → demo данс өг (Балдансангаас авна)
   - Ads: No · Content rating: Everyone · Target audience: 13+ · News app: No · Data safety: хүснэгтээр · Government app: No · Financial features: None · Health: None
   - Account deletion URL: `https://surtsgaay.buunduu.mn/account/delete`
3. **Store listing**: `LISTING.md` текст, `graphics/icon-512.png`, `graphics/feature-graphic-1024x500.png`, `screenshots/android-1080x2400/*.png`.
4. **Testing → Internal testing → Create release** → AAB → тестер имэйл нэм → rollout. Утсан дээр суулгаж шалга.
5. **App signing SHA-256**: Setup → App integrity → App signing key certificate → SHA-256 fingerprint-ийг хуулж Балдансанд өг (Vercel env `ANDROID_SHA256_FINGERPRINTS`). Upload key-ийн SHA-256-г ч нэм (`keytool -list -v -keystore ...`).
6. Internal test OK → **Production → Create release → Send for review**.
   - Хувь хүний данс бол 12 тестер × 14 хоног closed test шаардаж магадгүй; байгууллагын данс бол шууд.

## 3. iOS → App Store

### 3.1 Xcode
```bash
npx cap open ios
```
- Target **App → Signing & Capabilities**: Team = Buunduu Cargo, "Automatically manage signing" ✓. Bundle ID `mn.buunduu.surtsgaay` (бэлэн).
- **Associated Domains** capability аль хэдийн `App/App.entitlements`-д (`applinks:surtsgaay.buunduu.mn`) — Xcode-д харагдана; Team сонгоход Apple ID-тай холбогдоно.
- `ITSAppUsesNonExemptEncryption = NO` Info.plist-д байгаа тул export compliance асуулт гарахгүй.
- Team ID-г (developer.apple.com → Membership) Балдансанд өг → Vercel env `APPLE_TEAM_ID`.

### 3.2 Archive & upload
Any iOS Device (arm64) → **Product → Archive** → Distribute App → App Store Connect → Upload.
Дараагийн upload бүрт General → Build (CURRENT_PROJECT_VERSION) +1.

### 3.3 App Store Connect
1. **My Apps → + New App**: iOS, `Бөөндөө Сурцгаая`, Primary language: English (Mongolian байхгүй) — тайлбарыг EN хувилбараар, нэмэлт MN текстийг тайлбарын доор, SKU `surtsgaay-ios`, Bundle ID `mn.buunduu.surtsgaay`.
2. **App Information**: Category Education / Reference. Content Rights: No third-party content ✗ → "contains" гэж тэмдэглэх шаардлагагүй (өөрсдийн контент).
3. **App Privacy**: `LISTING.md` хүснэгт (Email, User ID, Product Interaction, Diagnostics; Tracking = No). Privacy Policy URL `https://surtsgaay.buunduu.mn/privacy`.
4. **Age Rating**: бүгд None → 4+.
5. **Version 1.0**: screenshots `screenshots/ios-6.9-1320x2868/` (заавал) + `ios-6.5-1284x2778/`, тайлбар, keywords, support URL `https://surtsgaay.buunduu.mn/help`, marketing URL `https://surtsgaay.buunduu.mn`.
6. **App Review Information**: Sign-in required ✓ → demo данс (Балдансангаас), Notes → `LISTING.md`-ийн "App Review notes".
7. Build сонго → **TestFlight**-ээр өөрийн iPhone дээр шалга → **Add for Review → Submit**.

## 4. Хэрэв татгалзвал
- **Apple 4.2 Minimum functionality** ("зүгээр л вэбсайт"): Review notes-д офлайн татах, SRS, тоглоом, mock шалгалт, хүүхдийн PIN-ийг онцлон, 30–60 сек видео хавсаргаад Resubmit. Дахиад татгалзвал Балдансанд хэл — push мэдэгдэл + haptics нэмнэ (`@capacitor/push-notifications`, `@capacitor/haptics`).
- **Demo данс ажиллахгүй / Privacy URL нээгдэхгүй** — DNS (0-р алхам) болон demo дансыг дахин шалга.

## Балдансангаас авах зүйлс
- Demo данс (имэйл + нууц үг)
- Play Console / App Store Connect-д чамайг нэмсэн эсэх (эсвэл данс)
- Keystore нууц үгийн хуулбар — чи түүнд өг
