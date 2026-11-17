import type { ImageSource } from 'expo-image';

/**
 * The scenes behind the card styles that aren't Glow or Plain: four for each world, so cards in one style differ.
 * All of them are light in darkness, in the light theme too. They are painted by code from noise, not photographed
 * and not made by an AI model; `build-scenes.cjs` in the icon toolkit paints them again.
 */
export type World = 'night' | 'radiance' | 'violet' | 'gold' | 'ember';

export const SCENES: Record<World, readonly ImageSource[]> = {
  night: [
    require('../../assets/scenes/night-1.jpg'),
    require('../../assets/scenes/night-2.jpg'),
    require('../../assets/scenes/night-3.jpg'),
    require('../../assets/scenes/night-4.jpg'),
  ],
  radiance: [
    require('../../assets/scenes/radiance-1.jpg'),
    require('../../assets/scenes/radiance-2.jpg'),
    require('../../assets/scenes/radiance-3.jpg'),
    require('../../assets/scenes/radiance-4.jpg'),
  ],
  violet: [
    require('../../assets/scenes/violet-1.jpg'),
    require('../../assets/scenes/violet-2.jpg'),
    require('../../assets/scenes/violet-3.jpg'),
    require('../../assets/scenes/violet-4.jpg'),
  ],
  gold: [
    require('../../assets/scenes/gold-1.jpg'),
    require('../../assets/scenes/gold-2.jpg'),
    require('../../assets/scenes/gold-3.jpg'),
    require('../../assets/scenes/gold-4.jpg'),
  ],
  ember: [
    require('../../assets/scenes/ember-1.jpg'),
    require('../../assets/scenes/ember-2.jpg'),
    require('../../assets/scenes/ember-3.jpg'),
    require('../../assets/scenes/ember-4.jpg'),
  ],
};
