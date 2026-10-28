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

Done in the code: the icon, Android adaptive icon and splash (the ۞ mark), the privacy and support pages in `site/`, RevenueCat purchases in `src/lib/purchases.ts`, and Apple and Google sign-in in `src/lib/auth.ts`. Things only you can do, roughly in order:

1. **Publish the pages.** On GitHub: Settings → Pages → Source: **GitHub Actions**. The `Website` workflow then publishes `site/` on every push that changes it, at `https://zmrishh.github.io/scroll-quran/` (support) and `…/privacy.html` (the app already links there). GitHub Pages needs a public repo or a paid plan; if you'd rather not, drag `site/` onto Netlify Drop and update `LINKS.privacy`.
2. **Purchases.**
   - App Store Connect and Google Play Console: create a yearly and a monthly subscription (no free trial), a one-time **lifetime** product for Plus, and one-time products for the card styles with these IDs: `style_blue`, `style_rosette`, `style_morocco`, `style_fatiha` (suggested $2.99 each) and `style_all` (suggested $7.99). On iOS the one-time products are non-consumables.
   - RevenueCat: add both apps, an entitlement called `plus` with the yearly, monthly and lifetime products, and a current offering with them in the **Annual**, **Monthly** and **Lifetime** packages. The style products only need to exist in RevenueCat; the app checks them by product ID, so they need no entitlement or offering.
   - Card styles come from `src/data/styles.ts`; Baghdad is free for everyone. To add a style, crop another public-domain manuscript from The Met into `assets/art/`, add it to `src/data/art.ts` and `src/data/styles.ts`, and create its product.
   - Put the two public SDK keys in `.env` (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`).
   - Prices, currency and the yearly saving then come from the store; the paywall hides Lifetime if the offering has no Lifetime package. Without keys the paywall runs in demo mode in development, and a release build refuses to unlock.
   - Test real purchases with a preview build (`npx eas-cli@latest build --profile preview`) and a sandbox or test account. Expo Go only runs RevenueCat's mock mode.
3. **Sign-in.** There's no server: Apple or Google confirms who someone is, and their account ID becomes their RevenueCat customer, so Plus follows them to a new phone. Saved cards stay on the phone.
   - Apple (iPhone): nothing to set up in code (`usesAppleSignIn` is on). EAS turns on the Sign in with Apple capability when it builds.
   - Google: in Google Cloud, create an OAuth consent screen, then an **iOS** client for `com.scrollquran.app` (put its ID in `.env` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) and an **Android** client for `com.scrollquran.app` with your signing SHA-1 (`npx eas-cli@latest credentials`, plus the Play App Signing SHA-1 from Play Console). Until the iOS ID is set, iPhone builds just don't show the Google button.
   - Neither works in Expo Go or the browser. Development builds there show a "Continue as test user" button instead; release builds never do.
   - Known gap: Apple asks apps that use Sign in with Apple to revoke the Apple token when an account is deleted, which needs a server. Delete account here erases the phone's data and unlinks the subscription, and tells people where to remove the app from their Apple ID.
4. **Store listing.** Name, subtitle and keywords are in `docs/store-listing.md`. Support URL: the GitHub Pages address above. App Privacy (Apple) and Data safety (Google): **User ID** and **Purchase history**, used for app functionality, linked to the user, not used for tracking. Name and email stay on the phone, so they don't count as collected.
5. **Build and submit.** `npx eas-cli@latest build --platform ios --profile production`, then `npx eas-cli@latest submit --platform ios`; the same with `--platform android`. Build numbers increase automatically (`eas.json`).
6. **Google Play testing.** A personal Play developer account created after November 2023 must run a closed test with at least 12 testers for 14 days in a row before it can publish to production.
7. **Check on a real iPhone and an Android phone** that the ayah-end markers (۝ with a number) render as numbered circles, that memorise mode wraps well on longer duas, and the splash and icon.

Optional once you have users: crash reporting (Sentry has an Expo guide) and daily reminder notifications.
