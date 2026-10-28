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

Done in the code: the icon, Android adaptive icon and splash (the ۞ mark), the privacy and support pages in `site/`, and RevenueCat purchases in `src/lib/purchases.ts`. Things only you can do, roughly in order:

1. **Publish the pages.** On GitHub: Settings → Pages → Source: **GitHub Actions**. The `Website` workflow then publishes `site/` on every push that changes it, at `https://zmrishh.github.io/scroll-quran/` (support) and `…/privacy.html` (the app already links there). GitHub Pages needs a public repo or a paid plan; if you'd rather not, drag `site/` onto Netlify Drop and update `LINKS.privacy`.
2. **Subscriptions.**
   - App Store Connect and Google Play Console: create a yearly subscription (3-day free trial) and a monthly one.
   - RevenueCat: add both apps, an entitlement called `plus` with both products, and a current offering with them in the **Annual** and **Monthly** packages.
   - Put the two public SDK keys in `.env` (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`).
   - Prices, currency and the trial length on the paywall then come from the store. Without keys the paywall runs in demo mode in development, and a release build refuses to unlock.
   - Test real purchases with a preview build (`npx eas-cli@latest build --profile preview`) and a sandbox or test account. Expo Go only runs RevenueCat's mock mode.
3. **Store listing.** Name, subtitle and keywords are in `docs/store-listing.md`. Support URL: the GitHub Pages address above. App Privacy (Apple) and Data safety (Google): **Purchase history**, used for app functionality, not linked to identity, not used for tracking. Nothing else is collected.
4. **Build and submit.** `npx eas-cli@latest build --platform ios --profile production`, then `npx eas-cli@latest submit --platform ios`; the same with `--platform android`. Build numbers increase automatically (`eas.json`).
5. **Google Play testing.** A personal Play developer account created after November 2023 must run a closed test with at least 12 testers for 14 days in a row before it can publish to production.
6. **Check on a real iPhone and an Android phone** that the ayah-end markers (۝ with a number) render as numbered circles, that memorise mode wraps well on longer duas, and the splash and icon.

Optional once you have users: crash reporting (Sentry has an Expo guide) and daily reminder notifications.
