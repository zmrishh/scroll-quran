import type { Ayah } from './content';

type FullQuran = { _notice: string; s: [string, string][][] };

let cache: FullQuran | null = null;

/** The whole Quran (2 MB), parsed the first time the reader needs it rather than at app start. */
function fullQuran(): FullQuran {
  if (!cache) cache = require('./quran-full.json') as FullQuran;
  return cache;
}

export function surahAyat(n: number): Ayah[] {
  return fullQuran().s[n - 1].map(([ar, en], i) => ({ n: i + 1, ar, en }));
}
