// Extends app.json. Google sign-in's config plugin needs the iOS client ID's URL scheme and fails the
// build without one, so it's only added once EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set in .env.
// Until then the app simply doesn't offer Google sign-in on iOS.
module.exports = ({ config }) => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) return config;
  // "123-abc.apps.googleusercontent.com" becomes "com.googleusercontent.apps.123-abc".
  const iosUrlScheme = `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;
  return { ...config, plugins: [...config.plugins, ['@react-native-google-signin/google-signin', { iosUrlScheme }]] };
};
