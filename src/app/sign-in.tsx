import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArtPanel } from '@/components/art';
import { SignInPanel } from '@/components/sign-in-panel';
import { makeStyles } from '@/theme/theme';

/** Signing in from the You tab. New accounts are usually made at the end of onboarding instead. */
export default function SignIn() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.screen}>
      <ArtPanel art="blue" caption="bottom" style={{ height: height * 0.4 }} />
      <SignInPanel initialMode="in" onDone={leave} bottomInset={insets.bottom + 16} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
}));
