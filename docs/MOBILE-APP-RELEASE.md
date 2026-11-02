# Бөөндөө Сурцгаая — Google Play ба App Store-д гаргах гарын авлага

Апп нь Capacitor wrapper: утсан дээрх апп нь **https://surtsgaay.buunduu.mn** вэбийг нээнэ (вэбээ шинэчлэхэд дахин store-д оруулах шаардлагагүй). Package / Bundle ID: `mn.buunduu.surtsgaay`.

Энэ гарын авлагыг дээрээс доош нь дарааллаар нь хий.

---

## А. Домэйн, Vercel, Supabase

1. **Vercel → Project (baldansan) → Settings → Domains → Add** дарж `surtsgaay.buunduu.mn` гэж бичээд Add.
2. Vercel үзүүлсэн бичлэгийг домэйн удирддаг газартаа (buunduu.mn-ийн DNS) нэмнэ:
   - Type: `CNAME`, Name/Host: `surtsgaay`, Value: `cname.vercel-dns.com` (Vercel өөр утга үзүүлбэл түүнийг ав).
3. Vercel дээр "Valid Configuration" ногоон болтол хүлээнэ (5–30 минут).
4. **Vercel → Settings → Environment Variables** хэсэгт нэмнэ (Production):
   - `NEXT_PUBLIC_SITE_URL` = `https://surtsgaay.buunduu.mn`
   - `ANDROID_SHA256_FINGERPRINTS` = (Г хэсгээс авсны дараа)
   - `APPLE_TEAM_ID` = (Д хэсгээс авсны дараа)
5. **Deployments → сүүлийн deploy → ⋯ → Redeploy**.
6. **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://surtsgaay.buunduu.mn`
   - Redirect URLs-д нэм: `https://surtsgaay.buunduu.mn/**` (хуучин `https://baldansan.vercel.app/**`-ийг түр үлдээж болно).
7. Шалгах: хөтөч дээр дараах хоёр хаяг нээгдэж JSON харагдах ёстой:
   - `https://surtsgaay.buunduu.mn/.well-known/assetlinks.json`
   - `https://surtsgaay.buunduu.mn/.well-known/apple-app-site-association`

---

## Б. Mac бэлтгэх

1. App Store-оос **Xcode** суулгаад нэг удаа нээж нөхцөлийг зөвшөөр. Терминалд: `xcode-select --install`
2. **Android Studio** суулгана: https://developer.android.com/studio (анх нээхэд "Standard" тохиргоо, SDK-г автоматаар татна).
3. **Java 17**: `brew install --cask temurin@17` (Homebrew байхгүй бол https://brew.sh).
4. **Node.js 20+**: `brew install node`
5. **CocoaPods**: `brew install cocoapods`
6. Төслийг татаж, хавтас руу ор, дараа нь:
   ```bash
   npm install
   npx cap sync
   ```
   (`npx cap sync` нь android/ ба ios/ хавтсыг шинэчилнэ. iOS дээр CocoaPods суулгана — Linux дээр хийгдээгүй тул Mac дээр заавал ажиллуул.)
7. Хэрэв `ios/App/Pods` гарахгүй бол: `cd ios/App && pod install && cd ../..`

Хэрэгтэй команд: `npm run cap:android` (Android Studio нээнэ), `npm run cap:ios` (Xcode нээнэ), `npm run cap:sync`.

---

## В. Үйлчилгээний данс

- Google Play Console: https://play.google.com/console — нэг удаагийн **$25**. Хувь хүн данс бол production-д гарахаас өмнө **12 тестер 14 хоног** тасралтгүй тест хийлгэх шаардлагатай байж болно (Google-ийн одоогийн дүрэм) — эрт эхлүүл.
- Apple Developer Program: https://developer.apple.com/programs/ — жилд **$99**. Батлагдахад 1–2 өдөр орно.

---

## Г. Android

### Г1. Upload keystore үүсгэх (НЭГ УДАА)
Терминалд (repo-оос ГАДНА, жишээ нь Documents-д):
```bash
mkdir -p ~/buunduu-keys && cd ~/buunduu-keys
keytool -genkey -v -keystore buunduu-upload.keystore -alias buunduu -keyalg RSA -keysize 2048 -validity 10000
```
Нууц үг, нэр, байгууллага (Buunduu Cargo), хот (Ulaanbaatar), улс (MN) асууна.
**Файл болон нууц үгийг 2 газар (флаш + нууц үгийн менежер) хадгал. Алдвал шинэчлэх нь маш төвөгтэй. Git-д ХЭЗЭЭ Ч оруулахгүй.**

### Г2. AAB бүтээх (Android Studio)
1. `npm run cap:android` — Android Studio нээгдэж Gradle sync дуустал хүлээ.
2. Цэс: **Build → Generate Signed Bundle / APK… → Android App Bundle → Next**.
3. Key store path: `~/buunduu-keys/buunduu-upload.keystore`, нууц үг, alias `buunduu` → Next.
4. Build variant: **release** → Create. Файл: `android/app/release/app-release.aab`.
5. Хувилбар өөрчлөхдөө `android/app/build.gradle` дахь `versionCode`-ыг (1, 2, 3…) **заавал нэмж**, `versionName`-ыг өөрчилнө. Store бүр шинэ байршуулалт дээр өмнөхөөсөө том versionCode шаардана.

### Г3. Play Console
1. **Create app**: нэр `Бөөндөө Сурцгаая`, хэл Mongolian, App, Free, зөвшөөрлүүдийг тэмдэглэ.
2. **Setup → App content** хэсгийг бүгдийг бөглө:
   - **Privacy policy URL**: `https://surtsgaay.buunduu.mn/privacy`
   - **Account deletion URL**: `https://surtsgaay.buunduu.mn/account/delete`
   - **Ads**: No ads.
   - **App access**: нэвтрэлт шаардлагатай хэсэг байвал тест имэйл + нууц үг өг (reviewer-д зориулсан).
   - **Content rating**: Questionnaire → категори Education/Reference; хүчирхийлэл, мөрийтэй тоглоом г.м бүгдэд "No" → Ойролцоогоор "Everyone/3+".
   - **Target audience**: 13+ (хүүхэд зорилтот биш гэвэл Families policy шаардлага үүсэхгүй; хүүхдийн хичээл (YCT) байгаа тул 13-аас доош зорилтот гэж сонговол Families шаардлага нэмэгдэнэ — энэ шийдвэрийг ухамсартай гарга).
   - **Data safety** (доорх хүснэгтээр):

| Асуулт | Хариулт |
|---|---|
| Өгөгдөл цуглуулдаг уу | Тийм |
| Дамжуулалт шифрлэгдсэн үү | Тийм (HTTPS) |
| Устгах хүсэлт гаргах боломж | Тийм (апп дотор + URL) |
| Personal info → Email address | Цуглуулна; үйлчилгээ ажиллуулах, бүртгэл (Account management); хуваалцахгүй |
| Personal info → User IDs | Цуглуулна (Supabase user id); бүртгэл |
| App activity → App interactions | Цуглуулна (хичээлийн ахиц, оноо); App functionality |
| App info and performance → Crash logs/Diagnostics | Цуглуулж магадгүй (техникийн лог); Analytics/App functionality |
| Device or other IDs | Push токен идэвхжүүлсэн бол: Тийм (мэдэгдэл) |
| Байршил, контакт, зураг, аудио, төлбөр, эрүүл мэнд | Үгүй |
| Гуравдагч талд зарах/ хуваалцах | Үгүй (Supabase/Vercel нь service provider, "хуваалцахгүй"-д тооцогдоно) |

3. **Store listing** (Е хэсэгт текст бэлэн): App name, Short description, Full description, App icon 512×512 (`assets/icon.png`-ийг 512 болгож), Feature graphic 1024×500, утасны дэлгэцийн зураг (хамгийн багадаа 2, зөвлөмж 6).
4. **Testing → Internal testing → Create release** → AAB upload → тестерийн имэйлүүдийг нэм → Save → Review → Start rollout.
5. **App signing SHA-256 авах**: Play Console → **Setup → App signing (App integrity)** → "App signing key certificate" → **SHA-256 certificate fingerprint**-ыг хуул (`AA:BB:…`). Upload key-ийнхыг ч таслалаар нэмж болно.
6. Vercel → Env → `ANDROID_SHA256_FINGERPRINTS` = `AA:BB:…` (олон бол таслалаар) → **Redeploy**. Дараа нь `https://surtsgaay.buunduu.mn/.well-known/assetlinks.json` дотор хурууны хээ харагдах ёстой.
7. Internal testing-д утсан дээрээ ажиллахыг шалгасны дараа **Production → Create release → AAB (эсвэл internal-аас promote) → Send for review** (1–7 хоног).

---

## Д. iOS

1. https://developer.apple.com дээр Program-д бүртгүүл (Б хэсгийн дараа).
2. `npm run cap:ios` — Xcode нээгдэнэ. Зүүн талд **App** төсөл → **Signing & Capabilities**:
   - Team: өөрийн Apple Developer team сонго, "Automatically manage signing" асаа.
   - Bundle Identifier: `mn.buunduu.surtsgaay`.
   - **+ Capability → Associated Domains** → `applinks:surtsgaay.buunduu.mn` нэм. (Энэ нь `App.entitlements` файл үүсгэнэ.)
3. **Team ID** авах: developer.apple.com → Account → **Membership details → Team ID** (10 тэмдэгт). Vercel → Env → `APPLE_TEAM_ID` → Redeploy. Шалгах: `…/.well-known/apple-app-site-association` дотор `<TEAMID>.mn.buunduu.surtsgaay`.
4. General таб: Display Name `Бөөндөө Сурцгаая`, Version `1.0.0`, Build `1` (дахин upload бүрт Build-ийг нэм). Deployment target iOS 15+ байх.
5. Төхөөрөмжөө "Any iOS Device (arm64)" болго → **Product → Archive** → Organizer нээгдэнэ → **Distribute App → App Store Connect → Upload**.
6. https://appstoreconnect.apple.com → **My Apps → + → New App**: Platform iOS, Name `Бөөндөө Сурцгаая`, Primary language Mongolian (байхгүй бол English), Bundle ID `mn.buunduu.surtsgaay`, SKU `surtsgaay-ios`.
7. **App Privacy**: Data Types — Email Address, User ID, Product Interaction (learning progress), Diagnostics → бүгд "Linked to user", зорилго "App Functionality"; "Used for Tracking" = **No**. Privacy Policy URL: `https://surtsgaay.buunduu.mn/privacy`.
8. **TestFlight** хэсэгт build гарч ирэхэд (10–30 мин) Internal testers нэмж өөрийн iPhone дээр шалга.
9. **App Store → version 1.0 → Build** сонго, дэлгэцийн зураг, тайлбар, ангилал Education, насны ангилал оруул → **Add for Review → Submit**.

### App Review notes (App Review Information хэсэгт буулга)
```
Бөөндөө Сурцгаая is a complete language-learning app (Mongolian speakers learning Chinese HSK and Korean), not a simple website wrapper.
Native-app features: structured HSK 1-6 courses with video lessons and quizzes, pronunciation checking with audio playback, spaced-repetition review, learning progress / streaks / points that sync across devices, downloadable offline lessons, daily study reminders, practice games and mock tests.
Demo account for review: email: <REVIEW_EMAIL>  password: <REVIEW_PASSWORD>
Account deletion: Settings -> "Бүртгэл устгах" (in-app).
Support: support@buunduu.mn
```
(Demo данс нэг удаа Supabase-д үүсгэж, нууц үгийг энд өг.)

---

## Е. Store listing

**Нэр**: Бөөндөө Сурцгаая (Play: хамгийн ихдээ 30 тэмдэгт)
**Богино тайлбар (≤80)**: Хятад, Солонгос хэлийг монголоор — богино хичээл, үг, шалгалт, өдөр бүр.
**Ангилал**: Education. **Насны ангилал**: 4+ / Everyone.
**Холбоо барих**: support@buunduu.mn · **Вэб**: https://surtsgaay.buunduu.mn

**Бүрэн тайлбар (MN)**
```
Бөөндөө Сурцгаая — Хятад хэл (HSK 1–6), Солонгос хэлийг монгол хэлээр, өдөр бүр бага багаар сурах апп.

• HSK хичээл: богино хичээл, шинэ үг, ханз, дүрэм, дасгал
• Дуудлага: сонсох, дуудлагаа шалгах, пиньинь
• Давталт: ухаалаг давтлын хуваарь — сурсан үгээ мартахгүй
• Тоглоом, mock шалгалт: HSK-ийн хэлбэрээр бэлдэнэ
• Ахиц, streak, оноо: өдөр бүрийн зорилго, дэвшил харагдана
• Офлайн: хичээлээ татаж аваад интернэтгүй үед сурна
• Хүүхдийн YCT хичээл
• Бүх тайлбар ойлгомжтой монголоор

Буундуу Карго баг бэлтгэсэн. Асуулт: support@buunduu.mn
```

**Full description (EN)**
```
Buunduu Surtsgaay helps Mongolian speakers learn Chinese (HSK 1-6) and Korean a little every day, with explanations in clear Mongolian.

• HSK lessons: short lessons, vocabulary, characters, grammar and exercises
• Pronunciation: listen, practise and check your pronunciation, pinyin support
• Spaced repetition: smart review keeps learned words fresh
• Games and mock tests in HSK format
• Progress, streaks and points to stay motivated
• Offline lessons: download and study without internet
• YCT lessons for kids

Made by the Buunduu Cargo team. Support: support@buunduu.mn
```

**Түлхүүр үгс (App Store, ≤100 тэмдэгт)**: `хятад хэл,HSK,солонгос хэл,монгол,хэл сурах,ханз,pinyin,Chinese,Mongolian,YCT,TOPIK`
**Play tags**: Education, Language learning.

**Дэлгэцийн зураг — 6 дэлгэц авах**
1. Нүүр (өнөөдрийн зорилго, streak)
2. Хичээлийн жагсаалт / HSK түвшин
3. Хичээл (видео + subtitle + үг)
4. Дасгал / quiz
5. Давталт (SRS review) ба үгсийн сан
6. Ахиц / оноо / rank

Хэмжээ:
- Android утас: 1080×1920 эсвэл 1080×2400 PNG/JPG (min 2, max 8). Feature graphic 1024×500. Icon 512×512.
- iPhone 6.9" (заавал): 1320×2868 · iPhone 6.5": 1284×2778 эсвэл 1242×2688 · (iPad дэмжвэл 13": 2064×2752).
- Зөвлөгөө: Android Studio Emulator / Xcode Simulator-аас авна; нэвтэрсэн, жинхэнэ хичээлтэй төлөвөөс.

**Бэлтгэх жагсаалт**
- [ ] Домэйн ажиллаж, HTTPS ногоон
- [ ] Vercel env: NEXT_PUBLIC_SITE_URL, ANDROID_SHA256_FINGERPRINTS, APPLE_TEAM_ID
- [ ] Supabase Site URL / Redirect URLs шинэчилсэн
- [ ] `support@buunduu.mn` имэйл хайрцаг жинхэнэ ажиллаж байгаа (буцаах хаяг)
- [ ] Google Play ($25) ба Apple Developer ($99) данс
- [ ] Keystore + нууц үг 2 газар хадгалсан
- [ ] 6+ дэлгэцийн зураг (2 платформ), Feature graphic 1024×500, Icon 512
- [ ] Review-д зориулсан demo имэйл/нууц үг
- [ ] Privacy URL, Account deletion URL, Terms URL ажиллаж байгаа
- [ ] Тестерүүд (Android 12 хүн × 14 хоног, шаардлагатай бол)

---

## Ж. Хэрэв Apple/Google татгалзвал

**Apple 4.2 (Minimum Functionality — "зүгээр л вэб")**: Нэмэлт native боломж оруулаад дахин илгээ:
1. **Push мэдэгдэл** — `npm i @capacitor/push-notifications`, Xcode-д Push Notifications capability, Firebase (Android) / APNs (iOS) тохируулна. Өдрийн давтлын сануулга.
2. **Haptics** — `npm i @capacitor/haptics`; зөв/буруу хариулт, амжилтад жижиг чичиргээ.
3. **Офлайн хичээл** — аль хэдийн байгаа (татаж авах); Review notes-д онцол.
4. Бусад: `@capacitor/share` (ахиц хуваалцах), `@capacitor/local-notifications`, `@capacitor/app` badge, биометр нэвтрэлт.
5. Review notes-д: дээрх native боломжууд, demo данс, видео бичлэг (30–60 сек) хавсарга.

**Google "Minimum functionality / Repetitive content"**: Store listing-д офлайн, мэдэгдэл, хичээлийн агуулгыг тодорхой бич; privacy/data-safety-г бодит хэрэглээтэй яг таарсан эсэхийг дахин шалга.

**Нийтлэг татгалзал**: Demo данс ажиллахгүй, Privacy URL нээгдэхгүй, Data safety таарахгүй, дэлгэцийн зураг хуурамч — эдгээрийг эхлээд шалга.
