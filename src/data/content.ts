import quran from './quran.json';

export type Topic =
  | 'peace'
  | 'patience'
  | 'gratitude'
  | 'forgiveness'
  | 'hope'
  | 'trust'
  | 'mercy'
  | 'guidance';

export const TOPICS: readonly { id: Topic; label: string; arabic: string; blurb: string }[] = [
  { id: 'peace', label: 'Peace', arabic: 'سكينة', blurb: 'A calmer heart' },
  { id: 'patience', label: 'Patience', arabic: 'صبر', blurb: 'Holding on in hard times' },
  { id: 'gratitude', label: 'Gratitude', arabic: 'شكر', blurb: 'Noticing what you have' },
  { id: 'forgiveness', label: 'Forgiveness', arabic: 'مغفرة', blurb: 'Coming back after a mistake' },
  { id: 'hope', label: 'Hope', arabic: 'رجاء', blurb: 'Ease after hardship' },
  { id: 'trust', label: 'Trust', arabic: 'توكل', blurb: 'Letting go of control' },
  { id: 'mercy', label: 'Mercy', arabic: 'رحمة', blurb: 'Love that holds you' },
  { id: 'guidance', label: 'Guidance', arabic: 'هداية', blurb: 'Knowing the way' },
];

export const topicLabel = (t: Topic) => TOPICS.find((x) => x.id === t)?.label ?? t;

export type Ayah = { n: number; ar: string; en: string };

export type Passage = {
  id: string;
  surah: number;
  surahName: string;
  from: number;
  to: number;
  bismillah: boolean;
  ayat: Ayah[];
  topics: Topic[];
  /** The line the card highlights; a verbatim substring of the translation. */
  key: string;
  /** Who is speaking, when it is a person (Musa, Luqman…). */
  speaker: string | null;
};

export type Dua = Passage & { title: string; when: string };

export type Surah = { n: number; name: string; ayahs: number; arabic: string; meaning: string; type: 'Meccan' | 'Medinan' };

export type DivineName = {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
  reflection: string;
  /** Three root letters, in Arabic order (right to left). */
  root: [string, string, string];
  rootLatin: string;
  rootSense: string;
  ref?: string;
  topics: Topic[];
};

export type Dhikr = {
  id: string;
  arabic: string;
  translit: string;
  /** The transliteration broken into sayable pieces. */
  beats: string[];
  meaning: string;
  target: number;
  topics: Topic[];
};

export const PASSAGES = quran.ayat as Passage[];
export const DUAS = quran.duas as Dua[];
export const SURAHS = quran.surahs as Surah[];
export const ATTRIBUTION = quran._notice;

export const surahInfo = (n: number) => SURAHS[n - 1];

// Quran references for each name were checked against the Tanzil text (scripts/source).
export const NAMES: readonly DivineName[] = [
  { id: 'ar-rahman', arabic: 'الرحمن', translit: 'Ar-Rahman', meaning: 'The Most Compassionate', reflection: 'His compassion was there before you asked for it.', root: ['ر', 'ح', 'م'], rootLatin: 'r · ḥ · m', rootSense: 'womb, tender care', ref: 'Al-Fatihah 1:3', topics: ['mercy'] },
  { id: 'ar-rahim', arabic: 'الرحيم', translit: 'Ar-Rahim', meaning: 'The Most Merciful', reflection: 'Mercy that stays with you, every day.', root: ['ر', 'ح', 'م'], rootLatin: 'r · ḥ · m', rootSense: 'womb, tender care', ref: 'Al-Fatihah 1:3', topics: ['mercy'] },
  { id: 'as-salam', arabic: 'السلام', translit: 'As-Salam', meaning: 'The Source of Peace', reflection: 'Every calm moment you have had came from Him.', root: ['س', 'ل', 'م'], rootLatin: 's · l · m', rootSense: 'peace, being whole and safe', ref: 'Al-Hashr 59:23', topics: ['peace'] },
  { id: 'al-wadud', arabic: 'الودود', translit: 'Al-Wadud', meaning: 'The Most Loving', reflection: 'Call on Al-Wadud when you feel unseen.', root: ['و', 'د', 'د'], rootLatin: 'w · d · d', rootSense: 'love, warm affection', ref: 'Hud 11:90', topics: ['mercy', 'peace'] },
  { id: 'al-ghaffar', arabic: 'الغفار', translit: 'Al-Ghaffar', meaning: 'The Ever-Forgiving', reflection: 'Forgiving again, and again, and again.', root: ['غ', 'ف', 'ر'], rootLatin: 'gh · f · r', rootSense: 'to cover over, to forgive', ref: 'Nuh 71:10', topics: ['forgiveness'] },
  { id: 'at-tawwab', arabic: 'التواب', translit: 'At-Tawwab', meaning: 'The Accepter of Repentance', reflection: 'Each time you turn back, He turns towards you.', root: ['ت', 'و', 'ب'], rootLatin: 't · w · b', rootSense: 'to turn back, return', ref: 'Al-Baqarah 2:37', topics: ['forgiveness', 'hope'] },
  { id: 'al-afuw', arabic: 'العفو', translit: "Al-'Afuw", meaning: 'The Pardoner', reflection: 'He pardons, and wipes away the trace of it.', root: ['ع', 'ف', 'و'], rootLatin: 'ʿ · f · w', rootSense: 'to pardon, to wipe away', ref: 'An-Nisa 4:43', topics: ['forgiveness'] },
  { id: 'al-wakil', arabic: 'الوكيل', translit: 'Al-Wakil', meaning: 'The Trustee', reflection: 'Hand Him what you cannot carry.', root: ['و', 'ك', 'ل'], rootLatin: 'w · k · l', rootSense: 'to entrust, to rely on', ref: 'Al-Ahzab 33:3', topics: ['trust'] },
  { id: 'al-mujib', arabic: 'المجيب', translit: 'Al-Mujib', meaning: 'The Responsive', reflection: 'No sincere prayer goes unheard.', root: ['ج', 'و', 'ب'], rootLatin: 'j · w · b', rootSense: 'to answer, respond', ref: 'Hud 11:61', topics: ['hope'] },
  { id: 'al-latif', arabic: 'اللطيف', translit: 'Al-Latif', meaning: 'The Subtle, the Gentle', reflection: 'He arranges things in ways you only notice later.', root: ['ل', 'ط', 'ف'], rootLatin: 'l · ṭ · f', rootSense: 'gentle, subtle, kind', ref: 'Al-Mulk 67:14', topics: ['peace', 'trust'] },
  { id: 'ash-shakur', arabic: 'الشكور', translit: 'Ash-Shakur', meaning: 'The Most Appreciative', reflection: 'He notices and rewards your smallest good.', root: ['ش', 'ك', 'ر'], rootLatin: 'sh · k · r', rootSense: 'thanks, appreciation', ref: 'Fatir 35:30', topics: ['gratitude'] },
  { id: 'al-hadi', arabic: 'الهادي', translit: 'Al-Hadi', meaning: 'The Guide', reflection: 'Ask Him for the next step, not the whole map.', root: ['ه', 'د', 'ي'], rootLatin: 'h · d · y', rootSense: 'to guide, show the way', ref: 'Al-Furqan 25:31', topics: ['guidance'] },
  { id: 'an-nur', arabic: 'النور', translit: 'An-Nur', meaning: 'The Light', reflection: 'Light upon light, for every dark corner.', root: ['ن', 'و', 'ر'], rootLatin: 'n · w · r', rootSense: 'light', ref: 'An-Nur 24:35', topics: ['guidance', 'hope'] },
  { id: 'ar-razzaq', arabic: 'الرزاق', translit: 'Ar-Razzaq', meaning: 'The Provider', reflection: 'What is written for you will reach you.', root: ['ر', 'ز', 'ق'], rootLatin: 'r · z · q', rootSense: 'provision, sustenance', ref: 'Adh-Dhariyat 51:58', topics: ['trust'] },
  { id: 'al-fattah', arabic: 'الفتاح', translit: 'Al-Fattah', meaning: 'The Opener', reflection: 'He opens doors you did not know were there.', root: ['ف', 'ت', 'ح'], rootLatin: 'f · t · ḥ', rootSense: 'to open, to decide', ref: 'Saba 34:26', topics: ['hope'] },
  { id: 'al-wahhab', arabic: 'الوهاب', translit: 'Al-Wahhab', meaning: 'The Bestower', reflection: 'He gives without being asked.', root: ['و', 'ه', 'ب'], rootLatin: 'w · h · b', rootSense: 'a gift given freely', ref: "Ali 'Imran 3:8", topics: ['gratitude'] },
  { id: 'al-karim', arabic: 'الكريم', translit: 'Al-Karim', meaning: 'The Most Generous', reflection: 'His generosity is bigger than your mistakes.', root: ['ك', 'ر', 'م'], rootLatin: 'k · r · m', rootSense: 'generosity, nobility', ref: 'Al-Infitar 82:6', topics: ['gratitude', 'mercy'] },
  { id: 'al-halim', arabic: 'الحليم', translit: 'Al-Halim', meaning: 'The Forbearing', reflection: 'He gives you time to come back.', root: ['ح', 'ل', 'م'], rootLatin: 'ḥ · l · m', rootSense: 'forbearance, calm', ref: 'Al-Baqarah 2:225', topics: ['patience', 'mercy'] },
  { id: 'as-sabur', arabic: 'الصبور', translit: 'As-Sabur', meaning: 'The Most Patient', reflection: 'Be patient. The Most Patient is with you.', root: ['ص', 'ب', 'ر'], rootLatin: 'ṣ · b · r', rootSense: 'patience, endurance', topics: ['patience'] },
  { id: 'al-hafiz', arabic: 'الحفيظ', translit: 'Al-Hafiz', meaning: 'The Preserver', reflection: 'Nothing you entrust to Him is lost.', root: ['ح', 'ف', 'ظ'], rootLatin: 'ḥ · f · ẓ', rootSense: 'to guard, preserve', ref: 'Hud 11:57', topics: ['trust'] },
  { id: 'al-qarib', arabic: 'القريب', translit: 'Al-Qarib', meaning: 'The Near', reflection: 'Closer than you think. Just speak.', root: ['ق', 'ر', 'ب'], rootLatin: 'q · r · b', rootSense: 'nearness', ref: 'Al-Baqarah 2:186', topics: ['hope', 'peace'] },
  { id: 'al-hayy', arabic: 'الحي', translit: 'Al-Hayy', meaning: 'The Ever-Living', reflection: 'Rely on the One who never dies.', root: ['ح', 'ي', 'ي'], rootLatin: 'ḥ · y · y', rootSense: 'life', ref: 'Al-Baqarah 2:255', topics: ['trust'] },
  { id: 'al-aziz', arabic: 'العزيز', translit: "Al-'Aziz", meaning: 'The Almighty', reflection: 'Your strength comes from the One who is never overcome.', root: ['ع', 'ز', 'ز'], rootLatin: 'ʿ · z · z', rootSense: 'might, honour', ref: 'Al-Hashr 59:23', topics: ['trust'] },
  { id: 'ar-rauf', arabic: 'الرءوف', translit: "Ar-Ra'uf", meaning: 'The Most Kind', reflection: 'Tender kindness, even when you feel undeserving.', root: ['ر', 'ء', 'ف'], rootLatin: 'r · ʾ · f', rootSense: 'tender kindness', ref: 'Al-Baqarah 2:143', topics: ['mercy'] },
  { id: 'al-khaliq', arabic: 'الخالق', translit: 'Al-Khaliq', meaning: 'The Creator', reflection: 'He made you on purpose, with purpose.', root: ['خ', 'ل', 'ق'], rootLatin: 'kh · l · q', rootSense: 'to create, to shape', ref: 'Al-Hashr 59:24', topics: ['guidance'] },
];

export const DHIKR: readonly Dhikr[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', translit: 'SubhanAllah', beats: ['Sub', 'ḥā', 'nal', 'lāh'], meaning: 'Glory be to Allah', target: 33, topics: ['peace'] },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', translit: 'Alhamdulillah', beats: ['Al', 'ḥam', 'du', 'lil', 'lāh'], meaning: 'All praise is for Allah', target: 33, topics: ['gratitude'] },
  { id: 'allahu-akbar', arabic: 'اللَّهُ أَكْبَرُ', translit: 'Allahu Akbar', beats: ['Al', 'lā', 'hu', 'Ak', 'bar'], meaning: 'Allah is the Greatest', target: 33, topics: ['hope', 'trust'] },
  { id: 'la-ilaha', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translit: 'La ilaha illallah', beats: ['Lā', 'i', 'lā', 'ha', 'il', 'lal', 'lāh'], meaning: 'There is no god but Allah', target: 33, topics: ['guidance'] },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', translit: 'Astaghfirullah', beats: ['As', 'tagh', 'fi', 'rul', 'lāh'], meaning: 'I seek the forgiveness of Allah', target: 33, topics: ['forgiveness'] },
  { id: 'subhanallahi-wa-bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', translit: 'SubhanAllahi wa bihamdihi', beats: ['Subḥān', 'allāhi', 'wa', 'bi', 'ḥamdihi'], meaning: 'Glory be to Allah, and praise be to Him', target: 33, topics: ['peace', 'gratitude'] },
  { id: 'la-hawla', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translit: 'La hawla wa la quwwata illa billah', beats: ['Lā ḥawla', 'wa lā', 'quwwata', 'illā', 'billāh'], meaning: 'There is no power and no strength except through Allah', target: 33, topics: ['trust', 'patience'] },
  { id: 'hasbunallah', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translit: "Hasbunallahu wa ni'mal wakil", beats: ['Ḥasbunallāhu', 'wa niʿma', 'l-wakīl'], meaning: 'Allah is sufficient for us, and He is the best Trustee', target: 33, topics: ['trust'] },
];

export type ContentKind = 'ayah' | 'dua' | 'name' | 'dhikr';

/** Stable key for likes and saves: "<kind>:<id>". */
export const contentKey = (kind: ContentKind, id: string) => `${kind}:${id}`;

export function lookup(key: string) {
  const i = key.indexOf(':');
  const kind = key.slice(0, i) as ContentKind;
  const id = key.slice(i + 1);
  switch (kind) {
    case 'ayah':
      return { kind, item: PASSAGES.find((p) => p.id === id) } as const;
    case 'dua':
      return { kind, item: DUAS.find((p) => p.id === id) } as const;
    case 'name':
      return { kind, item: NAMES.find((p) => p.id === id) } as const;
    case 'dhikr':
      return { kind, item: DHIKR.find((p) => p.id === id) } as const;
  }
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arabicNumber = (n: number) =>
  String(n)
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join('');

export const passageNumbers = (p: Passage) => `${p.surah}:${p.from}${p.to !== p.from ? `–${p.to}` : ''}`;
export const passageRef = (p: Passage) => `${p.surahName} ${passageNumbers(p)}`;

export const passageEnglish = (p: Passage) => p.ayat.map((a) => a.en).join(' ');
export const passageArabicLength = (p: Passage) => p.ayat.reduce((s, a) => s + a.ar.length, 0);

/** Rough reading time for the English, rounded to 5 seconds (≈200 words a minute). */
export function readingSeconds(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.round(words / 3.3 / 5) * 5);
}

/**
 * Splits a translation into sentence-sized lines. Pickthall's "Lo!" opens a clause rather than
 * ending one, so lines break before it, never after; very short pieces join the next line.
 */
export function splitLines(text: string): string[] {
  const raw = text.split(/(?<=[.;:?])\s+|(?<=(?<![Ll]o)!)\s+|(?<=,)\s+(?=Lo!)/);
  const out: string[] = [];
  let carry = '';
  for (const piece of raw) {
    const line = carry ? `${carry} ${piece}` : piece;
    if (line.length < 22) carry = line;
    else {
      out.push(line);
      carry = '';
    }
  }
  if (carry) {
    if (out.length) out[out.length - 1] += ` ${carry}`;
    else out.push(carry);
  }
  return out;
}
