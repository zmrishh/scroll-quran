// Extends app.json.
module.exports = ({ config }) => {
  // A store build without its RevenueCat key would run the paywall in demo mode, and reviewers reject a paywall that
  // can't take payment (App Store guideline 2.1), so production builds stop here instead.
  const platform = process.env.EAS_BUILD_PLATFORM;
  if (process.env.EAS_BUILD_PROFILE === 'production' && platform) {
    const key = platform === 'android' ? 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY' : 'EXPO_PUBLIC_REVENUECAT_IOS_KEY';
    if (!process.env[key]) throw new Error(`${key} is empty. Add the RevenueCat key to .env before a production build.`);
  }

  // Google sign-in's config plugin needs the iOS client ID's URL scheme and fails the build without one, so it's only
  // added once EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set in .env. Until then the app doesn't offer Google sign-in on iOS.
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) return config;
  // "123-abc.apps.googleusercontent.com" becomes "com.googleusercontent.apps.123-abc".
  const iosUrlScheme = `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;
  return { ...config, plugins: [...config.plugins, ['@react-native-google-signin/google-signin', { iosUrlScheme }]] };
};
