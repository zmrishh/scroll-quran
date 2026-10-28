import type { ImageSource } from 'expo-image';

/**
 * Illumination from Quran manuscripts in The Metropolitan Museum of Art, released as public domain (CC0)
 * through its Open Access programme. Cropped for the app; credited on the Sources screen.
 */
export type Art = { source: ImageSource; title: string; place: string; url: string };

export const ART = {
  fatiha: {
    source: require('../../assets/art/fatiha.jpg'),
    title: 'Opening of Al-Fatiha',
    place: 'India, about 1800',
    url: 'https://www.metmuseum.org/art/collection/search/456964',
  },
  rosette: {
    source: require('../../assets/art/rosette.jpg'),
    title: 'Qur’an of Ibrahim Sultan',
    place: 'Iran, 1427',
    url: 'https://www.metmuseum.org/art/collection/search/446540',
  },
  blue: {
    source: require('../../assets/art/blue.jpg'),
    title: 'The Blue Qur’an',
    place: 'Tunisia, 9th–10th century',
    url: 'https://www.metmuseum.org/art/collection/search/454662',
  },
  baghdad: {
    source: require('../../assets/art/baghdad.jpg'),
    title: 'Anonymous Baghdad Qur’an',
    place: 'Iraq, 1307',
    url: 'https://www.metmuseum.org/art/collection/search/451015',
  },
  morocco: {
    source: require('../../assets/art/morocco.jpg'),
    title: 'Opening pages of a Qur’an',
    place: 'Morocco, 18th century',
    url: 'https://www.metmuseum.org/art/collection/search/453165',
  },
} satisfies Record<string, Art>;

export type ArtKey = keyof typeof ART;

/**
 * Soft backgrounds for the Glow card style: single pages from ten Met manuscripts (Tunisia, India, Iran, Turkey,
 * Morocco, Iraq, Andalusia), blurred so they read as light and colour behind the verse.
 */
export const GLOW: readonly ImageSource[] = [
  require('../../assets/glow/glow-1.jpg'),
  require('../../assets/glow/glow-2.jpg'),
  require('../../assets/glow/glow-3.jpg'),
  require('../../assets/glow/glow-4.jpg'),
  require('../../assets/glow/glow-5.jpg'),
  require('../../assets/glow/glow-6.jpg'),
  require('../../assets/glow/glow-7.jpg'),
  require('../../assets/glow/glow-8.jpg'),
  require('../../assets/glow/glow-9.jpg'),
  require('../../assets/glow/glow-10.jpg'),
];
