import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 52;
export const HEADER_HEIGHT = 44;
export const FOOTER_HEIGHT = 44;

/** Space inside a feed card kept clear for the header above and the reference row below. */
export function useChrome() {
  const insets = useSafeAreaInsets();
  return {
    insets,
    contentTop: insets.top + HEADER_HEIGHT + 16,
    footerBottom: 10,
    contentBottom: FOOTER_HEIGHT + 26,
  };
}
