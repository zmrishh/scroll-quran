import type { World } from './scenes';

export type CardStyleId = 'glow' | 'night' | 'baghdad' | 'blue' | 'rosette' | 'morocco' | 'fatiha';

/**
 * A look for the cards. Glow and Plain follow the app's theme; the others each set the card in a world of their
 * own: a scene of light in darkness behind the verse, with colours to match. product is the store product ID; null
 * means free for everyone. The ids are older than the names: they're kept because they are saved on people's phones
 * and are part of the product IDs.
 */
export type CardStyle = {
  id: CardStyleId;
  name: string;
  world: World | null;
  product: string | null;
};

export const CARD_STYLES: readonly CardStyle[] = [
  // Glow: a different blurred manuscript page behind each card (GLOW in data/art.ts). Plain: the bare page, in either theme.
  { id: 'glow', name: 'Glow', world: null, product: null },
  { id: 'night', name: 'Plain', world: null, product: null },
  { id: 'baghdad', name: 'Gold', world: 'gold', product: null },
  { id: 'blue', name: 'Night', world: 'night', product: 'style_blue' },
  { id: 'fatiha', name: 'Radiance', world: 'radiance', product: 'style_fatiha' },
  { id: 'rosette', name: 'Violet', world: 'violet', product: 'style_rosette' },
  { id: 'morocco', name: 'Ember', world: 'ember', product: 'style_morocco' },
];

/** One purchase that unlocks every paid style. */
export const ALL_STYLES_PRODUCT = 'style_all';

export const STYLE_PRODUCTS = [...CARD_STYLES.flatMap((s) => (s.product ? [s.product] : [])), ALL_STYLES_PRODUCT];

export const cardStyle = (id: string) => CARD_STYLES.find((s) => s.id === id) ?? CARD_STYLES[0];

/** Owned when it's free, comes with Plus, or was bought on its own or in the bundle. */
export const ownsStyle = (style: CardStyle, owned: readonly string[], plus: boolean) =>
  plus || !style.product || owned.includes(style.product) || owned.includes(ALL_STYLES_PRODUCT);

export const PAID_STYLES = CARD_STYLES.filter((s) => s.product);
