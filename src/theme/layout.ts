import { createContext, useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The floating tab bar: its capsule, and the gap above it. */
export const TAB_BAR = { height: 62, gap: 6 };

/** The room the tab bar keeps at the bottom of the screen: the capsule, sitting just above the home indicator. */
export const tabBarSpace = (insetBottom: number) => TAB_BAR.gap + TAB_BAR.height + Math.max(insetBottom - 8, 12);

/**
 * How much of the bottom of the screen the floating tab bar covers. The bar floats over the tabs' screens, so the page
 * runs on behind it; each screen keeps its last line or action row this far up. Zero outside the tabs.
 */
export const TabBarSpace = createContext(0);
export const useTabBarSpace = () => useContext(TabBarSpace);
export const HEADER_HEIGHT = 44;
export const FOOTER_HEIGHT = 44;

/** Space inside a feed card kept clear for the header above, and the reference row and tab bar below. */
export function useChrome() {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarSpace();
  return {
    insets,
    tabBar,
    contentTop: insets.top + HEADER_HEIGHT + 16,
    footerBottom: 10 + tabBar,
    contentBottom: FOOTER_HEIGHT + 26 + tabBar,
  };
}
