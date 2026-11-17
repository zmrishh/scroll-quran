import { Slot } from 'expo-router';

import { PaletteOverride, useFeedColors } from '@/theme/theme';

/**
 * A single card on its own screen, opened from Saved. It is a feed card, so the screen is in the feed's colours: a
 * card style's world is dark in both themes, and the close button and the reflection sit on its scene.
 */
export default function CardLayout() {
  return (
    <PaletteOverride.Provider value={useFeedColors()}>
      <Slot />
    </PaletteOverride.Provider>
  );
}
