# App Store submission

What App Review checks that lives outside the code, and the note to paste for the reviewer. The app side is
handled: sign-in is optional, account deletion is in the app, the paywall has prices, renewal terms, Terms, Privacy and
Restore, photo and location permissions have usage text, the privacy manifest is in `app.json`, the icon has no alpha
channel, and a production build refuses to start without the RevenueCat key.

## Before you submit

1. **Agreements.** App Store Connect → Business: the Paid Apps agreement signed, with bank and tax details. Without it,
   in-app purchases don't load for the reviewer and the app is rejected for a broken paywall.
2. **In-app purchases, submitted with the build.** Create the yearly and monthly subscriptions (one subscription group,
   no free trial) and the five card-style non-consumables (`style_blue`, `style_rosette`,
   `style_morocco`, `style_fatiha`, `style_all`). Give each a display name, description and review screenshot, and add
   them to the version on the submission page. Products that aren't submitted with the first build can't be bought in
   review.
3. **RevenueCat** has the iOS key in `.env`, the `plus` entitlement and the Annual and Monthly packages in the
   current offering.
4. **Web pages live.** Turn on GitHub Pages so the privacy policy and support URLs open:
   `https://zmrishh.github.io/scroll-quran/privacy.html` and `https://zmrishh.github.io/scroll-quran/`.
5. **App information.** Privacy Policy URL and Support URL as above. Licence agreement: Apple's standard EULA (the
   default). Category: Reference or Books. Age rating: 4+.
6. **App Privacy.** For purchases: **User ID** and **Purchase history**, both linked to the user, used for app
   functionality. For the ads in the free version, add what Google's ad SDK collects, used for third-party
   advertising and analytics: **Coarse location** (from the IP address), **Device ID**, **Advertising data**,
   **Product interaction**, **Crash data** and **Performance data**. Google keeps the list at
   developers.google.com/admob/ios/privacy/data-disclosure; check it before each submission. Tracking: **No**. The app
   never asks for tracking permission and asks only for non-personalised ads. Name, email and the location used for
   prayer times stay on the phone.
   **AdMob** has the iOS app and its banner ad unit, the real app ID is in `app.json` and the unit ID in `.env`
   (see the README), sensitive ad categories are blocked, and the European regulations message is published.
7. **Screenshots** from the real app (6.9-inch iPhone set). No prices or claims that differ from the paywall, and no
   other platforms in the text or images.
8. **Description** without "Android", "Google Play" or "free trial".
9. **Test on a real iPhone** with a sandbox Apple ID: buy Plus, restore it, buy and restore a card style, sign in with
   Apple, delete the account, share a card and tap Save Image, show prayer times, turn on prayer alerts.

## Note for the reviewer

Paste into App Review Information → Notes:

> Scroll Quran is a short-form Quran reader. No account is needed: complete the three onboarding questions, then tap
> "Not now" on the sign-in screen, or use Sign in with Apple.
>
> The free version shows Google AdMob ads on cards of their own in the feed, after every five cards; they are
> non-personalised and the app does not ask to track. Scroll Quran Plus removes them.
>
> In-app purchases: Scroll Quran Plus (yearly and monthly) is offered after onboarding and from the ad cards in the
> feed. Card styles are under You → Card style; Plus includes them, and they can also be bought one at a time. Restore Purchases is on
> both screens.
>
> Location is requested only when you tap "Show today's prayers" on the Quran tab, and is used on the device to work out
> prayer times. It is not sent anywhere.
>
> Prayer alerts (part of Plus) are local notifications scheduled on the device: Quran tab → tap the prayer card →
> Prayer alerts. Notification permission is asked only when you turn them on.
>
> The Arabic text is the Tanzil Quran Text (CC BY 3.0) and the English is Pickthall's public-domain translation. The art
> is public-domain illumination from The Metropolitan Museum of Art's Open Access collection.
