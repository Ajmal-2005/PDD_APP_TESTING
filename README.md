# AgroVision AI — Web

Full feature-parity web port of the `AgroVisionAI` Android app
(`C:\Users\Ajmal Rahman A\AndroidStudioProjects\AgroVisionAI`).

Next.js 14 · TypeScript · Tailwind · TensorFlow.js · Firebase Auth · Dexie (IndexedDB)

Verified: `tsc --noEmit` clean, `next build` generates all 17 routes.

---

## Setup

```bash
npm install
cp .env.local.example .env.local     # then fill it in, see below
npm run dev                          # http://localhost:3000
```

### 1. Firebase

Your `google-services.json` is an **Android** client — its API key and app ID will not
work in a browser. You need to register a Web app in the same Firebase project:

Firebase Console → project `agrovisionai-a7786` → Project settings → Your apps →
Add app → **Web** → copy the `firebaseConfig` values into `.env.local`.

Two of these you already know:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agrovisionai-a7786
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=346706399054
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agrovisionai-a7786.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agrovisionai-a7786.firebasestorage.app
```

Then Authentication → Sign-in method → enable **Email/Password** and **Google**, and under
Authentication → Settings → Authorized domains add `localhost` plus your deploy domain.

The app runs without Firebase — auth is disabled and scans save locally only.

### 2. Weather

```
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

No `NEXT_PUBLIC_` prefix, deliberately. `/api/weather` proxies the call server-side so the
key never enters the browser bundle. **This key is currently hardcoded in
`WeatherRepository.kt` and ships inside your APK, where anyone can decompile it out —
rotate it and move the Android app to this proxy too.**

### 3. Model

Run `AgroVision_Model_Training.ipynb` in Colab, then copy the contents of the resulting
`tfjs_model/` folder into `public/model/`:

```
public/model/model.json
public/model/group1-shard1of*.bin
public/model/labels.json
```

Until then, the Scan screen reports that the model failed to load. Everything else works.

---

## Screen mapping

| Android | Web |
|---|---|
| `SplashScreen` | `/` |
| `LanguageSelectionScreen` | `/language` |
| `OnboardingScreen` | `/onboarding` |
| `LoginScreen` / `RegisterScreen` | `/login`, `/register` |
| `DashboardScreen` | `/dashboard` |
| `ScanScreen` | `/scan` |
| `ResultScreen` | `/result` |
| `HistoryScreen` | `/history` |
| `ScanDetailScreen` | `/history/[id]` |
| `AnalyticsDetailScreen` | `/analytics?tab=0\|1\|2` |
| `ProfileScreen` | `/profile` |
| `SettingsScreen` | `/settings` |
| `PrivacyPolicyScreen` / `TermsOfServiceScreen` | `/privacy`, `/terms` |

## Android → web equivalents

| Android | Web |
|---|---|
| Room (`ScanEntity`, `ScanDao`) | Dexie / IndexedDB (`src/lib/db.ts`) |
| DataStore (`ThemeDataStore`, `UserDataStore`) | `localStorage` via `AppProvider`, `useFarmDetails` |
| `res/values*/strings.xml` | `src/lib/i18n.ts` — 136 keys, en + ta, generated from the XML |
| `TFLiteClassifier.kt` | `src/lib/classifier.ts` (TF.js) |
| `ForecastViewModel` | `src/lib/forecast.ts` |
| `PdfReportGenerator` (iText) | `src/lib/pdf.ts` (jsPDF) |
| `ScanRepository` Firestore sync | `src/lib/sync.ts` |
| CameraX | `getUserMedia` |

Firestore path is identical (`users/{uid}/scans/{id}`), so phone and browser scans land in
the same collection. Images are excluded from the cloud copy — base64 exceeds Firestore's
1 MB document limit, so pictures stay on-device and only the diagnosis syncs.

## Deploy

```bash
npx vercel
```

Add the same environment variables in the Vercel dashboard. `OPENWEATHER_API_KEY` must
**not** be prefixed with `NEXT_PUBLIC_`.

## Two deliberate differences from the Android app

1. **No "Intelligent Healthy Prioritization."** `TFLiteClassifier.kt` lines 84–97 override
   argmax to prefer Healthy whenever it scores above 0.35 and is within 0.15 of the top
   class. That was compensating for the old model's bias toward disease classes; against a
   calibrated model it suppresses correct detections. The web port uses plain argmax.

2. **Confidence floor 0.55, not 0.40.** The retrained model uses label smoothing, which
   caps peak softmax near 0.95 and shifts confidences down. 0.40 would let too much through.

Apply both changes to the Android app when you install the new model.
