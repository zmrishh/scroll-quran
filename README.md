# Scroll Quran

A short-form, vertical-scroll feed of Quran ayat, Quranic duas, Names of Allah, dhikr and quick quizzes, plus the complete Quran (114 surahs, Arabic and English) to read offline. Built with Expo (SDK 58) and Expo Router. No backend, no AI: everything runs on the phone.

- `docs/visual-elements.md` describes the Night design and the reading aids on the cards.
- `docs/store-listing.md` has the App Store and Google Play name, subtitle and keywords.

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. In this folder:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code with the iPhone camera. Keep the phone and PC on the same Wi-Fi, or use `npx expo start --tunnel`.

Home-screen widgets, Screen Time and real in-app purchases need a development build (`npx eas-cli@latest build --profile development`), not Expo Go.

## Project layout

| Path | What it is |
|---|---|
| `src/app/` | Screens (Expo Router): feed, Quran (surah list), saved, you, surah reader, onboarding, paywall, card viewer, about |
| `src/components/` | Card frame, the card types, reading pieces (`reading.tsx`), header with topic picker, tab bar |
| `src/feed/` | Feed generator (card rhythm, topic weighting) and the free daily limit |
| `src/store/app-store.ts` | Persisted state: likes, saves, streak, settings, plan |
| `src/data/` | `quran.json` (feed content) and `quran-full.json` (all 6,236 ayat, loaded when the reader first opens), both generated, plus Names of Allah and dhikr |
| `scripts/build-content.mjs` | Builds both JSON files from the Tanzil files: passages, duas, key lines, speakers, surah facts, the full text |
| `scripts/more-content.mjs` | The second batch of feed passages and duas, with their key lines |

## Content

- To add or remove passages and duas, edit the lists in `scripts/build-content.mjs` or `scripts/more-content.mjs`, then run `npm run build:content`. A passage longer than about two lines needs a hand-picked key line, and the build fails if it isn't word for word in the translation.
- Arabic: [Tanzil](https://tanzil.net) Quran Text (Uthmani 1.1), CC BY 3.0, used verbatim with attribution.
- English: M. M. Pickthall (1930), public domain.
- Every Name of Allah reference was checked against the Arabic text.

## Before launch

Things only you can do, roughly in order:

1. **App icon and splash.** `assets/images/icon.png`, `assets/expo.icon` (iOS) and `assets/images/splash-icon.png` are still Expo's placeholders. Use a 1024×1024 icon with no transparency.
2. **Privacy policy page.** Host one (it can be short: the app collects no data; everything stays on the phone) and put its address in `LINKS.privacy` in `src/lib/purchases.ts`. Apple rejects subscription apps without it.
3. **Subscriptions.** Create the yearly (3-day trial) and monthly products in App Store Connect, connect them in RevenueCat, then replace the bodies of `purchase` and `restorePurchases` in `src/lib/purchases.ts`. That needs a development build (`npx expo install expo-dev-client react-native-purchases`, then `npx eas-cli@latest build --profile preview`), because Expo Go can't run in-app purchases.
4. **Store listing.** Name, subtitle and keywords are in `docs/store-listing.md`. The App Privacy answer is "Data Not Collected".
5. **Build and submit.** `npx eas-cli@latest build --platform ios --profile production`, then `npx eas-cli@latest submit --platform ios`. Build numbers increase automatically (`eas.json`).
6. **Check on a real iPhone** that the ayah-end markers (۝ with a number) render as numbered circles, and that memorise mode wraps well on longer duas.

Optional once you have users: crash reporting (Sentry has an Expo guide) and daily reminder notifications.
